import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Recurrence, Todo, TodoEdits, TodoList, TodoPriority } from '@/types/todo';
import { Colors } from '@/constants/theme';
import { PriorityBadge, priorityLabels } from '@/components/priority-badge';
import { TodoCalendar } from '@/components/todo-calendar';
import { dateKey, fullDate } from '@/utils/due-date';
import { ListChoices } from '@/components/todo-views';
import { RecurrencePicker } from '@/components/recurrence-picker';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

export function TodoEditor({ todo, lists, onSave, onDelete, onClose }: {
  todo: Todo; lists: TodoList[]; onSave: (id: number, changes: TodoEdits) => void; onDelete: (id: number) => void; onClose: () => void;
}) {
  const layout = useResponsiveLayout();
  // 원본이 아닌 편집 사본을 유지합니다. 닫기·뒤로 가기는 저장하지 않은 변경을 버립니다.
  const [title, setTitle] = useState(todo.title);
  const [priority, setPriority] = useState<TodoPriority>(todo.priority);
  const [dueDate, setDueDate] = useState(todo.recurrence?.startDate ?? todo.dueDate);
  const [listId, setListId] = useState(todo.listId);
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(todo.recurrence);
  const [page, setPage] = useState<'edit' | 'calendar' | 'delete'>('edit');
  const [showPriority, setShowPriority] = useState(false);
  function close() { if (page === 'edit') onClose(); else setPage('edit'); }
  function save() {
    if (!title.trim()) return;
    // dueDate가 undefined이면 기한 제거를 뜻합니다. 완료 여부는 편집 대상에 포함하지 않습니다.
    // 반복의 시작일은 날짜 전용 값입니다. 사용자가 달력을 비웠으면 오늘부터 시작합니다.
    onSave(todo.id, { title: title.trim(), priority, dueDate, listId,
      recurrence: recurrence ? { ...recurrence, startDate: dueDate ?? dateKey(new Date()) } : undefined });
    onClose();
  }
  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="수정 화면 닫기" onPress={close} />
        <View style={[styles.panel, { maxWidth: layout.modalMaxWidth }]} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled">
            {page === 'calendar' ? <TodoCalendar value={dueDate} onCancel={() => setPage('edit')}
              onConfirm={(value) => { setDueDate(value); setPage('edit'); }} /> : page === 'delete' ? (
              <View style={styles.confirm}>
                <Text style={styles.heading}>이 Todo를 삭제할까요?</Text>
                <Text style={styles.body}>{todo.title}</Text>
                {todo.recurrence && <Text style={styles.body}>반복을 종료해요. 이미 완료한 회차 기록은 남아요.</Text>}
                <View style={styles.row}>
                  <Pressable accessibilityRole="button" style={styles.button} onPress={() => setPage('edit')}><Text>취소</Text></Pressable>
                  <Pressable accessibilityRole="button" style={styles.button} onPress={() => { onDelete(todo.id); onClose(); }}><Text style={styles.danger}>삭제</Text></Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.row}><Text style={styles.heading}>할 일 수정</Text><Pressable accessibilityRole="button" style={styles.button} onPress={onClose}><Text>닫기</Text></Pressable></View>
                <Text style={styles.label}>제목</Text>
                <TextInput accessibilityLabel="할 일 제목 수정" value={title} onChangeText={setTitle} style={styles.input} selectionColor={Colors.light.primary} />
                <Text style={styles.label}>우선순위</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`우선순위 ${priorityLabels[priority]}`}
                  accessibilityState={{ expanded: showPriority }} style={styles.field} onPress={() => setShowPriority((value) => !value)}>
                  <PriorityBadge priority={priority} /><Text>▾</Text>
                </Pressable>
                {showPriority && <View style={styles.row}>{(['veryHigh', 'high', 'medium', 'none'] as const).map((value) => (
                  <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: priority === value }}
                    accessibilityLabel={priorityLabels[value]} style={styles.button} onPress={() => { setPriority(value); setShowPriority(false); }}><PriorityBadge priority={value} /></Pressable>
                ))}</View>}
                <Text style={styles.label}>리스트</Text>
                <ListChoices lists={lists} value={listId} onChange={setListId} />
                <Text style={styles.label}>{recurrence ? '반복 시작일' : '기한'}</Text>
                <Pressable accessibilityRole="button" style={styles.field} onPress={() => { Keyboard.dismiss(); setPage('calendar'); }}>
                  <Text style={styles.body}>{dueDate ? fullDate(dueDate) : recurrence ? '오늘부터' : '기한 없음'}</Text><Text>▾</Text>
                </Pressable>
                <Text style={styles.label}>반복</Text>
                <RecurrencePicker value={recurrence} startDate={dueDate ?? dateKey(new Date())} onChange={setRecurrence} />
                <View style={styles.row}>
                  <Pressable accessibilityRole="button" style={styles.button} onPress={() => { Keyboard.dismiss(); setPage('delete'); }}><Text style={styles.danger}>삭제</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityState={{ disabled: !title.trim() }} disabled={!title.trim()}
                    style={[styles.save, !title.trim() && styles.disabled]} onPress={save}><Text style={styles.white}>저장</Text></Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 360, maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16 },
  form: { gap: 8 }, confirm: { gap: 16 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 18, fontWeight: '700', color: Colors.light.text }, label: { fontSize: 13, color: Colors.light.textSecondary },
  input: { borderWidth: 1, borderColor: '#D9E3DC', borderRadius: 10, minHeight: 48, padding: 12, fontSize: 16, color: Colors.light.text },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement, borderRadius: 10 },
  body: { color: Colors.light.text, fontSize: 14 }, button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  danger: { color: '#B52F3B', fontWeight: '600' }, save: { backgroundColor: Colors.light.primary, minHeight: 44, borderRadius: 10, paddingHorizontal: 28, justifyContent: 'center' },
  white: { color: '#FFFFFF', fontWeight: '600' }, disabled: { opacity: 0.4 },
});
