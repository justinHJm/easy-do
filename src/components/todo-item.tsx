import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PriorityBadge } from '@/components/priority-badge';
import { Colors } from '@/constants/theme';
import type { Todo } from '@/types/todo';

const colors = Colors.light;
export function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: number) => void }) {
  return (
    <View style={styles.row}>
      <PriorityBadge priority={todo.priority} />
      <Text style={[styles.title, todo.completed && styles.completed]}>{todo.title}</Text>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={todo.title}
        accessibilityHint={todo.completed ? '미완료로 되돌리기' : '완료하기'}
        accessibilityState={{ checked: todo.completed }} onPress={() => onToggle(todo.id)}
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
  title: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 23, color: colors.text, paddingVertical: 10 },
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
