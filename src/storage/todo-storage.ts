import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Todo, TodoData, TodoHistory, TodoList, RoutineCompletion, LocalProfile } from '@/types/todo';
import { isDueDate } from '@/utils/due-date';
import { emptyData, validRecurrence } from '@/utils/todo-state';

// AsyncStorage는 문자열을 이름(key)과 짝지어 기기에 보관합니다. 앱 전용 이름으로 다른 데이터와 구분합니다.
const STORAGE_KEY = '@easy-do/todos/v1';
const DATA_KEY = '@easy-do/data/v2';
// Promise(나중에 끝나는 작업의 결과)를 연결해 저장 요청을 순서대로 처리합니다.
let pendingWrite: Promise<void> = Promise.resolve();

// 스키마 2와 이전 배열은 세 단계였으므로 새 네 단계로 옮깁니다.
function normalizeLegacyPriority(value: unknown): Todo['priority'] {
  switch (value) {
    case 'high': return 'veryHigh';
    case 'normal': return 'high';
    case 'low': return 'medium';
    default: return 'none';
  }
}

function normalizeCurrentPriority(value: unknown): Todo['priority'] {
  return value === 'veryHigh' || value === 'high' || value === 'medium' || value === 'none' ? value : 'none';
}

export function parseTodos(raw: string | null, legacyPriorities = true): Todo[] {
  if (raw === null) return [];
  // JSON(데이터를 문자열로 표현하는 형식)을 해석합니다. 저장 내용은 타입 선언만으로 신뢰할 수 없어 검사합니다.
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Invalid Todo array');
  // 배열 모양뿐 아니라 필드 값과 중복 번호까지 확인해 손상된 항목이 앱 상태에 들어오지 않게 합니다.
  const ids = new Set<number>();
  return value.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) throw new Error('Invalid Todo');
    const todo = item as Record<string, unknown>;
    if (typeof todo.id !== 'number' || !Number.isSafeInteger(todo.id) || todo.id <= 0 ||
        todo.id >= Number.MAX_SAFE_INTEGER || ids.has(todo.id) ||
        typeof todo.title !== 'string' || !todo.title.trim() ||
        typeof todo.completed !== 'boolean') throw new Error('Invalid Todo fields');
    ids.add(todo.id);
    // 손상된 반복 규칙을 버리면 일반 Todo로 바뀌므로, 이 경우에는 원본을 보존하고 복원을 중단합니다.
    if (todo.recurrence !== undefined && !validRecurrence(todo.recurrence)) throw new Error('반복 규칙 오류');
    // 선택 필드가 없던 기존 데이터도 읽습니다. 잘못된 기한만 제외하고 Todo 자체는 보존합니다.
    return { id: todo.id, title: todo.title,
      priority: legacyPriorities ? normalizeLegacyPriority(todo.priority) : normalizeCurrentPriority(todo.priority), completed: todo.completed,
      ...(isDueDate(todo.dueDate) ? { dueDate: todo.dueDate } : {}),
      ...(validTime(todo.createdAt) ? { createdAt: todo.createdAt } : {}),
      ...(validTime(todo.completedAt) ? { completedAt: todo.completedAt } : {}),
      ...(positiveId(todo.listId) ? { listId: todo.listId } : {}),
      ...(validRecurrence(todo.recurrence) ? { recurrence: todo.recurrence } : {}) };
  });
}

function positiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value < Number.MAX_SAFE_INTEGER;
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function migrateLegacy(raw: string | null, now: string): TodoData {
  const todos = parseTodos(raw).map((t) => ({ ...t,
    // 과거 완료 날짜는 알 수 없으므로 이전 시각을 부여해 첫날에는 완료 취소할 기회를 남깁니다.
    ...(t.completed && !t.completedAt ? { completedAt: now } : {}) }));
  return { ...emptyData(), todos, nextId: todos.reduce((max, t) => Math.max(max, t.id + 1), 1) };
}

function parseLocalObject(value: unknown): LocalProfile {
  // 이전 저장 형식에는 이 영역이 없으므로 기본값을 허용합니다. 존재하지만 손상된 값은 덮어쓰지 않습니다.
  if (value === undefined) return {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('프로필 또는 설정 형식 오류');
  // JSON.parse를 통과한 객체이므로 함수나 undefined는 들어올 수 없습니다.
  return value as LocalProfile;
}

export function parseData(raw: string): TodoData {
  const value = JSON.parse(raw);
  if (!value || (value.schemaVersion !== 2 && value.schemaVersion !== 3) || !Array.isArray(value.todos) || !Array.isArray(value.lists) ||
    !Array.isArray(value.history) || !Array.isArray(value.completions)) throw new Error('저장 데이터 형식 오류');
  const legacyPriorities = value.schemaVersion === 2;
  const todos = parseTodos(JSON.stringify(value.todos), legacyPriorities);
  const listIds = new Set<number>();
  const lists: TodoList[] = value.lists.map((list: TodoList) => {
    if (!list || !positiveId(list.id) || typeof list.name !== 'string' || !list.name.trim() || listIds.has(list.id)) throw new Error('리스트 데이터 오류');
    listIds.add(list.id);
    return { id: list.id, name: list.name };
  });
  const history: TodoHistory[] = value.history.map((item: TodoHistory) => {
    if (!item || !validTime(item.completedAt)) throw new Error('완료 기록 오류');
    return { ...parseTodos(JSON.stringify([item]), legacyPriorities)[0], completedAt: item.completedAt };
  });
  const completionKeys = new Set<string>();
  const completions: RoutineCompletion[] = value.completions.map((c: RoutineCompletion) => {
    if (!c || !positiveId(c.todoId) || !isDueDate(c.occurrenceDate) || !validTime(c.completedAt)) throw new Error('반복 완료 기록 오류');
    const key = `${c.todoId}:${c.occurrenceDate}`;
    if (completionKeys.has(key)) throw new Error('반복 완료 기록 중복');
    completionKeys.add(key);
    return { todoId: c.todoId, occurrenceDate: c.occurrenceDate, completedAt: c.completedAt,
      snapshot: parseTodos(JSON.stringify([c.snapshot]), legacyPriorities)[0] };
  });
  // 삭제·History 이동 후에도 번호를 재사용하지 않아 과거 회차 기록이 새 Todo에 연결되지 않습니다.
  const nextId = [...todos, ...history, ...completions.map((c) => ({ id: c.todoId }))]
    .reduce((max, t) => Math.max(max, t.id + 1), positiveId(value.nextId) ? value.nextId : 1);
  return { schemaVersion: 3, todos, lists, history, completions, nextId,
    profile: parseLocalObject(value.profile), settings: parseLocalObject(value.settings),
    nextListId: lists.reduce((max, l) => Math.max(max, l.id + 1), positiveId(value.nextListId) ? value.nextListId : 1) };
}

export async function loadDataWithDiagnostics(now: string): Promise<{ data: TodoData; rawExists: boolean; key: string }> {
  await pendingWrite;
  const raw = await AsyncStorage.getItem(DATA_KEY);
  if (raw !== null) return { data: parseData(raw), rawExists: true, key: DATA_KEY };
  // 새 저장소가 없을 때만 이전 배열을 읽습니다. 이전 키는 지우거나 덮어쓰지 않아 원본을 보존합니다.
  const legacyRaw = await AsyncStorage.getItem(STORAGE_KEY);
  if (legacyRaw !== null) return { data: migrateLegacy(legacyRaw, now), rawExists: true, key: STORAGE_KEY };
  return { data: migrateLegacy(null, now), rawExists: false, key: DATA_KEY };
}

export async function loadData(now: string): Promise<TodoData> {
  return (await loadDataWithDiagnostics(now)).data;
}

export function saveData(data: TodoData): Promise<void> {
  // Todo 제거와 History 추가를 한 문자열로 저장해 둘 중 하나만 저장되는 문제를 피합니다.
  const snapshot = JSON.stringify(data);
  const write = pendingWrite.then(() => AsyncStorage.setItem(DATA_KEY, snapshot));
  // 실패는 호출부에 알리되 다음 저장 요청이 막히지는 않도록 대기열은 복구합니다.
  pendingWrite = write.catch(() => {});
  return write;
}

export function resetStoredData(initial: TodoData): Promise<void> {
  // 앱 전체 저장소 clear()는 쓰지 않습니다. 이전 Todo 키까지 제거해야 옛 데이터가 다시 복원되지 않습니다.
  // 진행 중인 저장 뒤에 실행하고 마지막에 초기 상태를 저장해 늦은 쓰기가 삭제를 되돌리지 못하게 합니다.
  const reset = pendingWrite.then(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.setItem(DATA_KEY, JSON.stringify(initial));
  });
  pendingWrite = reset.catch(() => {});
  return reset;
}
