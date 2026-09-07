// 실행: node scripts/test-todo-storage.cjs
// 기존 TypeScript와 Node만 사용해 실제 로직을 검사합니다. 휴대폰 UI 검사는 별도로 필요합니다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, console, ...globals, require: (name) => imports[name] ?? require(name) };
  vm.runInNewContext(code, context, { filename: file });
  return context.exports;
}
const dates = load('src/utils/due-date.ts');
const core = load('src/utils/todo-state.ts', { '@/utils/due-date': dates });
const stats = load('src/utils/todo-statistics.ts', { '@/utils/due-date': dates, '@/utils/todo-state': core });
const now = new Date(2026, 8, 7, 12).toISOString();
const tomorrow = new Date(2026, 8, 8, 0, 1).toISOString();
const reduce = (data, action, time = now) => core.updateData(data, action, time);
const ids = (rows) => rows.map((t) => t.id).join(',');
const plain = (value) => JSON.parse(JSON.stringify(value));
const tick = () => new Promise((resolve) => setImmediate(resolve));
const checks = [];
const test = (name, run) => checks.push({ name, run });
const oldKey = '@easy-do/todos/v1';
const newKey = '@easy-do/data/v2';

function fixture() {
  const disk = new Map(); const calls = [];
  const control = { readFails: false, writeFails: false, hold: null };
  const mock = {
    async removeItem(key) { if (control.writeFails) throw new Error('삭제 실패'); disk.delete(key); },
    async getItem(key) { if (control.readFails) throw new Error('읽기 실패'); return disk.get(key) ?? null; },
    async setItem(key, value) {
      calls.push(value);
      if (control.writeFails) throw new Error('쓰기 실패');
      if (control.hold) { const hold = control.hold; control.hold = null; await hold; }
      disk.set(key, value);
    },
  };
  const storage = load('src/storage/todo-storage.ts', { '@/utils/due-date': dates, '@/utils/todo-state': core,
    '@react-native-async-storage/async-storage': { __esModule: true, default: mock } });
  return { storage, disk, calls, control };
}

test('기본값·공백 검증·수정·기한 제거·완료 취소·ID 재사용 방지', () => {
  let data = core.emptyData();
  assert.equal(reduce(data, { type: 'add', title: ' ' }), data);
  data = reduce(data, { type: 'add', title: ' 첫 일 ' });
  assert.equal(data.todos[0].title, '첫 일');
  assert.equal(data.todos[0].priority, 'normal');
  assert.equal(data.todos[0].createdAt, now);
  data = reduce(data, { type: 'toggle', id: 1 });
  assert.equal(data.todos[0].completedAt, now);
  data = reduce(data, { type: 'edit', id: 1, changes: { title: '수정', priority: 'high', dueDate: '2028-02-29' } });
  assert.equal(data.todos[0].completed, true);
  assert.equal(data.todos[0].dueDate, '2028-02-29');
  for (const changes of [{ title: ' ', priority: 'normal' }, { title: '유지', priority: 'normal', dueDate: '2027-02-29' }]) {
    assert.equal(reduce(data, { type: 'edit', id: 1, changes }), data);
  }
  data = reduce(data, { type: 'edit', id: 1, changes: { title: '수정', priority: 'low', dueDate: undefined } });
  assert.equal(data.todos[0].dueDate, undefined);
  data = reduce(data, { type: 'toggle', id: 1 });
  assert.equal(data.todos[0].completedAt, undefined);
  data = reduce(data, { type: 'delete', id: 1 });
  data = reduce(data, { type: 'add', title: '새 일' });
  assert.equal(data.todos[0].id, 2);
  assert.equal(core.getTodoSummary([]).completionRate, 0);
});

test('모든 보기와 완료 구역: 우선순위 → 생성 순서, 진행률', () => {
  let data = reduce(core.emptyData(), { type: 'list-add', name: '학교' });
  for (const priority of ['low', 'high', 'normal', 'high', 'low']) {
    data = reduce(data, { type: 'add', title: priority, priority, listId: 1 });
    const todo = data.todos.at(-1);
    data = reduce(data, { type: 'edit', id: todo.id, changes: { ...todo, dueDate: '2026-09-07', recurrence: { type: 'daily', startDate: '2026-09-07' } } });
  }
  for (const view of ['all', 'today', 'week', 'urgent', 'routine', 'list:1']) {
    assert.equal(ids(core.visibleTodos(data, view, '2026-09-07')), '2,4,3,1,5', view);
  }
  assert.equal(ids(data.todos), '1,2,3,4,5');
  for (const id of [1, 2, 3]) data = reduce(data, { type: 'toggle', id });
  const summary = core.getTodoSummary(core.visibleTodos(data, 'all', '2026-09-07'));
  assert.equal(ids(summary.completedTodos), '2,3,1');
  assert.equal(summary.completionRate, 60);
  assert.equal(ids(core.visibleTodos(data, 'urgent', '2026-09-07')), '4,5');
});

test('오늘·이번 주·임박 날짜 경계, 날짜보다 우선순위 우선', () => {
  const todos = ['2026-09-06', '2026-09-07', '2026-09-10', '2026-09-11', '2026-09-13', '2026-09-14', undefined]
    .map((dueDate, i) => ({ id: i + 1, title: String(i), priority: i === 2 ? 'high' : 'normal', completed: false, dueDate }));
  const data = { ...core.emptyData(), todos };
  assert.equal(ids(core.visibleTodos(data, 'today', '2026-09-07')), '2');
  assert.equal(ids(core.visibleTodos(data, 'week', '2026-09-07')), '3,2,4,5');
  assert.equal(ids(core.visibleTodos(data, 'urgent', '2026-09-07')), '3,1,2');
  assert.equal(dates.endOfWeek('2026-09-13'), '2026-09-13');
  assert.equal(dates.endOfWeek('2026-12-31'), '2027-01-03');
});

test('리스트 생성·이름 변경·중복 거부·삭제 시 할 일 보존', () => {
  let data = reduce(core.emptyData(), { type: 'list-add', name: ' 학교 ' });
  assert.equal(reduce(data, { type: 'list-add', name: '학교' }), data);
  data = reduce(data, { type: 'add', title: '과제', listId: 1 });
  data = reduce(data, { type: 'list-rename', id: 1, name: '과제 목록' });
  assert.equal(data.todos[0].listId, 1);
  assert.equal(data.lists[0].name, '과제 목록');
  data = reduce(data, { type: 'list-delete', id: 1 });
  assert.equal(data.todos.length, 1); assert.equal(data.todos[0].listId, undefined);
  data = reduce(data, { type: 'list-add', name: '개인' });
  assert.equal(data.lists[0].id, 2);
});

test('일반 완료 당일 표시·다음 날 History·재정리 중복 방지', () => {
  let data = reduce(core.emptyData(), { type: 'add', title: '완료할 일', priority: 'high' });
  data = reduce(data, { type: 'toggle', id: 1 });
  assert.equal(core.rollover(data, '2026-09-07'), data);
  data = reduce(data, { type: 'day' }, tomorrow);
  assert.equal(data.todos.length, 0); assert.equal(data.history.length, 1);
  assert.equal(data.history[0].title, '완료할 일'); assert.equal(data.history[0].completedAt, now);
  assert.equal(core.rollover(data, '2026-09-09'), data);
  let other = reduce(core.emptyData(), { type: 'add', title: '당일 삭제' });
  other = reduce(other, { type: 'toggle', id: 1 });
  other = reduce(other, { type: 'delete', id: 1 });
  assert.equal(other.history.length, 1);
});

test('매일 회차 완료·취소·새 회차·삭제 후 기록 보존', () => {
  let data = reduce(core.emptyData(), { type: 'add', title: '물 마시기' });
  data = reduce(data, { type: 'edit', id: 1, changes: { title: '물 마시기', priority: 'normal', recurrence: { type: 'daily', startDate: '2026-09-07' } } });
  data = reduce(data, { type: 'toggle', id: 1, occurrenceDate: '2026-09-07' });
  assert.equal(data.todos[0].completed, false); assert.equal(data.completions.length, 1);
  assert.equal(core.visibleTodos(data, 'today', '2026-09-07')[0].completed, true);
  data = reduce(data, { type: 'toggle', id: 1 }); assert.equal(data.completions.length, 0);
  data = reduce(data, { type: 'toggle', id: 1 });
  data = reduce(data, { type: 'day' }, tomorrow);
  assert.equal(data.todos.length, 1); assert.equal(data.history.length, 0);
  assert.equal(core.visibleTodos(data, 'today', '2026-09-08')[0].completed, false);
  assert.equal(reduce(data, { type: 'toggle', id: 1, occurrenceDate: '2026-09-07' }, tomorrow), data);
  data = reduce(data, { type: 'toggle', id: 1, occurrenceDate: '2026-09-08' }, tomorrow);
  assert.equal(data.completions.length, 2);
  data = reduce(data, { type: 'delete', id: 1 }, tomorrow);
  assert.equal(data.completions.length, 2); assert.equal(data.completions[0].snapshot.title, '물 마시기');
});

test('일반↔반복 전환 시 완료 유지와 기록 중복 방지', () => {
  let data = reduce(core.emptyData(), { type: 'add', title: '전환' });
  data = reduce(data, { type: 'toggle', id: 1 });
  const edits = { title: '전환', priority: 'normal' };
  data = reduce(data, { type: 'edit', id: 1, changes: { ...edits, recurrence: { type: 'daily', startDate: '2026-09-07' } } });
  assert.equal(core.visibleTodos(data, 'all', '2026-09-07')[0].completed, true);
  assert.equal(data.completions.length, 1);
  data = reduce(data, { type: 'edit', id: 1, changes: { ...edits, recurrence: undefined } });
  assert.equal(data.todos[0].completed, true); assert.equal(data.todos[0].completedAt, now);
  assert.equal(data.completions.length, 0);
  data = reduce(data, { type: 'day' }, tomorrow); assert.equal(data.history.length, 1);
});

test('매주·미래 시작·매월 말일·윤년·연도 경계', () => {
  const weekly = { type: 'weekly', weekdays: [1, 3, 5], startDate: '2026-09-07' };
  assert.equal(core.nextOccurrence(weekly, '2026-09-08'), '2026-09-09');
  assert.equal(core.nextOccurrence(weekly, '2026-09-12'), '2026-09-14');
  assert.equal(core.nextOccurrence({ type: 'daily', startDate: '2026-10-01' }, '2026-09-07'), '2026-10-01');
  const monthly = { type: 'monthly', day: 31, startDate: '2026-01-31' };
  for (const [date, expected] of [['2026-02-01', '2026-02-28'], ['2028-02-01', '2028-02-29'], ['2026-04-01', '2026-04-30'], ['2026-05-01', '2026-05-31']]) {
    assert.equal(core.nextOccurrence(monthly, date), expected);
  }
  assert.equal(core.nextOccurrence({ ...monthly, day: 1 }, '2026-12-31'), '2027-01-01');
  assert.equal(core.validRecurrence({ ...weekly, weekdays: [] }), false);
  assert.equal(core.validRecurrence({ ...weekly, weekdays: [7] }), false);
});

test('달력 빈 칸·날짜 검증·현지 날짜·서머타임 경계', () => {
  assert.equal(dates.isDueDate('2028-02-29'), true); assert.equal(dates.isDueDate('2026-02-29'), false);
  assert.equal(dates.isDueDate('2026-04-31'), false);
  assert.equal(dates.calendarCells(2028, 1).filter(Boolean).length, 29);
  assert.equal(dates.calendarCells(2026, 8)[2], 1);
  assert.equal(dates.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(dates.dueLabel('2027-01-01', new Date(2026, 11, 31)).text, '내일까지');
  assert.equal(dates.dueLabel('2026-09-07', new Date(2026, 8, 7, 23)).text, '오늘까지');
  assert.equal(dates.dueLabel('2026-09-06', new Date(2026, 8, 7)).text, '기한 지남');
  assert.equal(dates.dueLabel('2026-03-09', new Date(2026, 2, 7)).days, 2);
});

test('기존 데이터 이전: ID·필드·순서·이전 저장 원본 보존', async () => {
  const { storage, disk } = fixture();
  assert.equal((await storage.loadData(now)).todos.length, 0);
  const legacy = [{ id: 10, title: '기존 완료', priority: 'normal', completed: true },
    { id: 15, title: '기존 기한', priority: 'high', completed: false, dueDate: '2026-09-09' }];
  disk.set(oldKey, JSON.stringify(legacy));
  const data = await storage.loadData(now);
  assert.equal(ids(data.todos), '10,15'); assert.equal(data.todos[0].completedAt, now);
  assert.equal(data.nextId, 16); assert.equal(data.todos[1].dueDate, '2026-09-09');
  await storage.saveData(data);
  assert.equal(disk.get(oldKey), JSON.stringify(legacy));
  assert.deepEqual(plain(await storage.loadData(tomorrow)), plain(data));
});

test('전체 저장 왕복: 리스트·기한·반복·History·회차 완료', async () => {
  const { storage } = fixture();
  let data = reduce(core.emptyData(), { type: 'list-add', name: '학교' });
  data = reduce(data, { type: 'add', title: '과제', listId: 1 });
  data = reduce(data, { type: 'toggle', id: 1 });
  data = reduce(data, { type: 'day' }, tomorrow);
  data = reduce(data, { type: 'add', title: '복습', priority: 'high', listId: 1 }, tomorrow);
  data = reduce(data, { type: 'edit', id: 2, changes: { title: '복습', priority: 'high', listId: 1, dueDate: '2026-09-08', recurrence: { type: 'weekly', weekdays: [2], startDate: '2026-09-08' } } }, tomorrow);
  data = reduce(data, { type: 'toggle', id: 2 }, tomorrow);
  await storage.saveData(data);
  assert.deepEqual(plain(await storage.loadData(tomorrow)), plain(data));
});

test('느린 저장 순서·실패 복구·손상 데이터 원본 보존', async () => {
  const { storage, disk, calls, control } = fixture();
  const firstData = core.emptyData(); const secondData = reduce(firstData, { type: 'add', title: '최신' });
  let release; control.hold = new Promise((resolve) => { release = resolve; });
  const first = storage.saveData(firstData); await tick();
  const second = storage.saveData(secondData); await tick(); assert.equal(calls.length, 1);
  release(); await Promise.all([first, second]); assert.equal(disk.get(newKey), JSON.stringify(secondData));
  control.writeFails = true; await assert.rejects(storage.saveData(firstData));
  control.writeFails = false; await storage.saveData(secondData);
  for (const broken of ['{broken', '{}', JSON.stringify({ ...secondData, todos: [null] }), JSON.stringify({ ...secondData, todos: [secondData.todos[0], secondData.todos[0]] })]) {
    disk.set(newKey, broken); await assert.rejects(storage.loadData(now)); assert.equal(disk.get(newKey), broken);
  }
  control.readFails = true; await assert.rejects(storage.loadData(now));
});

// 최소 Hook 실행기로 초기 복원·저장·날짜 이벤트 연결을 검사합니다. React 화면 렌더러를 대체하지는 않습니다.
function harness(storage) {
  const slots = []; let cursor = 0; let effects = []; let clock = now; let foreground; let interval;
  const timeouts = new Map(); let nextTimeout = 0;
  const changed = (a, b) => !a || a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, (v) => { slots[i].value = typeof v === 'function' ? v(slots[i].value) : v; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useCallback(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { value: fn, deps }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) { const old = slots[i]; slots[i] = { deps }; effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } }
  const { useTodos } = load('src/hooks/use-todos.ts', { react,
    'react-native': { AppState: { addEventListener: (_, fn) => { foreground = fn; return { remove() {} }; } } },
    '@/storage/todo-storage': storage, '@/utils/todo-state': core, '@/utils/due-date': dates,
  }, { Date: Clock, setInterval: (fn) => { interval = fn; return 1; }, clearInterval() {},
    setTimeout: (fn) => { const id = ++nextTimeout; timeouts.set(id, fn); return id; }, clearTimeout: (id) => timeouts.delete(id) });
  return {
    render() { cursor = 0; const result = useTodos(); const pending = effects; effects = []; pending.forEach((effect) => effect()); return result; },
    day(time, event = 'foreground') { clock = time; if (event === 'foreground') foreground('active'); else interval(); },
    timeout() { const pending = [...timeouts.values()]; timeouts.clear(); pending.forEach((fn) => fn()); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

test('Hook: 초기 쓰기 금지·대기 입력 복원·foreground/타이머 날짜 처리', async () => {
  let release; const writes = [];
  const stored = reduce(core.emptyData(), { type: 'add', title: '기존' });
  const h = harness({ loadData: () => new Promise((resolve) => { release = resolve; }), saveData: async (data) => { writes.push(plain(data)); } });
  let hook = h.render(); assert.equal(hook.loaded, false); assert.equal(hook.hydrationState, 'loading');
  hook.addTodo('읽는 동안 추가'); assert.equal(writes.length, 0);
  release(stored); await tick(); hook = h.render();
  assert.equal(hook.loaded, true); assert.equal(hook.hydrationState, 'ready'); assert.equal(ids(hook.todos), '1,2');
  hook.toggleTodo(1); h.day(tomorrow); hook = h.render();
  assert.equal(hook.today, '2026-09-08'); assert.equal(hook.history.length, 1); assert.equal(hook.todos.length, 1);
  assert.equal(writes.at(-1).history.length, 1);
  h.day(new Date(2026, 8, 9).toISOString(), 'timer'); assert.equal(h.render().today, '2026-09-09'); h.unmount();
});

test('Hook: 읽기·쓰기 실패 표시 및 재시도, 빈 상태 덮어쓰기 방지', async () => {
  let readFails = true; let writeFails = false; const writes = [];
  const h = harness({ loadData: async () => { if (readFails) throw new Error('read'); return core.emptyData(); },
    saveData: async (data) => { if (writeFails) throw new Error('write'); writes.push(data); } });
  h.render(); await tick(); let hook = h.render();
  assert.equal(hook.loaded, false); assert.equal(hook.hydrationState, 'error'); assert.ok(hook.storageError); assert.equal(writes.length, 0);
  readFails = false; hook.retryStorage(); h.render(); await tick(); hook = h.render(); assert.equal(hook.loaded, true);
  writeFails = true; hook.addTodo('실패 뒤 재시도'); await tick(); hook = h.render();
  assert.ok(hook.storageError); assert.equal(hook.todos.length, 1);
  writeFails = false; hook.retryStorage(); await tick(); hook = h.render();
  assert.equal(hook.storageError, null); assert.equal(writes.at(-1).todos.length, 1); h.unmount();
});

test('프로필·설정 포함 전체 복원, 이전 데이터 기본값, 손상 시 원본 보존', async () => {
  const { storage, disk } = fixture();
  const data = { ...core.emptyData(), profile: { displayName: '사용자', nested: { value: [true, null, 3] } }, settings: { welcome: false } };
  await storage.saveData(data);
  assert.deepEqual(plain(await storage.loadData(now)), plain(data));
  let changed = reduce(await storage.loadData(now), { type: 'add', title: '프로필 보존' });
  changed = reduce(changed, { type: 'toggle', id: 1 });
  changed = reduce(changed, { type: 'day' }, tomorrow);
  await storage.saveData(changed);
  assert.deepEqual(plain((await storage.loadData(now)).profile), data.profile);
  assert.deepEqual(plain((await storage.loadData(now)).settings), data.settings);
  const old = { ...data }; delete old.profile; delete old.settings;
  disk.set(newKey, JSON.stringify(old));
  assert.deepEqual(plain((await storage.loadData(now)).profile), {});
  assert.deepEqual(plain((await storage.loadData(now)).settings), {});
  for (const broken of [{ ...data, profile: null }, { ...data, settings: [] }]) {
    const raw = JSON.stringify(broken); disk.set(newKey, raw);
    await assert.rejects(storage.loadData(now)); assert.equal(disk.get(newKey), raw);
  }
});

test('Hook: 응답 없는 복원은 오류로 전환, 재시도 성공 뒤 늦은 결과 무시', async () => {
  const resolvers = []; const writes = [];
  const h = harness({ loadData: () => new Promise((resolve) => resolvers.push(resolve)), saveData: async (data) => writes.push(data) });
  h.render(); h.timeout();
  let hook = h.render(); assert.equal(hook.hydrationState, 'error'); assert.equal(writes.length, 0);
  hook.retryStorage(); h.render(); assert.equal(h.render().hydrationState, 'loading');
  const restored = reduce(core.emptyData(), { type: 'add', title: '재시도 결과' });
  restored.profile = { displayName: '보존' }; restored.settings = { option: true };
  resolvers[1](restored); await tick(); hook = h.render();
  assert.equal(hook.hydrationState, 'ready'); assert.equal(hook.todos[0].title, '재시도 결과');
  assert.equal(hook.profile.displayName, '보존'); assert.equal(hook.settings.option, true);
  assert.equal(writes.length, 1);
  resolvers[0](core.emptyData()); await tick(); h.timeout(); hook = h.render();
  assert.equal(hook.hydrationState, 'ready'); assert.equal(hook.todos[0].title, '재시도 결과'); assert.equal(writes.length, 1);
  h.unmount();
});

test('Hook: 화면 해제 뒤 복원 결과로 저장하지 않음', async () => {
  let resolve; const writes = [];
  const h = harness({ loadData: () => new Promise((done) => { resolve = done; }), saveData: async (data) => writes.push(data) });
  h.render(); h.unmount(); resolve(core.emptyData()); await tick(); h.timeout();
  assert.equal(writes.length, 0);
});

test('시작 화면: ready 전 탭 미생성, 오류 재시도, 첫 배치 후 네이티브 Splash 해제', async () => {
  let elapsed = false; let effectStarted = false; let timerCallback; let cleanup; let timerCount = 0; let cleared = false;
  let state = 'loading'; let tabMounts = 0; let startupProps; let holds = 0; let hides = 0; let retryCount = 0;
  const element = (type, props) => ({ type, props });
  const pass = ({ children }) => children;
  const { default: Layout } = load('src/app/_layout.tsx', {
    react: {
      useState: () => [elapsed, (value) => { elapsed = value; }],
      useEffect: (effect) => { if (!effectStarted) { effectStarted = true; cleanup = effect(); } },
    },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'expo-router': { DefaultTheme: { colors: {} }, ThemeProvider: pass },
    'expo-status-bar': { StatusBar: () => null },
    'expo-splash-screen': { preventAutoHideAsync: async () => { holds++; }, hideAsync: async () => { hides++; } },
    'react-native': { View: 'View', StyleSheet: { create: (styles) => styles } },
    '@/components/app-tabs': { __esModule: true, default: () => { tabMounts++; return null; } },
    '@/components/app-startup': { AppStartup: (props) => { startupProps = props; return null; } },
    '@/constants/theme': { Colors: { light: {} } },
    '@/contexts/todo-context': { TodoProvider: pass, useTodoContext: () => ({ hydrationState: state, storageError: state === 'error' ? '읽기 실패' : null, retryStorage: () => retryCount++ }) },
  }, {
    setTimeout: (callback, delay) => { assert.equal(delay, 1000); timerCount++; timerCallback = callback; return 1; },
    clearTimeout: () => { cleared = true; },
  });
  function render(node) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(render); return; }
    if (typeof node.type === 'function') render(node.type(node.props)); else render(node.props?.children);
  }
  const root = Layout(); render(root);
  assert.equal(holds, 1); assert.equal(hides, 0); assert.equal(tabMounts, 0); assert.equal(startupProps.error, null);
  root.props.onLayout(); await tick(); assert.equal(hides, 1);
  state = 'error'; render(Layout()); assert.equal(tabMounts, 0); assert.equal(startupProps.error, '읽기 실패');
  startupProps.onRetry(); assert.equal(retryCount, 1);
  state = 'ready'; render(Layout()); assert.equal(tabMounts, 0);
  state = 'loading'; timerCallback(); render(Layout()); assert.equal(tabMounts, 0);
  state = 'ready'; render(Layout()); assert.equal(tabMounts, 1);
  render(Layout()); assert.equal(tabMounts, 2); assert.equal(timerCount, 1);
  cleanup(); assert.equal(cleared, true);
});

test('실제 완료 통계: 자정 이동 전후 동일·중복 제거·완료 취소·7일 0 포함·주 경계', () => {
  let data = reduce(core.emptyData(), { type: 'add', title: '오늘', priority: 'high' });
  data = reduce(data, { type: 'toggle', id: 1 });
  let result = stats.getStatistics(data, '2026-09-07');
  assert.equal(result.todayCount, 1); assert.equal(result.weekCount, 1); assert.equal(result.todos.todayCompleted, 1);
  assert.equal(result.lastSevenDays.length, 7); assert.equal(result.lastSevenDays[0].count, 0);
  assert.equal(result.weekStart, '2026-09-07'); assert.equal(result.weekEnd, '2026-09-13');
  const duplicate = { ...data, history: [{ ...data.todos[0] }] };
  assert.equal(stats.getCompletionRecords(duplicate).length, 1);
  assert.equal(stats.getStatistics(core.rollover(data, '2026-09-08'), '2026-09-08').weekCount, 1);
  assert.equal(stats.getStatistics(reduce(data, { type: 'toggle', id: 1 }), '2026-09-07').total, 0);
  assert.equal(stats.getStatistics(core.rollover(data, '2026-09-14'), '2026-09-14').weekCount, 0);
});

test('일반 Todo 통계: 루틴 제외·기한 경계·History 이동·완료 취소·삭제 반영', () => {
  let data = core.emptyData();
  for (const title of ['완료', '지난 기한', '오늘 기한', '미래 기한', '기한 없음', '루틴']) {
    data = reduce(data, { type: 'add', title });
  }
  for (const [id, dueDate] of [[2, '2026-09-06'], [3, '2026-09-07'], [4, '2026-09-08']]) {
    data = reduce(data, { type: 'edit', id, changes: { ...data.todos[id - 1], dueDate } });
  }
  data = reduce(data, { type: 'edit', id: 6, changes: { title: '루틴', priority: 'normal', recurrence: { type: 'daily', startDate: '2026-09-07' } } });
  data = reduce(reduce(data, { type: 'toggle', id: 1 }), { type: 'toggle', id: 6 });
  assert.equal(stats.getStatistics(data, '2026-09-07').todayCount, 2);
  assert.deepEqual(plain(stats.getStatistics(data, '2026-09-07').todos), {
    todayCompleted: 1, weekCompleted: 1, totalCompleted: 1, pending: 4, overdue: 1,
  });
  const moved = core.rollover(data, '2026-09-08');
  assert.deepEqual(plain(stats.getStatistics(moved, '2026-09-08').todos), {
    todayCompleted: 0, weekCompleted: 1, totalCompleted: 1, pending: 4, overdue: 2,
  });
  const canceled = reduce(data, { type: 'toggle', id: 1 });
  assert.equal(stats.getStatistics(canceled, '2026-09-07').todos.totalCompleted, 0);
  assert.equal(stats.getStatistics(canceled, '2026-09-07').todos.pending, 5);
  const deleted = reduce(data, { type: 'delete', id: 2 });
  assert.equal(stats.getStatistics(deleted, '2026-09-07').todos.overdue, 0);
  assert.equal(stats.getStatistics(core.emptyData(), '2026-09-07').todos.pending, 0);
});

test('루틴 통계: 현재 규칙 예정·삭제된 완료 보존·빈 분모·월말 회차', () => {
  let data = reduce(core.emptyData(), { type: 'add', title: '매일' });
  data = reduce(data, { type: 'edit', id: 1, changes: { title: '매일', priority: 'normal', recurrence: { type: 'daily', startDate: '2026-09-07' } } });
  data = reduce(data, { type: 'toggle', id: 1 });
  assert.deepEqual(plain(stats.getStatistics(data, '2026-09-07').routines), { completed: 1, scheduled: 7, rate: 14 });
  data = reduce(data, { type: 'delete', id: 1 });
  assert.equal(stats.getStatistics(data, '2026-09-07').todayCount, 1);
  assert.equal(stats.getStatistics(data, '2026-09-07').routines.rate, 100);
  assert.equal(stats.getStatistics(core.emptyData(), '2026-09-07').routines.rate, 0);
  const monthly = { ...core.emptyData(), todos: [{ id: 1, title: '월말', priority: 'normal', completed: false,
    recurrence: { type: 'monthly', startDate: '2026-01-01', day: 31 } }] };
  assert.equal(stats.getStatistics(monthly, '2026-02-28').routines.scheduled, 1);
});

test('로컬 프로필 최초 생성·식별자 유지·설정 및 기존 추가 필드 보존', async () => {
  const data = core.initializeLocalData(core.emptyData(), now);
  assert.equal(data.profile.displayName, '사용자');
  assert.ok(data.profile.localProfileId); assert.equal(data.settings.welcomeMessages, true);
  const edited = reduce(data, { type: 'profile', displayName: ' 세바 ', avatar: 'cheer' });
  assert.equal(edited.profile.displayName, '세바');
  assert.equal(edited.profile.localProfileId, data.profile.localProfileId);
  assert.equal(reduce(edited, { type: 'profile', displayName: ' ', avatar: 'idle' }), edited);
  const changed = reduce(edited, { type: 'settings', changes: { welcomeMessages: false, characterReactions: false } });
  const { storage } = fixture(); await storage.saveData(changed);
  const restored = core.initializeLocalData(await storage.loadData(tomorrow), tomorrow);
  assert.deepEqual(plain(restored.profile), plain(changed.profile));
  assert.equal(restored.settings.welcomeMessages, false); assert.equal(restored.settings.characterReactions, false);
});

test('전체 삭제: 진행 중 쓰기 뒤 실행·옛 키 제거·다른 앱 키 보존·실패 복구', async () => {
  const { storage, disk, control } = fixture();
  disk.set(oldKey, JSON.stringify([{ id: 1, title: '옛 일', priority: 'normal', completed: false }]));
  disk.set('another-app', '보존');
  let release; control.hold = new Promise((resolve) => { release = resolve; });
  const write = storage.saveData(reduce(core.emptyData(), { type: 'add', title: '저장 중' }));
  const initial = core.initializeLocalData(core.emptyData(), now);
  const reset = storage.resetStoredData(initial); release(); await write; await reset;
  assert.equal(disk.has(oldKey), false); assert.equal(disk.get('another-app'), '보존');
  assert.deepEqual(plain(await storage.loadData(now)), plain(initial));
  control.writeFails = true; await assert.rejects(storage.resetStoredData(initial));
  control.writeFails = false; await storage.saveData(initial);
});

test('Hook: 전체 삭제 실패시 화면 보존·중복 실행/삭제 중 입력 차단·성공 후 초기 상태', async () => {
  let fails = true; let release; let resets = 0;
  const stored = reduce(core.emptyData(), { type: 'add', title: '보존' });
  const h = harness({ loadData: async () => stored, saveData: async () => {}, resetStoredData: async () => {
    resets++; if (fails) throw new Error('삭제 실패'); await new Promise((resolve) => { release = resolve; });
  } });
  h.render(); await tick(); let hook = h.render();
  assert.equal(await hook.resetAllData(), false); hook = h.render(); assert.equal(hook.todos.length, 1);
  fails = false; const pending = hook.resetAllData(); hook.addTodo('삭제 중 입력');
  assert.equal(await hook.resetAllData(), false); release(); assert.equal(await pending, true);
  hook = h.render(); assert.equal(hook.todos.length, 0); assert.equal(hook.profile.displayName, '사용자');
  assert.equal(hook.settings.characterReactions, true); assert.equal(resets, 2); h.unmount();
});

(async () => {
  for (const { name, run } of checks) { await run(); console.log(`PASS: ${name}`); }
  console.log(`${checks.length}개 검증 통과 (시간대: ${Intl.DateTimeFormat().resolvedOptions().timeZone})`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
