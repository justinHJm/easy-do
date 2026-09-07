import { useEffect, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PriorityBadge, priorityLabels } from '@/components/priority-badge';
import { Colors } from '@/constants/theme';
import type { TodoList, TodoPriority } from '@/types/todo';
import { ListChoices } from '@/components/todo-views';

const colors = Colors.light;

export function TodoInput({ onAdd, lists, defaultListId, disabled }: {
  onAdd: (title: string, priority: TodoPriority, listId?: number) => void; lists: TodoList[]; defaultListId?: number; disabled: boolean;
}) {
  // useState로 입력 중인 내용과 선택값, 팝업 표시 여부를 기억합니다. 아직 추가하지 않은 내용은 저장하지 않습니다.
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('normal');
  const [menuOpen, setMenuOpen] = useState(false);
  const [listId, setListId] = useState(defaultListId);
  // 리스트 보기를 이동하면 새 할 일의 기본 소속도 따라갑니다. 삭제된 리스트 ID는 보내지 않습니다.
  useEffect(() => setListId(defaultListId), [defaultListId]);
  const selectedList = lists.find((list) => list.id === listId);
  const canAdd = !disabled && title.trim().length > 0;
  // 버튼과 키보드 제출이 같은 검증을 거칩니다. 추가 후 입력값을 초기화해 다음 Todo를 바로 입력하게 합니다.
  function submit() {
    if (!canAdd) return;
    onAdd(title.trim(), priority, selectedList?.id);
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
        <TextInput editable={!disabled} accessibilityLabel="할 일 입력" placeholder={disabled ? '저장 데이터 불러오는 중' : '할 일을 입력하세요'}
          placeholderTextColor={colors.textSecondary} value={title} onChangeText={setTitle}
          onSubmitEditing={submit} returnKeyType="done" submitBehavior="submit"
          selectionColor={colors.primary} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="할 일 추가"
          accessibilityState={{ disabled: !canAdd }} disabled={!canAdd} onPress={submit}
          style={({ pressed }) => [styles.add, !canAdd && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.addText}>추가</Text>
        </Pressable>
      </View>
      {lists.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="새 할 일의 리스트 선택" style={styles.listButton}
        onPress={() => { Keyboard.dismiss(); setMenuOpen(true); }}><Text numberOfLines={1} style={styles.caption}>리스트: {selectedList?.name ?? '미분류'} ▾</Text></Pressable>}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="우선순위 메뉴 닫기"
            onPress={() => setMenuOpen(false)} />
          <View style={styles.menu} accessibilityViewIsModal><ScrollView keyboardShouldPersistTaps="handled">
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
            {lists.length > 0 && <><Text style={styles.menuTitle}>리스트</Text><ListChoices lists={lists} value={selectedList?.id}
              onChange={(id) => { setListId(id); setMenuOpen(false); }} /></>}
          </ScrollView></View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 4 },
  priorityButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  menu: { width: 280, maxWidth: '90%', maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, elevation: 6 },
  listButton: { minHeight: 32, justifyContent: 'center', alignSelf: 'flex-start', maxWidth: '100%' },
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
