import { useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PriorityBadge, priorityLabels } from '@/components/priority-badge';
import { Colors } from '@/constants/theme';
import type { TodoPriority } from '@/types/todo';

const colors = Colors.light;

export function TodoInput({ onAdd }: { onAdd: (title: string, priority: TodoPriority) => void }) {
  // useState로 입력 중인 내용과 선택값, 팝업 표시 여부를 기억합니다. 아직 추가하지 않은 내용은 저장하지 않습니다.
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('normal');
  const [menuOpen, setMenuOpen] = useState(false);
  const canAdd = title.trim().length > 0;
  // 버튼과 키보드 제출이 같은 검증을 거칩니다. 추가 후 입력값을 초기화해 다음 Todo를 바로 입력하게 합니다.
  function submit() {
    if (!canAdd) return;
    onAdd(title.trim(), priority);
    setTitle('');
    setPriority('normal');
  }
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={`우선순위 ${priorityLabels[priority]}, 변경`}
          accessibilityState={{ expanded: menuOpen }}
          onPress={() => { Keyboard.dismiss(); setMenuOpen(true); }} style={styles.priorityButton}>
          <PriorityBadge priority={priority} />
          <Text style={styles.caption}>▾</Text>
        </Pressable>
        <TextInput accessibilityLabel="할 일 입력" placeholder="할 일을 입력하세요"
          placeholderTextColor={colors.textSecondary} value={title} onChangeText={setTitle}
          onSubmitEditing={submit} returnKeyType="done" submitBehavior="submit"
          selectionColor={colors.primary} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="할 일 추가"
          accessibilityState={{ disabled: !canAdd }} disabled={!canAdd} onPress={submit}
          style={({ pressed }) => [styles.add, !canAdd && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.addText}>추가</Text>
        </Pressable>
      </View>
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="우선순위 메뉴 닫기"
            onPress={() => setMenuOpen(false)} />
          <View style={styles.menu} accessibilityViewIsModal>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>우선순위</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={() => setMenuOpen(false)} style={styles.close}>
                <Text style={styles.caption}>닫기</Text>
              </Pressable>
            </View>
            <View accessibilityRole="radiogroup" accessibilityLabel="우선순위 선택">
        {(['high', 'normal', 'low'] as const).map((value) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityLabel={priorityLabels[value]}
            accessibilityState={{ checked: priority === value }} onPress={() => { setPriority(value); setMenuOpen(false); }}
            style={({ pressed }) => [styles.option, priority === value && styles.selected, pressed && styles.pressed]}>
            <PriorityBadge priority={value} />
            {priority === value && <Text style={styles.selectedText}>✓</Text>}
          </Pressable>
        ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 4 },
  priorityButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  menu: { width: 240, maxWidth: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, elevation: 6 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuTitle: { color: colors.text, fontSize: 15, fontWeight: '600', paddingLeft: 12 },
  close: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#D9E3DC', backgroundColor: colors.background, color: colors.text, fontSize: 16 },
  add: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary },
  addText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  caption: { fontSize: 13, color: colors.textSecondary },
  option: { minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12 },
  selected: { backgroundColor: colors.backgroundSelected },
  selectedText: { color: colors.primary, fontWeight: '700' },
});
