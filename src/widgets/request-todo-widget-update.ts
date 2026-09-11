import { requestWidgetUpdate } from 'react-native-android-widget';

import { dateKey } from '@/utils/due-date';
import { emptyData } from '@/utils/todo-state';
import { renderTodoWidget } from '@/widgets/todo-widget';
import { ALL_TODO_WIDGET_NAME, loadTodoWidgetRepresentation, todoWidgetMode, TODO_WIDGET_NAME } from '@/widgets/todo-widget-handler';

// 앱과 위젯이 같은 정렬·완료 규칙을 사용하도록 저장본에서 다시 그립니다.
export async function requestTodoWidgetUpdate() {
  await Promise.all([TODO_WIDGET_NAME, ALL_TODO_WIDGET_NAME].map((widgetName) => requestWidgetUpdate({
    widgetName,
    renderWidget: async (widgetInfo) => {
      const now = new Date().toISOString();
      try {
        return (await loadTodoWidgetRepresentation(now, todoWidgetMode(widgetInfo.widgetName))).representation;
      } catch {
        // 앱에서 요청한 갱신도 저장소 오류 시 불투명한 기본 화면을 유지합니다.
        return renderTodoWidget(emptyData(), dateKey(new Date(now)), todoWidgetMode(widgetInfo.widgetName));
      }
    },
  })));
}
