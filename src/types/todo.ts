// 유니언 타입(허용할 값을 나열한 타입)으로 정해진 세 우선순위만 사용하게 합니다.
export type TodoPriority = 'veryHigh' | 'high' | 'medium' | 'none';

// 반복 규칙은 Todo의 선택 속성입니다. 회차별 완료 여부는 별도 Completion에 보관합니다.
export type Recurrence = { startDate: string; endDate?: string } & (
  | { type: 'daily' }
  | { type: 'weekly'; weekdays: number[] }
  | { type: 'monthly'; day: number }
);

// readonly는 필드를 직접 대입하는 실수를 타입 검사에서 막습니다. 변경할 때는 새 객체를 만듭니다.
export type Todo = {
  readonly id: number;
  readonly title: string;
  readonly priority: TodoPriority;
  readonly completed: boolean;
  // 기한 없는 기존 Todo와 호환되는 선택 필드입니다. 날짜만 YYYY-MM-DD로 보관합니다.
  readonly dueDate?: string;
  readonly createdAt?: string;
  readonly completedAt?: string;
  readonly listId?: number;
  readonly recurrence?: Recurrence;
};

export type TodoEdits = Pick<Todo, 'title' | 'priority' | 'dueDate' | 'listId' | 'recurrence'>;
export type TodoList = { id: number; name: string };
export type TodoHistory = Todo & { completedAt: string };
export type RoutineCompletion = {
  todoId: number;
  occurrenceDate: string;
  completedAt: string;
  // 나중에 원본 이름이나 리스트가 바뀌어도 당시 기록은 보존합니다.
  snapshot: Todo;
};
// 기존 저장 객체의 추가 필드도 보존하면서 화면에서 사용하는 프로필 항목을 명확히 정의합니다.
export type LocalValue = string | number | boolean | null | LocalValue[] | { [key: string]: LocalValue };
export type LocalProfile = { [key: string]: LocalValue };
export type UserSettings = { tutorialCompleted?: boolean; [key: string]: LocalValue | undefined };
export type UserProfile = LocalProfile & { localProfileId: string; displayName: string; avatar: string; createdAt: string };
export type HydrationState = 'loading' | 'ready' | 'error';

export type TodoData = {
  schemaVersion: 3;
  todos: Todo[];
  lists: TodoList[];
  history: TodoHistory[];
  completions: RoutineCompletion[];
  profile: LocalProfile;
  settings: UserSettings;
  nextId: number;
  nextListId: number;
};
export type SmartView = 'all' | 'today' | 'week' | 'urgent' | 'routine';
export type TodoView = SmartView | `list:${number}`;
export type VisibleTodo = Todo & { occurrenceDate?: string };
