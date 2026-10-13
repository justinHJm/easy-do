import type { TodoData, TodoPriority } from '@/types/todo';
import { addDays, dateKey, endOfWeek } from '@/utils/due-date';
import { nextOccurrence } from '@/utils/todo-state';

export type CompletionRecord = {
  key: string;
  title: string;
  priority: TodoPriority;
  completedAt: string;
  kind: 'todo' | 'routine';
};

export function getCompletionRecords(data: TodoData): CompletionRecord[] {
  const records = new Map<string, CompletionRecord>();
  const routineEvents = new Set<string>();
  // 루틴 원본이 삭제되거나 수정되어도 완료 당시의 제목·우선순위는 snapshot에서 읽습니다.
  for (const completion of data.completions) {
    const key = `routine:${completion.todoId}:${completion.occurrenceDate}`;
    const previous = records.get(key);
    routineEvents.add(`${completion.todoId}:${completion.completedAt}`);
    if (!previous || Date.parse(completion.completedAt) > Date.parse(previous.completedAt)) {
      records.set(key, { key, title: completion.snapshot.title, priority: completion.snapshot.priority,
        completedAt: completion.completedAt, kind: 'routine' });
    }
  }
  // 자정에 일반 완료가 todos에서 history로 이동해도 집계는 같아야 합니다.
  // 같은 완료가 양쪽에 존재하면 한 번만 세고, 루틴 전환 중 같은 사건도 중복하지 않습니다.
  for (const todo of [...data.history, ...data.todos.filter((item) => item.completed && !item.recurrence)]) {
    if (!todo.completedAt || routineEvents.has(`${todo.id}:${todo.completedAt}`)) continue;
    const key = `todo:${todo.id}:${todo.completedAt}`;
    if (!records.has(key)) records.set(key, { key, title: todo.title, priority: todo.priority,
      completedAt: todo.completedAt, kind: 'todo' });
  }
  return [...records.values()].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt) || a.key.localeCompare(b.key));
}

export function getStatistics(data: TodoData, today: string) {
  const records = getCompletionRecords(data);
  const weekEnd = endOfWeek(today);
  const weekStart = addDays(weekEnd, -6);
  const dailyCounts = new Map<string, number>();
  for (const record of records) {
    // ISO 시각의 UTC 날짜를 자르지 않고 기기의 현지 날짜로 바꿔 자정 전후를 정확히 집계합니다.
    const day = dateKey(new Date(record.completedAt));
    dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
  }
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return { date, count: dailyCounts.get(date) ?? 0 };
  });
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  // 전체 완료에는 루틴도 포함되므로 일반 Todo 통계는 같은 기록에서 별도로 추출합니다.
  // 자정에 History로 옮겨도 완료 수는 유지되고, 완료 취소는 원본 변경 즉시 반영됩니다.
  const todoRecords = records.filter((record) => record.kind === 'todo');
  const pendingTodos = data.todos.filter((todo) => !todo.recurrence && !todo.completed);
  const todos = {
    todayCompleted: todoRecords.filter((record) => dateKey(new Date(record.completedAt)) === today).length,
    weekCompleted: todoRecords.filter((record) => {
      const day = dateKey(new Date(record.completedAt));
      return day >= weekStart && day <= weekEnd;
    }).length,
    totalCompleted: todoRecords.length,
    pending: pendingTodos.length,
    overdue: pendingTodos.filter((todo) => todo.dueDate && todo.dueDate < today).length,
  };
  const routineGroups = new Map<number, {
    todoId: number; title: string; archived: boolean; dates: Map<string, boolean>; latestCompletedAt?: string;
  }>();
  for (const todo of data.todos) {
    if (!todo.recurrence) continue;
    const group = { todoId: todo.id, title: todo.title, archived: false, dates: new Map<string, boolean>() };
    routineGroups.set(todo.id, group);
    for (const day of weekDates) {
      if (nextOccurrence(todo.recurrence, day) === day) group.dates.set(day, false);
    }
  }
  for (const completion of data.completions) {
    if (completion.occurrenceDate >= weekStart && completion.occurrenceDate <= weekEnd) {
      // 과거 규칙 변경 이력이 없으므로 예정 횟수는 추정입니다. 이미 완료한 회차는
      // 삭제·규칙 변경 뒤에도 분모에 포함해 기록 유실과 100% 초과를 막습니다.
      const group = routineGroups.get(completion.todoId) ?? {
        todoId: completion.todoId, title: completion.snapshot.title, archived: true,
        dates: new Map<string, boolean>(), latestCompletedAt: undefined,
      };
      // 삭제되거나 일반 Todo로 바뀐 루틴은 가장 최근 완료 당시의 이름을 표시합니다.
      if (group.archived && (!group.latestCompletedAt || Date.parse(completion.completedAt) > Date.parse(group.latestCompletedAt))) {
        group.title = completion.snapshot.title;
        group.latestCompletedAt = completion.completedAt;
      }
      group.dates.set(completion.occurrenceDate, true);
      routineGroups.set(completion.todoId, group);
    }
  }
  const items = [...routineGroups.values()].sort((a, b) => a.todoId - b.todoId).map((group) => {
    const occurrences = [...group.dates].sort(([a], [b]) => a.localeCompare(b))
      .map(([date, completed]) => ({ date, completed }));
    return { todoId: group.todoId, title: group.title, archived: group.archived,
      scheduled: occurrences.length, completed: occurrences.filter((day) => day.completed).length, occurrences };
  });
  const scheduled = items.reduce((sum, item) => sum + item.scheduled, 0);
  const completed = items.reduce((sum, item) => sum + item.completed, 0);
  return {
    total: records.length,
    todayCount: dailyCounts.get(today) ?? 0,
    weekCount: weekDates.reduce((sum, day) => sum + (dailyCounts.get(day) ?? 0), 0),
    weekStart, weekEnd, lastSevenDays, todos,
    routines: { completed, scheduled, rate: scheduled ? Math.round(completed / scheduled * 100) : 0, items },
  };
}
