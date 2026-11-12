import { getWidgetInfo, requestWidgetUpdateById } from 'react-native-android-widget';

import { dateKey } from '@/utils/due-date';
import { emptyData } from '@/utils/todo-state';
import { renderTodoWidget } from '@/widgets/todo-widget';
import { ALL_TODO_WIDGET_NAME, loadTodoWidgetRepresentation, todoWidgetMode, TODO_WIDGET_NAME } from '@/widgets/todo-widget-handler';

let pendingUpdate: Promise<void> = Promise.resolve();

export function requestTodoWidgetUpdate() {
  // The library's bulk API returns before its async render callbacks complete.
  const update = pendingUpdate.then(async () => {
    const groups = await Promise.all([TODO_WIDGET_NAME, ALL_TODO_WIDGET_NAME].map(getWidgetInfo));
    const widgets = groups.flat();
    const results = await Promise.allSettled(widgets.map(({ widgetName, widgetId }) => requestWidgetUpdateById({
      widgetName, widgetId,
      renderWidget: async (widgetInfo) => {
        const now = new Date().toISOString();
        const mode = todoWidgetMode(widgetInfo.widgetName);
        try {
          return (await loadTodoWidgetRepresentation(now, mode, { size: widgetInfo })).representation;
        } catch {
          // 앱에서 요청한 갱신도 저장소 오류 시 불투명한 기본 화면을 유지합니다.
          return renderTodoWidget(emptyData(), dateKey(new Date(now)), mode);
        }
      },
    })));
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
  });
  pendingUpdate = update.catch(() => {});
  return update;
}
