import { registerWidgetTaskHandler, type WidgetRepresentation, type WidgetTaskHandlerProps } from 'react-native-android-widget';

import { loadDataWithDiagnostics, saveData } from '@/storage/todo-storage';
import { dateKey, isDueDate } from '@/utils/due-date';
import { emptyData, getTodoSummary, initializeLocalData, rollover, updateData, visibleTodos } from '@/utils/todo-state';
import type { TodoData } from '@/types/todo';
import { renderTodoWidget, type TodoWidgetMode, type TodoWidgetOptions } from '@/widgets/todo-widget';

const TODO_WIDGET_NAME = 'TodoWidget';
const ALL_TODO_WIDGET_NAME = 'AllTodoWidget';
const CELEBRATION_MS = 1500;
let celebration: { expiresAt: number } | undefined;
let pendingCompletion: Promise<unknown> = Promise.resolve();

export function todoWidgetMode(widgetName: string): TodoWidgetMode {
  return widgetName === ALL_TODO_WIDGET_NAME ? 'all' : 'today';
}

export function isTodoWidgetRefreshAction(widgetAction: WidgetTaskHandlerProps['widgetAction'], clickAction?: string): boolean {
  return widgetAction === 'WIDGET_CLICK' && clickAction === 'REFRESH_TODOS';
}

function toggleAction(data: Record<string, unknown>) {
  const id = data.id;
  const occurrenceDate = data.occurrenceDate;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null;
  if (occurrenceDate !== undefined && (typeof occurrenceDate !== 'string' || !isDueDate(occurrenceDate))) return null;
  return { type: 'toggle' as const, id, ...(typeof occurrenceDate === 'string' ? { occurrenceDate } : {}) };
}

export async function loadTodoWidgetRepresentation(now: string, mode: TodoWidgetMode = 'today', options: TodoWidgetOptions = {}): Promise<{ data: TodoData; representation: WidgetRepresentation }> {
  const loaded = await loadDataWithDiagnostics(now);
  const initialized = initializeLocalData(loaded.data, now);
  const data = rollover(initialized, dateKey(new Date(now)));
  const today = dateKey(new Date(now));
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.info('Todo widget storage', {
      key: loaded.key,
      rawExists: loaded.rawExists,
      parsedTodoCount: loaded.data.todos.length,
      widgetSelectableCount: getTodoSummary(visibleTodos(data, mode, today)).incompleteTodos.length,
    });
  }
  if (data.settings.widgetCharacter === false) celebration = undefined;
  return { data, representation: renderTodoWidget(data, today, mode, {
    ...options, celebrating: (celebration?.expiresAt ?? 0) > Date.now(),
  }) };
}

function completeTodo(clickActionData: Record<string, unknown>) {
  // Concurrent widget taps must read the result of the preceding save.
  const completion = pendingCompletion.then(async () => {
    const action = toggleAction(clickActionData);
    if (!action) return null;
    const now = new Date().toISOString();
    const today = dateKey(new Date(now));
    const loaded = await loadDataWithDiagnostics(now);
    const data = rollover(initializeLocalData(loaded.data, now), today);
    const pending = visibleTodos(data, 'all', today).some((todo) =>
      todo.id === action.id && todo.occurrenceDate === action.occurrenceDate && !todo.completed);
    if (!pending) return null;
    const next = updateData(data, action, now);
    if (next === data) return null;
    await saveData(next);
    const reaction = next.settings.widgetCharacter !== false ? { expiresAt: Date.now() + CELEBRATION_MS } : undefined;
    celebration = reaction;
    return { reaction };
  });
  pendingCompletion = completion.catch(() => {});
  return completion;
}

async function handleTodoWidget({ widgetInfo, widgetAction, clickAction, clickActionData, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction !== 'WIDGET_ADDED' && widgetAction !== 'WIDGET_UPDATE' &&
    widgetAction !== 'WIDGET_RESIZED' && widgetAction !== 'WIDGET_CLICK') return;
  const now = new Date().toISOString();
  const today = dateKey(new Date(now));
  const mode = todoWidgetMode(widgetInfo.widgetName);

  try {
    if (isTodoWidgetRefreshAction(widgetAction, clickAction)) {
      renderWidget((await loadTodoWidgetRepresentation(now, mode, { size: widgetInfo, refreshing: true })).representation);
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      renderWidget((await loadTodoWidgetRepresentation(new Date().toISOString(), mode, { size: widgetInfo })).representation);
      return;
    }

    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_TODO' && clickActionData) {
      const result = await completeTodo(clickActionData);
      if (result) {
        const { requestTodoWidgetUpdate } = await import('@/widgets/request-todo-widget-update');
        await requestTodoWidgetUpdate();
        const { reaction } = result;
        if (reaction && celebration === reaction) {
          // Keep this one-shot reset inside the library's awaited headless task.
          await new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, reaction.expiresAt - Date.now())));
          if (celebration === reaction) {
            celebration = undefined;
            await requestTodoWidgetUpdate();
          }
        }
        return;
      }
    }

    renderWidget((await loadTodoWidgetRepresentation(now, mode, { size: widgetInfo })).representation);
  } catch {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('Todo widget update failed');
    if (widgetAction === 'WIDGET_ADDED') renderWidget(renderTodoWidget(emptyData(), today, mode));
  }
}

export function registerTodoWidgetHandler() {
  registerWidgetTaskHandler(handleTodoWidget);
}

export { ALL_TODO_WIDGET_NAME, TODO_WIDGET_NAME };
