import type { Recurrence, Todo, TodoData, TodoEdits, TodoView, VisibleTodo } from '@/types/todo';
import { addDays, dateKey, endOfWeek, isDueDate, localDate } from '@/utils/due-date';

export const prioritySymbols: Record<Todo['priority'], string> = { veryHigh: '!!!', high: '!!', medium: '!', none: '' };

export function emptyData(): TodoData {
  return { schemaVersion: 3, todos: [], lists: [], history: [], completions: [], profile: {}, settings: {}, nextId: 1, nextListId: 1 };
}

// 이전 버전에 비어 있던 프로필만 보완합니다. 저장된 식별자와 모르는 추가 필드는 그대로 둡니다.
export function initializeLocalData(data: TodoData, now: string): TodoData {
  const p = data.profile;
  return { ...data, profile: { ...p,
    localProfileId: typeof p.localProfileId === 'string' && p.localProfileId ? p.localProfileId : `local-${Date.parse(now)}-${Math.random().toString(36).slice(2)}`,
    displayName: typeof p.displayName === 'string' && p.displayName.trim() ? p.displayName.trim() : '사용자',
    avatar: typeof p.avatar === 'string' && ['idle', 'welcome', 'completed', 'cheer'].includes(p.avatar) ? p.avatar : 'idle',
    createdAt: typeof p.createdAt === 'string' && Number.isFinite(Date.parse(p.createdAt)) ? p.createdAt : now,
  }, settings: { ...data.settings,
    characterReactions: typeof data.settings.characterReactions === 'boolean' ? data.settings.characterReactions : true,
    welcomeMessages: typeof data.settings.welcomeMessages === 'boolean' ? data.settings.welcomeMessages : true,
  } };
}

const ranks: Record<Todo['priority'], number> = { veryHigh: 0, high: 1, medium: 2, none: 3 };
// 모든 보기가 이 함수만 사용합니다. 날짜는 정렬에 관여하지 않으며, 같은 우선순위는 생성 번호 순입니다.
export function sortTodos<T extends Todo>(todos: readonly T[]): T[] {
  return [...todos].sort((a, b) => ranks[a.priority] - ranks[b.priority] || a.id - b.id);
}

export function validRecurrence(value: unknown): value is Recurrence {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if (!isDueDate(r.startDate)) return false;
  return r.type === 'daily' || (r.type === 'weekly' && Array.isArray(r.weekdays) && r.weekdays.length > 0 &&
    r.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) ||
    (r.type === 'monthly' && typeof r.day === 'number' && Number.isInteger(r.day) && r.day >= 1 && r.day <= 31);
}

// 원본을 복제해서 쌓지 않고, 오늘 또는 다음 예정 회차 날짜를 계산합니다. 놓친 회차를 무한 생성하지 않습니다.
export function nextOccurrence(rule: Recurrence, today: string): string {
  const from = today > rule.startDate ? today : rule.startDate;
  if (rule.type === 'daily') return from;
  if (rule.type === 'weekly') {
    for (let i = 0; i < 7; i++) {
      const day = addDays(from, i);
      if (rule.weekdays.includes(localDate(day).getDay())) return day;
    }
  }
  if (rule.type === 'monthly') {
    const start = localDate(from);
    for (let i = 0; i < 2; i++) {
      const year = start.getFullYear();
      const month = start.getMonth() + i;
      // 31일이 없는 달은 말일로 실행하되 규칙의 31은 유지해 다음 달에 다시 31일을 사용합니다.
      const day = Math.min(rule.day, new Date(year, month + 1, 0).getDate());
      const candidate = dateKey(new Date(year, month, day));
      if (candidate >= from) return candidate;
    }
  }
  return from;
}

export function recurrenceLabel(rule: Recurrence): string {
  if (rule.type === 'daily') return '매일';
  if (rule.type === 'monthly') return `매월 ${rule.day}일`;
  return `매주 ${[...rule.weekdays].sort().map((d) => '일월화수목금토'[d]).join('·')}`;
}

// 정리는 같은 날 여러 번 호출해도 중복 기록을 만들지 않습니다. 원본 제거와 History 추가는 한 상태 변경입니다.
export function rollover(data: TodoData, today: string): TodoData {
  const finished = data.todos.filter((t) => !t.recurrence && t.completed && t.completedAt && dateKey(new Date(t.completedAt)) < today);
  if (!finished.length) return data;
  const ids = new Set(finished.map((t) => t.id));
  const history = [...data.history];
  for (const todo of finished) {
    if (!history.some((h) => h.id === todo.id && h.completedAt === todo.completedAt)) {
      history.push({ ...todo, completedAt: todo.completedAt! });
    }
  }
  return { ...data, todos: data.todos.filter((t) => !ids.has(t.id)), history };
}

export function visibleTodos(data: TodoData, view: TodoView, today: string): VisibleTodo[] {
  const rows: VisibleTodo[] = rollover(data, today).todos.map((todo) => {
    if (!todo.recurrence) return todo;
    const occurrenceDate = nextOccurrence(todo.recurrence, today);
    const done = data.completions.find((c) => c.todoId === todo.id && c.occurrenceDate === occurrenceDate);
    return { ...todo, occurrenceDate, dueDate: occurrenceDate, completed: !!done, completedAt: done?.completedAt };
  });
  const end = endOfWeek(today);
  // 스마트 보기는 소속을 바꾸지 않는 조건입니다. 먼저 추출한 뒤 반드시 공통 우선순위 정렬을 적용합니다.
  // YYYY-MM-DD는 자릿수가 고정되어 문자열 비교와 날짜 순서가 같습니다. 임박은 과거 기한부터 3일 후까지입니다.
  return sortTodos(rows.filter((todo) => {
    const due = todo.occurrenceDate ?? todo.dueDate;
    if (view.startsWith('list:')) return todo.listId === Number(view.slice(5));
    switch (view) {
      case 'today': return due === today;
      case 'week': return !!due && due >= today && due <= end;
      case 'urgent': return !todo.completed && !!due && due <= addDays(today, 3);
      case 'routine': return !!todo.recurrence;
      default: return true;
    }
  }));
}

export function getTodoSummary<T extends Todo>(todos: readonly T[]) {
  const incompleteTodos = sortTodos(todos.filter((t) => !t.completed));
  const completedTodos = sortTodos(todos.filter((t) => t.completed));
  const totalCount = todos.length;
  const completedCount = completedTodos.length;
  // 빈 보기에서 0으로 나누면 유효하지 않은 숫자가 되므로, 할 일이 없을 때는 명시적으로 0%를 사용합니다.
  return { incompleteTodos, completedTodos, totalCount, completedCount,
    completionRate: totalCount ? completedCount / totalCount * 100 : 0 };
}

export type DataAction =
  | { type: 'profile'; displayName: string; avatar: string }
  | { type: 'settings'; changes: { characterReactions?: boolean; welcomeMessages?: boolean } }
  | { type: 'add'; title: string; priority?: Todo['priority']; listId?: number }
  | { type: 'edit'; id: number; changes: TodoEdits }
  | { type: 'delete' | 'toggle'; id: number; occurrenceDate?: string }
  | { type: 'list-add'; name: string }
  | { type: 'list-rename'; id: number; name: string }
  | { type: 'list-delete'; id: number }
  | { type: 'day' };

export function updateData(original: TodoData, action: DataAction, now: string): TodoData {
  const today = dateKey(new Date(now));
  const data = rollover(original, today);
  const validList = (id?: number) => data.lists.some((l) => l.id === id) ? id : undefined;
  switch (action.type) {
    case 'profile': {
      if (!action.displayName.trim() || !['idle', 'welcome', 'completed', 'cheer'].includes(action.avatar)) return data;
      return { ...data, profile: { ...data.profile, displayName: action.displayName.trim(), avatar: action.avatar } };
    }
    case 'settings':
      return { ...data, settings: { ...data.settings, ...action.changes } };
    case 'day': return data;
    case 'add': {
      if (!action.title.trim()) return data;
      const todo: Todo = { id: data.nextId, title: action.title.trim(), priority: action.priority ?? 'none',
        completed: false, createdAt: now, listId: validList(action.listId) };
      return { ...data, nextId: data.nextId + 1, todos: [...data.todos, todo] };
    }
    case 'edit': {
      const changes = action.changes;
      if (!changes.title.trim() || (changes.dueDate !== undefined && !isDueDate(changes.dueDate)) ||
        (changes.recurrence !== undefined && !validRecurrence(changes.recurrence))) return data;
      let completions = data.completions;
      const todos = data.todos.map((todo) => {
        if (todo.id !== action.id) return todo;
        let completed = todo.completed;
        let completedAt = todo.completedAt;
        // 반복을 켜고 끌 때도 화면의 완료 상태를 지킵니다. 현재 완료 기록의 보관 위치만 옮겨 중복 집계를 피합니다.
        if (!todo.recurrence && changes.recurrence) {
          const occurrenceDate = nextOccurrence(changes.recurrence, today);
          completions = completions.filter((c) => !(c.todoId === todo.id && c.occurrenceDate === occurrenceDate));
          if (todo.completed) completions = [...completions, { todoId: todo.id, occurrenceDate,
            completedAt: todo.completedAt ?? now, snapshot: { ...todo } }];
          completed = false;
          completedAt = undefined;
        } else if (todo.recurrence && !changes.recurrence) {
          const occurrenceDate = nextOccurrence(todo.recurrence, today);
          const done = completions.find((c) => c.todoId === todo.id && c.occurrenceDate === occurrenceDate);
          completed = !!done;
          completedAt = done?.completedAt;
          completions = completions.filter((c) => !(c.todoId === todo.id && c.occurrenceDate === occurrenceDate));
        }
        return { ...todo, ...changes, title: changes.title.trim(), listId: validList(changes.listId),
          completed, completedAt };
      });
      return { ...data, todos, completions };
    }
    case 'delete': {
      const todo = data.todos.find((t) => t.id === action.id);
      // 완료한 일반 Todo를 당일 삭제해도 이미 해낸 기록은 보존합니다. 반복 회차 기록도 삭제하지 않습니다.
      const history = todo?.completed && !todo.recurrence && todo.completedAt ?
        [...data.history, { ...todo, completedAt: todo.completedAt }] : data.history;
      return { ...data, history, todos: data.todos.filter((t) => t.id !== action.id) };
    }
    case 'toggle': {
      const todo = data.todos.find((t) => t.id === action.id);
      if (!todo) return data;
      if (todo.recurrence) {
        const occurrenceDate = nextOccurrence(todo.recurrence, today);
        // 자정 직전 보던 체크박스를 뒤늦게 눌러 새 회차를 잘못 완료하지 않도록 날짜도 확인합니다.
        if (action.occurrenceDate && action.occurrenceDate !== occurrenceDate) return data;
        const exists = data.completions.some((c) => c.todoId === todo.id && c.occurrenceDate === occurrenceDate);
        const completions = exists ? data.completions.filter((c) => !(c.todoId === todo.id && c.occurrenceDate === occurrenceDate)) :
          [...data.completions, { todoId: todo.id, occurrenceDate, completedAt: now, snapshot: { ...todo } }];
        return { ...data, completions };
      }
      return { ...data, todos: data.todos.map((t) => t.id === todo.id ?
        { ...t, completed: !t.completed, completedAt: t.completed ? undefined : now } : t) };
    }
    case 'list-add': {
      const name = action.name.trim();
      if (!name || data.lists.some((l) => l.name === name)) return data;
      return { ...data, nextListId: data.nextListId + 1, lists: [...data.lists, { id: data.nextListId, name }] };
    }
    case 'list-rename': {
      const name = action.name.trim();
      if (!name || data.lists.some((l) => l.id !== action.id && l.name === name)) return data;
      return { ...data, lists: data.lists.map((l) => l.id === action.id ? { ...l, name } : l) };
    }
    case 'list-delete':
      // 리스트는 분류일 뿐입니다. 소속만 해제하고 Todo와 과거 완료 기록은 그대로 남깁니다.
      return { ...data, lists: data.lists.filter((l) => l.id !== action.id),
        todos: data.todos.map((t) => t.listId === action.id ? { ...t, listId: undefined } : t) };
  }
}
