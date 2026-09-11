import { StyleSheet, Text } from 'react-native';
import type { TodoPriority } from '@/types/todo';
import { prioritySymbols } from '@/utils/todo-state';

export const priorityLabels: Record<TodoPriority, string> = { veryHigh: '매우 높음', high: '높음', medium: '보통', none: '없음' };
export { prioritySymbols };
const palette: Record<TodoPriority, object> = {
  veryHigh: { color: '#B52F3B', backgroundColor: '#FBECEC' }, high: { color: '#B52F3B', backgroundColor: '#FBECEC' },
  medium: { color: '#8A591D', backgroundColor: '#FCF2DF' }, none: { color: '#64748B', backgroundColor: '#F1F5F9' },
};

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const symbol = prioritySymbols[priority];
  return <Text style={[styles.badge, palette[priority]]}>{symbol ? `${symbol} ${priorityLabels[priority]}` : priorityLabels[priority]}</Text>;
}

const styles = StyleSheet.create({
  badge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, overflow: 'hidden', flexShrink: 0 },
});
