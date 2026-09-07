// 버전 판단은 Manager가 하고, 이 도구는 세 설정 파일과 CHANGELOG를 일관되게 갱신합니다.
// 기본은 미리보기입니다. Reviewer PASS 후 --apply를 명시해야 파일을 씁니다.
const fs = require('node:fs');
const path = require('node:path');

function createPlan(root, mode = 'check', reason = '', now = new Date()) {
  if (!['check', 'patch', 'minor'].includes(mode)) throw new Error('check, patch, minor만 지원합니다. MAJOR는 자동 변경하지 않습니다.');
  if (['app.config.js', 'app.config.ts'].some((file) => fs.existsSync(path.join(root, file)))) {
    throw new Error('동적 Expo 설정이 있습니다. 실제 앱 버전 출처를 먼저 확인하세요.');
  }
  const files = ['app.json', 'package.json', 'package-lock.json'];
  const sources = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8'));
  const [app, pkg, lock] = sources.map((source) => JSON.parse(source.replace(/^\uFEFF/, '')));
  const version = app.expo?.version;
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error('앱 버전 형식을 확인하세요.');
  if ([pkg.version, lock.version, lock.packages?.['']?.version].some((v) => v !== version)) throw new Error('app/package/lock 버전이 다릅니다. 먼저 원인을 확인하세요.');
  if (mode === 'check') return { version, nextVersion: version, changes: [] };
  const [major, minor, patch] = version.split('.').map(Number);
  if (major !== 0) throw new Error('이 자동 도구는 개발 단계 0.x.x에만 사용합니다.');
  if (!reason.trim() || /[\r\n]/.test(reason)) throw new Error('--reason에 한 줄 변경 설명을 지정하세요.');
  const nextVersion = mode === 'minor' ? `0.${minor + 1}.0` : `0.${minor}.${patch + 1}`;
  app.expo.version = nextVersion; pkg.version = nextVersion; lock.version = nextVersion; lock.packages[''].version = nextVersion;
  const values = [app, pkg, lock];
  const changes = files.map((file, i) => {
    // JSON 전체를 재정렬하지 않고 현재 프로젝트에서 확인한 버전 위치만 바꿉니다.
    // 아래 JSON 비교로 같은 버전 번호를 가진 다른 패키지가 바뀌지 않았는지도 검증합니다.
    let remaining = file === 'package-lock.json' ? 2 : 1;
    const after = sources[i].replace(/("version"\s*:\s*")([^"]+)(")/g, (match, before, value, end) =>
      remaining > 0 && value === version ? (remaining--, `${before}${nextVersion}${end}`) : match);
    if (remaining || JSON.stringify(JSON.parse(after.replace(/^\uFEFF/, ''))) !== JSON.stringify(values[i])) {
      throw new Error(`${file} 구조가 달라 안전하게 수정할 수 없습니다.`);
    }
    return { file, before: sources[i], after };
  });
  const changelogPath = path.join(root, 'CHANGELOG.md');
  const before = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : null;
  const current = before ?? '# Changelog\n\n## [Unreleased]\n\n';
  if (current.includes(`## [${nextVersion}]`)) throw new Error('같은 버전의 CHANGELOG가 이미 있습니다. 중복 증가 여부를 확인하세요.');
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const entry = `## [${nextVersion}] - ${date}\n\n- ${reason.trim()}\n\n`;
  const at = current.search(/^## \[\d+\.\d+\.\d+\]/m);
  const after = at < 0 ? `${current.trimEnd()}\n\n${entry}` : current.slice(0, at) + entry + current.slice(at);
  changes.push({ file: 'CHANGELOG.md', before, after });
  return { version, nextVersion, changes };
}

function applyPlan(root, plan) {
  // 미리보기 이후 다른 Worker가 파일을 바꿨다면 덮어쓰지 않고 중단합니다.
  for (const change of plan.changes) {
    const file = path.join(root, change.file);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current !== change.before) throw new Error(`${change.file}이 변경되어 버전 적용을 중단합니다.`);
  }
  const attempted = [];
  try {
    for (const change of plan.changes) {
      // 디스크 오류는 일부 내용을 쓴 뒤에도 발생합니다. 쓰기 전에 복원 대상으로 등록합니다.
      attempted.push(change);
      fs.writeFileSync(path.join(root, change.file), change.after, 'utf8');
    }
  } catch (error) {
    // 하나의 복원이 실패해도 다른 파일의 복원은 계속하고, 수동 확인할 파일을 정확히 알립니다.
    const failed = [];
    for (const change of attempted.reverse()) {
      const file = path.join(root, change.file);
      try {
        if (change.before === null) { if (fs.existsSync(file)) fs.unlinkSync(file); }
        else fs.writeFileSync(file, change.before, 'utf8');
      } catch { failed.push(change.file); }
    }
    if (failed.length) throw new Error(`${error.message}; 복원 실패: ${failed.join(', ')}. 이 파일들을 직접 확인하세요.`);
    throw error;
  }
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2); const mode = args.shift() ?? 'check';
    let reason = ''; let apply = false;
    while (args.length) {
      const flag = args.shift();
      if (flag === '--apply') apply = true;
      else if (flag === '--reason') reason = args.shift() ?? '';
      else throw new Error(`알 수 없는 옵션: ${flag}`);
    }
    const root = path.resolve(__dirname, '..');
    const plan = createPlan(root, mode, reason);
    if (apply) applyPlan(root, plan);
    console.log(`${plan.version} -> ${plan.nextVersion} (${apply ? '적용' : '확인/미리보기'})`);
    for (const change of plan.changes) console.log(change.file);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { createPlan, applyPlan };
