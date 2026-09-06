// 실행 방법: node scripts/test-todo-storage.cjs
// 설치된 TypeScript와 Node만 사용합니다. 실제 기기 저장소 대신 테스트용 저장소를 연결해 오류 상황도 재현합니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadSource(file, imports) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const context = { exports: {}, console: { warn() {} }, require: (name) => imports[name] ?? require(name) };
  vm.runInNewContext(compiled.outputText, context);
  return context.exports;
}

async function main() {
  let disk = null;
  let readFails = false;
  let writeFails = false;
  let releaseWrite;
  const writes = [];
  const mock = {
    async getItem() {
      if (readFails) throw new Error('Read failed');
      return disk;
    },
    async setItem(key, value) {
      writes.push(value);
      if (writeFails) throw new Error('Write failed');
      if (releaseWrite === null) await new Promise((resolve) => { releaseWrite = resolve; });
      disk = value;
    },
  };
  const storage = loadSource('src/storage/todo-storage.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: mock },
  });
  const { todosReducer: reduce, getTodoSummary: summary } = loadSource('src/hooks/use-todos.ts', {
    '@/storage/todo-storage': storage,
  });
  assert.equal((await storage.loadTodos()).length, 0);
  let todos = reduce([], { type: 'add', title: ' 첫 번째 ' });
  todos = reduce(todos, { type: 'add', title: '중요', priority: 'high' });
  todos = reduce(todos, { type: 'toggle', id: 1 });
  await storage.saveTodos(todos);
  let restored = await storage.loadTodos();
  assert.equal(JSON.stringify(restored), JSON.stringify(todos));
  assert.equal(summary(restored).completionRate, 50);
  restored = reduce(restored, { type: 'toggle', id: 1 });
  await storage.saveTodos(restored);
  assert.equal((await storage.loadTodos())[0].completed, false);

  // 초기 읽기 중에 추가·완료한 항목이 복원 뒤에도 남고, 고유 번호가 겹치지 않는지 확인합니다.
  let early = reduce([], { type: 'add', title: '불러오는 중 추가' });
  early = reduce(early, { type: 'toggle', id: 1 });
  const merged = reduce(early, { type: 'hydrate', todos: restored });
  assert.equal(merged.length, 3);
  assert.equal(merged[2].completed, true);
  assert.equal(new Set(merged.map((todo) => todo.id)).size, 3);
  assert.equal(reduce(merged, { type: 'add', title: '다음' })[3].id, 4);

  // 느린 저장을 일부러 대기시켜 이전 상태가 최신 완료 상태를 덮어쓰지 않는지 확인합니다.
  releaseWrite = null;
  const first = storage.saveTodos(restored);
  await Promise.resolve();
  const calls = writes.length;
  const second = storage.saveTodos(todos);
  await Promise.resolve();
  assert.equal(writes.length, calls);
  releaseWrite();
  await Promise.all([first, second]);
  assert.equal(disk, JSON.stringify(todos));

  for (const broken of ['{broken', '{}', '[null]', JSON.stringify([{ ...todos[0], priority: 'invalid' }]), JSON.stringify([todos[0], todos[0]])]) {
    disk = broken;
    assert.equal((await storage.loadTodos()).length, 0);
    assert.equal(disk, broken); // 읽기 실패만으로 원래 저장 내용을 덮어쓰지 않아야 합니다.
  }
  readFails = true;
  assert.equal((await storage.loadTodos()).length, 0);
  readFails = false;
  writeFails = true;
  await storage.saveTodos(todos);
  writeFails = false;
  await storage.saveTodos(restored);
  assert.equal(disk, JSON.stringify(restored));
  console.log('PASS: restore, completion/undo, startup merge, unique IDs, ordered writes, corrupt data, read/write failures and recovery');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
