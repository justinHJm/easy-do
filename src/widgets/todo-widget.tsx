'use no memo';

import { FlexWidget, ImageWidget, TextWidget, type WidgetRepresentation } from 'react-native-android-widget';

import { dueLabel, localDate } from '@/utils/due-date';
import { getTodoSummary, prioritySymbols, visibleTodos } from '@/utils/todo-state';
import type { TodoData } from '@/types/todo';

type WidgetColors = {
  background: `#${string}`;
  text: `#${string}`;
  muted: `#${string}`;
  accent: `#${string}`;
  border: `#${string}`;
};

const lightColors: WidgetColors = {
  background: '#FFFFFF', text: '#1E293B', muted: '#64748B', accent: '#22A06B', border: '#E2E8F0',
};
const darkColors: WidgetColors = {
  background: '#18221E', text: '#F1F5F9', muted: '#A8B5AE', accent: '#69D39A', border: '#33463C',
};

const refreshIcon = require('../../assets/widgets/refresh-icon.png');

export type TodoWidgetMode = 'today' | 'all';

export function getTodoWidgetTodos(data: TodoData, today: string, mode: TodoWidgetMode) {
  return getTodoSummary(visibleTodos(data, mode, today)).incompleteTodos;
}

export function widgetDueLabel(value: string, today: string) {
  const due = dueLabel(value, localDate(today));
  if (due.days <= 7) return due.text;
  const [year, month, day] = value.split('-').map(Number);
  const compactDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  return year === localDate(today).getFullYear() ? compactDate : `${String(year).slice(-2)}/${compactDate}`;
}

function TodoWidgetContent({ data, today, colors, mode, refreshing }: {
  data: TodoData; today: string; colors: WidgetColors; mode: TodoWidgetMode; refreshing: boolean;
}) {
  const incompleteTodos = getTodoWidgetTodos(data, today, mode);
  const todos = incompleteTodos.slice(0, 4);
  const title = mode === 'today' ? '오늘 Todo' : '전체 Todo';
  const emptyText = refreshing ? '새로고침 중이에요...' : mode === 'today' ? '오늘 할 일이 없어요' : '할 일이 없어요';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'column', padding: 14, backgroundColor: colors.background, borderRadius: 18 }}>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <FlexWidget>
          <TextWidget text={title} truncate="END" maxLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text={`할 일 ${incompleteTodos.length}개`} style={{ color: colors.accent, fontSize: 13, fontWeight: 'bold' }} />
          <FlexWidget
            clickAction="REFRESH_TODOS"
            accessibilityLabel="할 일 새로고침"
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
            <ImageWidget image={refreshIcon} imageWidth={24} imageHeight={24} resizeMode="contain"
              style={{ width: 24, height: 24, rotation: refreshing ? 90 : 0 }} />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
      {todos.length === 0 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget text={emptyText} style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }} />
        </FlexWidget>
      ) : todos.map((todo) => {
        const dueText = mode === 'all' && todo.dueDate ? widgetDueLabel(todo.dueDate, today) : undefined;
        return <FlexWidget key={`${todo.id}-${todo.occurrenceDate ?? ''}`} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <TextWidget
            text="○"
            clickAction="TOGGLE_TODO"
            clickActionData={todo.recurrence ? { id: todo.id, occurrenceDate: todo.occurrenceDate } : { id: todo.id }}
            style={{ color: colors.accent, fontSize: 22, marginRight: 8 }} />
          {!!prioritySymbols[todo.priority] && <TextWidget text={prioritySymbols[todo.priority]} style={{ color: '#B52F3B', fontSize: 12, fontWeight: 'bold', marginRight: 6 }} />}
          <FlexWidget style={{ flex: 1 }}>
            <TextWidget text={todo.title} truncate="END" maxLines={1} style={{ color: colors.text, fontSize: 14 }} />
          </FlexWidget>
          {dueText && <TextWidget text={dueText} truncate="END" maxLines={1} style={{ color: colors.muted, fontSize: 11, marginLeft: 6 }} />}
        </FlexWidget>
      })}
    </FlexWidget>
  );
}

// Android의 야간 모드에 맞춰 같은 Todo 내용을 두 색상으로 제공합니다.
export function renderTodoWidget(data: TodoData, today: string, mode: TodoWidgetMode = 'today', { refreshing = false }: { refreshing?: boolean } = {}): WidgetRepresentation {
  return {
    light: <TodoWidgetContent data={data} today={today} colors={lightColors} mode={mode} refreshing={refreshing} />,
    dark: <TodoWidgetContent data={data} today={today} colors={darkColors} mode={mode} refreshing={refreshing} />,
  };
}
