// 임시 디렉터리에서만 버전을 바꿔 실제 프로젝트 버전과 기존 사용자 변경을 보호합니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createPlan, applyPlan } = require('./manage-version.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'easydo-version-test-'));
const originals = {
  'app.json': JSON.stringify({ expo: { version: '0.1.0', android: { versionCode: 42 } } }, null, 2),
  'package.json': JSON.stringify({ name: 'easy-do', version: '0.1.0', dependencies: { fixture: '0.1.0' } }, null, 2),
  'package-lock.json': JSON.stringify({ version: '0.1.0', packages: { '': { version: '0.1.0' }, 'node_modules/fixture': { version: '0.1.0' } } }, null, 2),
  'CHANGELOG.md': '# Changelog\n\n## [Unreleased]\n\n- 개발 설정\n\n## [0.1.0]\n\n- 기존\n',
};
const originalWrite = fs.writeFileSync;
function reset() { for (const [file, source] of Object.entries(originals)) originalWrite(path.join(root, file), source); }
function unchanged() { for (const [file, source] of Object.entries(originals)) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), source, file); }
try {
  reset();
  assert.equal(createPlan(root).version, '0.1.0');
  const patch = createPlan(root, 'patch', '버그 수정');
  assert.equal(patch.nextVersion, '0.1.1'); unchanged();
  applyPlan(root, patch);
  assert.equal(createPlan(root).version, '0.1.1');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'app.json'))).expo.android.versionCode, 42);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'))).packages['node_modules/fixture'].version, '0.1.0');
  assert.ok(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').includes('## [0.1.1]'));
  reset(); assert.equal(createPlan(root, 'minor', '새 기능').nextVersion, '0.2.0');
  assert.throws(() => createPlan(root, 'major', '안 됨'));
  assert.throws(() => createPlan(root, 'patch', ''));
  originalWrite(path.join(root, 'package.json'), '{"version":"0.2.0"}'); assert.throws(() => createPlan(root));
  reset(); const stale = createPlan(root, 'patch', '동시 변경');
  originalWrite(path.join(root, 'CHANGELOG.md'), '다른 작업'); assert.throws(() => applyPlan(root, stale));
  assert.equal(fs.readFileSync(path.join(root, 'app.json'), 'utf8'), originals['app.json']);
  reset();
  // 두 번째 쓰기가 파일을 일부 덮어쓴 뒤 실패하는 상황도 현재 파일까지 복원해야 합니다.
  let calls = 0;
  fs.writeFileSync = (file, data, ...args) => {
    if (++calls === 2) { originalWrite(file, '{partial'); throw new Error('simulated partial write'); }
    return originalWrite(file, data, ...args);
  };
  assert.throws(() => applyPlan(root, createPlan(root, 'patch', '쓰기 실패')), /partial write/);
  fs.writeFileSync = originalWrite; unchanged();
  // 복원 하나가 실패해도 앞서 변경한 다른 파일의 복원을 끝내고 실패 파일을 보고합니다.
  calls = 0;
  fs.writeFileSync = (file, data, ...args) => {
    calls++;
    if (calls === 2) { originalWrite(file, '{partial'); throw new Error('write failed'); }
    if (calls === 3) throw new Error('rollback failed');
    return originalWrite(file, data, ...args);
  };
  assert.throws(() => applyPlan(root, createPlan(root, 'patch', '복원 실패')), /복원 실패: package.json/);
  fs.writeFileSync = originalWrite;
  assert.equal(fs.readFileSync(path.join(root, 'app.json'), 'utf8'), originals['app.json']);
  console.log('PASS: 미리보기·PATCH/MINOR·MAJOR 거부·일치 검사·빌드번호/의존성 보존·동시 변경·부분 쓰기 및 복원 실패');
} finally {
  fs.writeFileSync = originalWrite;
  // 재귀 삭제는 이 테스트가 직접 만든 OS 임시 폴더에만 허용합니다.
  const resolved = path.resolve(root);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith('easydo-version-test-'));
  fs.rmSync(resolved, { recursive: true, force: true });
}
