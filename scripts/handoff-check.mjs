import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return '';
    const message = error?.stderr?.toString?.().trim() || error?.message || String(error);
    console.error(`git ${args.join(' ')} 실패: ${message}`);
    process.exit(1);
  }
}

function readSectionValue(content, heading) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return null;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (line && !line.startsWith('<!--')) return line;
  }

  return null;
}

const currentWorkPath = 'docs/CURRENT_WORK.md';
const branch = runGit(['branch', '--show-current']) || '(detached HEAD)';
const status = runGit(['status', '--short']);

console.log('\n[easy-do handoff check]');
console.log(`branch: ${branch}`);

if (branch === '(detached HEAD)') {
  console.log('주의: detached HEAD 상태입니다. 로컬/Codespace 전환 전에 일반 브랜치로 이동하세요.');
}

console.log('\n원격 상태를 확인합니다 (fetch만 수행하며 commit/push/pull은 하지 않습니다).');
runGit(['fetch', '--prune', 'origin']);

const upstream = runGit(
  ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
  { allowFailure: true },
);

let ahead = null;
let behind = null;

if (upstream) {
  const counts = runGit(['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
    .split(/\s+/)
    .map(Number);
  [behind, ahead] = counts;

  console.log(`upstream: ${upstream}`);
  console.log(`ahead: ${ahead} / behind: ${behind}`);
} else {
  console.log('upstream: 없음');
}

console.log('\nCURRENT_WORK:');
let currentWorkState = null;
if (!existsSync(currentWorkPath)) {
  console.log(`- ${currentWorkPath} 없음: 환경 전환 전에 handoff 인계문서를 만들어야 합니다.`);
} else {
  const currentWork = readFileSync(currentWorkPath, 'utf8');
  currentWorkState = readSectionValue(currentWork, '상태');
  console.log(`- 상태: ${currentWorkState || '알 수 없음'}`);
  if (status.includes(currentWorkPath)) {
    console.log('- CURRENT_WORK에 미커밋 변경이 있습니다. 다른 환경에는 아직 전달되지 않습니다.');
  }
}

console.log('\n작업 트리:');
if (status) {
  console.log(status);
  console.log('\n미커밋 변경이 있습니다. 이 상태는 다른 개발환경으로 자동 전달되지 않습니다.');
  console.log('기기를 바꾸려면 변경을 먼저 검토한 뒤, 사용자가 원할 때만 commit/push 하세요.');
} else {
  console.log('clean');
}

console.log('\n판정:');
if (!existsSync(currentWorkPath)) {
  console.log('- CURRENT_WORK 인계문서가 없어 환경 전환 준비가 완료되지 않았습니다.');
} else if (currentWorkState === 'idle' && status) {
  console.log('- CURRENT_WORK는 idle인데 작업 트리에 변경이 있습니다. handoff로 현재 작업을 먼저 기록하세요.');
}

if (!upstream) {
  console.log('- 현재 브랜치에 upstream이 없습니다. 원격 전환용 브랜치라면 upstream 설정 여부를 확인하세요.');
} else if (ahead > 0 && behind > 0) {
  console.log('- 로컬과 원격이 서로 갈라졌습니다. 자동 pull/push 하지 말고 차이를 먼저 확인하세요.');
} else if (behind > 0) {
  if (status) {
    console.log('- 원격에 새 커밋이 있지만 현재 미커밋 변경도 있습니다. 바로 pull하지 말고 먼저 현재 변경을 정리하세요.');
  } else {
    console.log('- 다른 환경의 새 커밋이 있습니다. 확인 후 `git pull --ff-only`로 가져오면 됩니다.');
  }
} else if (ahead > 0) {
  console.log('- 현재 환경의 커밋이 아직 원격에 없습니다. 확인 후 사용자가 원할 때만 push 하세요.');
} else if (status) {
  console.log('- 원격과 커밋 기준은 같지만 미커밋 변경이 남아 있습니다.');
} else {
  console.log('- 원격과 현재 환경이 동기화되어 있고 작업 트리도 깨끗합니다. 환경을 바꿔도 안전합니다.');
}

console.log('\n비Git 자료: `.local/`은 Git 동기화 대상이 아닙니다. 필요한 경우 Google Drive 등 별도 저장소로 관리하세요.\n');
