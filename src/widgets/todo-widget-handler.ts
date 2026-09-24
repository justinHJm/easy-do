import { registerWidgetTaskHandler, type WidgetRepresentation, type WidgetTaskHandlerProps } from 'react-native-android-widget';

import { loadDataWithDiagnostics, saveData } from '@/storage/todo-storage';
import { dateKey, isDueDate } from '@/utils/due-date';
import { emptyData, getTodoSummary, initializeLocalData, rollover, updateData, visibleTodos } from '@/utils/todo-state';
import type { TodoData } from '@/types/todo';
import { renderTodoWidget, type TodoWidgetMode } from '@/widgets/todo-widget';

const TODO_WIDGET_NAME = 'TodoWidget';
const ALL_TODO_WIDGET_NAME = 'AllTodoWidget';

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

export async function loadTodoWidgetRepresentation(now: string, mode: TodoWidgetMode = 'today'): Promise<{ data: TodoData; representation: WidgetRepresentation }> {
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
  return { data, representation: renderTodoWidget(data, today, mode) };
}

async function handleTodoWidget({ widgetInfo, widgetAction, clickAction, clickActionData, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction !== 'WIDGET_ADDED' && widgetAction !== 'WIDGET_UPDATE' &&
    widgetAction !== 'WIDGET_RESIZED' && widgetAction !== 'WIDGET_CLICK') return;
  const now = new Date().toISOString();
  const today = dateKey(new Date(now));
  const mode = todoWidgetMode(widgetInfo.widgetName);

  // 저장소를 읽기 전에도 불투명한 기본 화면을 먼저 표시합니다.
  try {
    renderWidget(renderTodoWidget(emptyData(), today, mode, { refreshing: isTodoWidgetRefreshAction(widgetAction, clickAction) }));
  } catch {
    return;
  }

  try {
    if (isTodoWidgetRefreshAction(widgetAction, clickAction)) {
      // 라이브러리에 애니메이션 API가 없어 짧은 아이콘 상태로 새로고침을 알립니다.
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      renderWidget((await loadTodoWidgetRepresentation(now, mode)).representation);
      return;
    }

    const loaded = await loadTodoWidgetRepresentation(now, mode);
    let data = loaded.data;

    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_TODO' && clickActionData) {
      const action = toggleAction(clickActionData);
      if (action) data = updateData(data, action, now);
    }

    // 수동 새로고침은 저장본을 바꾸지 않고 현재 내용을 다시 그립니다.
    // 위젯에서 계산한 초기화·완료 변경도 앱 저장본에 먼저 반영합니다.
    await saveData(data);
    renderWidget(data === loaded.data ? loaded.representation : renderTodoWidget(data, today, mode));
    if (data !== loaded.data) {
      // 완료 직후 두 종류의 모든 위젯 인스턴스도 같은 저장본으로 다시 그립니다.
      const { requestTodoWidgetUpdate } = await import('@/widgets/request-todo-widget-update');
      await requestTodoWidgetUpdate();
    }
  } catch {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('Todo widget update failed');
    // 저장소 또는 실제 데이터 렌더링 실패 시 기본 화면을 유지합니다.
  }
}

export function registerTodoWidgetHandler() {
  registerWidgetTaskHandler(handleTodoWidget);
}

export { ALL_TODO_WIDGET_NAME, TODO_WIDGET_NAME };
