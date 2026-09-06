import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Todo } from '@/types/todo';

// AsyncStorage는 문자열을 이름(key)과 짝지어 기기에 보관합니다. 앱 전용 이름으로 다른 데이터와 구분합니다.
const STORAGE_KEY = '@easy-do/todos/v1';
// Promise(나중에 끝나는 작업의 결과)를 연결해 저장 요청을 순서대로 처리합니다.
let pendingWrite: Promise<void> = Promise.resolve();

export function parseTodos(raw: string | null): Todo[] {
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
        (todo.priority !== 'high' && todo.priority !== 'normal' && todo.priority !== 'low') ||
        typeof todo.completed !== 'boolean') throw new Error('Invalid Todo fields');
    ids.add(todo.id);
    return { id: todo.id, title: todo.title, priority: todo.priority as Todo['priority'], completed: todo.completed };
  });
}

export async function loadTodos(): Promise<Todo[]> {
  try {
    // Provider가 다시 연결되더라도 진행 중인 저장이 끝난 뒤 최신 데이터를 읽습니다.
    // await는 이 함수의 다음 작업만 기다리게 하므로 화면 전체를 멈추지 않습니다.
    await pendingWrite;
    return parseTodos(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    // 읽기 실패와 JSON 해석·검사 오류를 함께 처리합니다. 앱은 빈 목록으로 계속 실행하며 저장소 자체는 지우지 않습니다.
    console.warn('easy-do: Todo를 불러오지 못했습니다. 빈 목록으로 시작합니다.');
    return [];
  }
}

export function saveTodos(todos: readonly Todo[]): Promise<void> {
  // 호출 시점의 배열 전체를 문자열로 고정해 id·내용·우선순위·완료 여부를 함께 저장합니다.
  const snapshot = JSON.stringify(todos);
  // 빠르게 체크를 바꿔도 이전 저장이 나중에 끝나 최신 상태를 덮어쓰지 않도록 순서를 보장합니다.
  // 실패를 catch에서 처리해 다음 저장 요청은 계속 실행되게 합니다. 자동 재시도는 다음 변경 때 이루어집니다.
  pendingWrite = pendingWrite
    .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
    .catch(() => { console.warn('easy-do: Todo 저장에 실패했습니다. 다음 변경 시 다시 저장합니다.'); });
  return pendingWrite;
}
