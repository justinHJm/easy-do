import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/theme';
import type { TodoList, TodoView } from '@/types/todo';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

export const viewLabels = { all: '전체', today: '오늘', week: '이번 주', urgent: '기한 임박', routine: '루틴' };

export function TodoViews({ view, lists, onChange, onManage, vertical = false }: {
  view: TodoView; lists: TodoList[]; onChange: (view: TodoView) => void; onManage: () => void; vertical?: boolean;
}) {
  const options = [...Object.entries(viewLabels), ...lists.map((list) => [`list:${list.id}`, list.name])];
  return <View style={vertical && styles.sidebar}><ScrollView horizontal={!vertical} style={vertical && styles.verticalScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, vertical && styles.verticalChips]}>
    {options.map(([value, label]) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: value === view }}
      onPress={() => onChange(value as TodoView)} style={[styles.chip, vertical && styles.verticalChip, value === view && styles.selected]}>
      <Text style={value === view ? styles.green : styles.text}>{label}</Text>
    </Pressable>)}
    <Pressable accessibilityRole="button" accessibilityLabel="리스트 추가 및 관리" onPress={onManage} style={[styles.chip, vertical && styles.verticalChip]}><Text style={styles.green}>＋</Text></Pressable>
  </ScrollView></View>;
}

// 같은 선택기를 입력·편집 화면에서 재사용합니다. 이름이 바뀌어도 listId는 유지되어 Todo 소속이 보존됩니다.
export function ListChoices({ lists, value, onChange }: { lists: TodoList[]; value?: number; onChange: (id?: number) => void }) {
  return <View style={styles.wrap}>{[{ id: undefined, name: '미분류' }, ...lists].map((list) => (
    <Pressable key={list.id ?? 'none'} accessibilityRole="radio" accessibilityState={{ checked: value === list.id }}
      onPress={() => onChange(list.id)} style={[styles.chip, value === list.id && styles.selected]}>
      <Text style={styles.text}>{list.name}</Text>
    </Pressable>
  ))}</View>;
}

export function ListManager({ lists, onAdd, onRename, onDelete, onClose }: {
  lists: TodoList[]; onAdd: (name: string) => void; onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void; onClose: () => void;
}) {
  const layout = useResponsiveLayout();
  const [editingId, setEditingId] = useState<number>();
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<TodoList>();
  const duplicate = lists.some((list) => list.id !== editingId && list.name === name.trim());
  const canSave = !!name.trim() && !duplicate;
  function save() {
    if (!canSave) return;
    if (editingId === undefined) onAdd(name.trim()); else onRename(editingId, name.trim());
    setEditingId(undefined); setName('');
  }
  return <Modal transparent animationType="fade" onRequestClose={() => deleting ? setDeleting(undefined) : onClose()}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.panel, { maxWidth: layout.modalMaxWidth }]} accessibilityViewIsModal><ScrollView keyboardShouldPersistTaps="handled">
        {deleting ? <View style={styles.form}>
          <Text style={styles.heading}>리스트를 삭제할까요?</Text>
          <Text style={styles.text}>‘{deleting.name}’의 할 일은 삭제하지 않고 미분류로 옮겨요.</Text>
          <View style={styles.row}>
            <Pressable style={styles.chip} onPress={() => setDeleting(undefined)}><Text>취소</Text></Pressable>
            <Pressable style={styles.chip} onPress={() => { onDelete(deleting.id); setDeleting(undefined); setEditingId(undefined); setName(''); }}><Text style={styles.danger}>삭제</Text></Pressable>
          </View>
        </View> : <View style={styles.form}>
          <View style={styles.row}><Text style={styles.heading}>리스트 관리</Text><Pressable style={styles.chip} onPress={onClose}><Text>닫기</Text></Pressable></View>
          <Text style={styles.text}>{editingId === undefined ? '새 리스트' : '리스트 이름 변경'}</Text>
          <TextInput accessibilityLabel="리스트 이름" placeholder="예: 학교, 장보기" value={name} onChangeText={setName} style={styles.input} onSubmitEditing={save} />
          {duplicate && <Text style={styles.danger}>같은 이름의 리스트가 있어요.</Text>}
          <View style={styles.row}>
            {editingId !== undefined && <Pressable style={styles.chip} onPress={() => { setEditingId(undefined); setName(''); }}><Text>새로 만들기</Text></Pressable>}
            <Pressable style={[styles.chip, styles.selected, !canSave && { opacity: 0.4 }]} disabled={!canSave} onPress={save}><Text style={styles.green}>{editingId === undefined ? '추가' : '이름 저장'}</Text></Pressable>
          </View>
          {lists.map((list) => <View key={list.id} style={styles.row}>
            <Pressable accessibilityLabel={`${list.name} 이름 변경`} style={styles.listName} onPress={() => { setEditingId(list.id); setName(list.name); }}><Text style={styles.text}>{list.name} · 이름 변경</Text></Pressable>
            <Pressable accessibilityLabel={`${list.name} 삭제`} style={styles.chip} onPress={() => setDeleting(list)}><Text style={styles.danger}>삭제</Text></Pressable>
          </View>)}
        </View>}
      </ScrollView></View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  sidebar: { width: 176, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: '#E9EEE9' },
  verticalScroll: { flex: 1 },
  verticalChips: { paddingHorizontal: 8, paddingVertical: 8 },
  chip: { minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: '#F3F5F3' },
  verticalChip: { width: '100%' },
  selected: { backgroundColor: Colors.light.backgroundSelected }, green: { color: Colors.light.primary, fontWeight: '700' },
  text: { color: Colors.light.text, fontSize: 13 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 360, maxHeight: '85%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16 },
  form: { gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  heading: { color: Colors.light.text, fontSize: 18, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#D9E3DC', borderRadius: 10, padding: 12, color: Colors.light.text },
  danger: { color: '#B52F3B' }, listName: { flex: 1, minHeight: 44, justifyContent: 'center' },
});
