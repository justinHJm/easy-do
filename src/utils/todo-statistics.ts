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
  const priorityCounts: Record<TodoPriority, number> = { high: 0, normal: 0, low: 0 };
  for (const record of records) {
    // ISO 시각의 UTC 날짜를 자르지 않고 기기의 현지 날짜로 바꿔 자정 전후를 정확히 집계합니다.
    const day = dateKey(new Date(record.completedAt));
    dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
    priorityCounts[record.priority]++;
  }
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return { date, count: dailyCounts.get(date) ?? 0 };
  });
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const scheduled = new Set<string>();
  for (const todo of data.todos) {
    if (!todo.recurrence) continue;
    for (const day of weekDates) {
      if (nextOccurrence(todo.recurrence, day) === day) scheduled.add(`${todo.id}:${day}`);
    }
  }
  const completed = new Set<string>();
  for (const completion of data.completions) {
    if (completion.occurrenceDate >= weekStart && completion.occurrenceDate <= weekEnd) {
      const key = `${completion.todoId}:${completion.occurrenceDate}`;
      completed.add(key);
      // 과거 규칙 변경 이력이 없으므로 예정 횟수는 추정입니다. 이미 완료한 회차는
      // 삭제·규칙 변경 뒤에도 분모에 포함해 기록 유실과 100% 초과를 막습니다.
      scheduled.add(key);
    }
  }
  return {
    total: records.length,
    todayCount: dailyCounts.get(today) ?? 0,
    weekCount: weekDates.reduce((sum, day) => sum + (dailyCounts.get(day) ?? 0), 0),
    weekStart, weekEnd, lastSevenDays, priorityCounts,
    routines: { completed: completed.size, scheduled: scheduled.size,
      rate: scheduled.size ? Math.round(completed.size / scheduled.size * 100) : 0 },
  };
}
