import { StyleSheet, Text } from 'react-native';
import type { TodoPriority } from '@/types/todo';

export const priorityLabels: Record<TodoPriority, string> = { high: '높음', normal: '보통', low: '낮음' };
const palette = {
  high: { color: '#A33E3E', backgroundColor: '#FBECEC' },
  normal: { color: '#8A591D', backgroundColor: '#FCF2DF' },
  low: { color: '#438563', backgroundColor: '#EAF3ED' },
};

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  return <Text style={[styles.badge, palette[priority]]}>{priorityLabels[priority]}</Text>;
}

const styles = StyleSheet.create({
  badge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, overflow: 'hidden', flexShrink: 0 },
});
