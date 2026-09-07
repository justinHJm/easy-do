import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PriorityBadge } from '@/components/priority-badge';
import { Colors } from '@/constants/theme';
import type { VisibleTodo } from '@/types/todo';
import { dueLabel } from '@/utils/due-date';
import { recurrenceLabel } from '@/utils/todo-state';

const colors = Colors.light;
export function TodoItem({ todo, onToggle, onEdit, today }: { todo: VisibleTodo; onToggle: (id: number, occurrenceDate?: string) => void; onEdit: (todo: VisibleTodo) => void; today: Date }) {
  const due = todo.dueDate ? dueLabel(todo.dueDate, today) : null;
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title}, 수정`} onPress={() => onEdit(todo)} style={styles.editTarget}>
        <PriorityBadge priority={todo.priority} />
        <View style={styles.content}>
          <Text style={[styles.title, todo.completed && styles.completed]}>{todo.title}</Text>
          {due && <Text style={[styles.due, !todo.completed && (due.days < 0 ? styles.overdue : due.days <= 3 ? styles.soon : null)]}>{due.text}</Text>}
          {todo.recurrence && <Text style={styles.due}>↻ {recurrenceLabel(todo.recurrence)}</Text>}
        </View>
      </Pressable>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={todo.title}
        accessibilityHint={todo.completed ? '미완료로 되돌리기' : '완료하기'}
        accessibilityState={{ checked: todo.completed }} onPress={() => onToggle(todo.id, todo.occurrenceDate)}
        style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]}>
        <View style={[styles.checkbox, todo.completed && styles.checked]}>
          {todo.completed && <Text allowFontScaling={false} style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.backgroundElement },
  editTarget: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingVertical: 8 },
  content: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontSize: 16, lineHeight: 23, color: colors.text },
  due: { fontSize: 12, color: '#808080' }, overdue: { color: '#B52F3B' }, soon: { color: colors.primary },
  completed: { color: '#808080', textDecorationLine: 'line-through' },
  touchTarget: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#F8DEDE', borderColor: '#C45353' },
  checkmark: {
    color: '#B52F3B', fontSize: 23, fontWeight: '800',
    width: 24, height: 24, lineHeight: 24,
    textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false,
  },
  pressed: { opacity: 0.6 },
});
