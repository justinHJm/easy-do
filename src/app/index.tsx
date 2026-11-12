import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CharacterGreeting } from '@/components/character-greeting';
import { randomReaction, restingReaction } from '@/constants/character';
import { useHomeCharacter } from '@/hooks/use-home-character';

import { TodoInput } from '@/components/todo-input';
import { TodoItem } from '@/components/todo-item';
import { Colors } from '@/constants/theme';
import { useTodoContext } from '@/contexts/todo-context';
import { TodoEditor } from '@/components/todo-editor';
import type { TodoView } from '@/types/todo';
import { ListManager, TodoViews, viewLabels } from '@/components/todo-views';
import { localDate } from '@/utils/due-date';
import { visibleTodos } from '@/utils/todo-state';

const colors = Colors.light;

export default function HomeScreen() {
  const { todos, lists, today, loaded, storageError, retryStorage, getView, addTodo, toggleTodo, editTodo, deleteTodo,
    addList, renameList, deleteList, profile, settings } = useTodoContext();
  const welcomeEnabled = settings.welcomeMessages !== false;
  const reactionsEnabled = settings.characterReactions !== false;
  const displayName = typeof profile.displayName === 'string' ? profile.displayName : undefined;
  const [view, setView] = useState<TodoView>('all');
  const [managingLists, setManagingLists] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  // 화면용 반복 회차에는 계산된 날짜가 붙습니다. 편집은 ID로 찾은 원본을 사용해 반복 시작일을 지킵니다.
  const editingTodo = todos.find((todo) => todo.id === editingId);
  const selectedList = lists.find((list) => view === `list:${list.id}`);
  const activeView = view.startsWith('list:') && !selectedList ? 'all' : view;
  const heading = selectedList?.name ?? viewLabels[activeView as keyof typeof viewLabels];
  const { incompleteTodos, completedTodos, totalCount, completedCount, completionRate } = getView(activeView);
  useEffect(() => {
    if (activeView !== view) setView(activeView);
  }, [activeView, view]);
  // 접기 여부는 화면만의 useState로 관리합니다. 목록을 접어도 Context의 완료 데이터는 삭제되지 않습니다.
  const [showCompleted, setShowCompleted] = useState(true);

  const { reaction, active: characterActive, hour, play } = useHomeCharacter(welcomeEnabled, reactionsEnabled, displayName);
  const pending = reactionsEnabled ? (activeView === 'all' ? incompleteTodos : getView('all').incompleteTodos) : [];
  const resting = reactionsEnabled
    ? restingReaction(hour, todos.length > 0, pending.length > 0,
      pending.some((todo) => todo.dueDate !== undefined && todo.dueDate < today))
    : { mood: 'idle' as const, message: '하나씩 해봐요!' };

  function handleToggleTodo(id: number, occurrenceDate?: string) {
    const result = toggleTodo(id, occurrenceDate);
    if (!reactionsEnabled || !result) return;

    // 처리 직후 원본을 읽어 연속 입력·완료 취소·자정의 이전 회차가 축하로 이어지지 않게 합니다.
    const completed = visibleTodos(result.data, 'all', result.today).find((todo) =>
      todo.id === id && todo.occurrenceDate === occurrenceDate && todo.completed);
    if (!completed) return;

    const allTodayDone = completed.dueDate === result.today
      && visibleTodos(result.data, 'today', result.today).every((todo) => todo.completed);
    if (allTodayDone) {
      play('celebrate', { mood: 'celebrate', message: '오늘 할 일을 모두 해냈어요!' });
    } else {
      play('completed', randomReaction('completed'));
    }
  }
  const percent = Math.round(completionRate);
  // SectionList에 미완료·완료 구역을 전달합니다. 접힌 완료 구역은 표시용 배열만 비워 진행률을 유지합니다.
  const sections = [
    { key: 'incomplete', data: incompleteTodos },
    { key: 'completed', data: showCompleted ? completedTodos : [] },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.logo} accessible accessibilityLabel="easy-do">
            <View style={styles.sprout} importantForAccessibility="no-hide-descendants" aria-hidden>
              <View style={styles.stem} />
              <View style={styles.leftLeaf} />
              <View style={styles.rightLeaf} />
            </View>
            <Text style={styles.brand}>easy-do</Text>
          </View>
          <View style={styles.headingRow}>
            <Text style={styles.title}>{heading}</Text>
            <Text style={styles.summary} accessibilityLiveRegion="polite">{completedCount}/{totalCount} 완료 · {percent}%</Text>
          </View>
          <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={`${heading} 완료율`}
            accessibilityValue={{ min: 0, max: 100, now: percent }}>
            <View style={[styles.progress, { width: `${completionRate}%` }]} />
          </View>
        </View>
        {(welcomeEnabled || reactionsEnabled) && <CharacterGreeting {...(reaction ?? resting)}
          active={characterActive && reactionsEnabled}
          idleMessageTimeout={characterActive ? 1250 : 0}
          onPress={reactionsEnabled ? () => play('touch', { mood: 'surprised', message: '앗, 반가워요!' }) : undefined} />}
        {storageError && <Pressable accessibilityRole="button" onPress={retryStorage} style={styles.storageNotice}>
          <Text style={styles.error}>{storageError} · 다시 시도</Text>
        </Pressable>}
        <TodoInput onAdd={(title, priority, listId) => addTodo(title, priority, listId, activeView === 'today')}
          lists={lists} defaultListId={selectedList?.id} disabled={!loaded} />
        <TodoViews view={activeView} lists={lists} onChange={setView} onManage={() => { if (loaded) setManagingLists(true); }} />
        <SectionList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          extraData={today}
          renderItem={({ item }) => <TodoItem todo={item} onToggle={handleToggleTodo} onEdit={(todo) => setEditingId(todo.id)} today={localDate(today)} />}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderSectionHeader={({ section }) => section.key === 'completed' ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`완료한 일 ${completedCount}개`}
              accessibilityState={{ expanded: showCompleted }} onPress={() => setShowCompleted((value) => !value)}
              style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
              <Text style={styles.sectionTitle}>완료한 일 {completedCount}개</Text>
              <Text style={styles.summary}>{showCompleted ? '접기 ∧' : '펼치기 ∨'}</Text>
            </Pressable>
          ) : <Text style={styles.pendingTitle}>할 일 {incompleteTodos.length}개</Text>}
          renderSectionFooter={({ section }) => {
            if (section.key === 'incomplete' && incompleteTodos.length === 0) {
              return <Text style={styles.empty}>{!loaded ? '저장 데이터를 기다리고 있어요.' : totalCount === 0 ? '이 보기에 해당하는 할 일이 없어요.' : '이 보기의 할 일을 모두 마쳤어요!'}</Text>;
            }
            if (section.key === 'completed' && showCompleted && completedCount === 0) {
              return <Text style={styles.empty}>완료한 일이 여기에 표시돼요.</Text>;
            }
            return null;
          }}
        />
        {editingTodo && <TodoEditor key={editingTodo.id} todo={editingTodo} lists={lists}
          onSave={editTodo} onDelete={deleteTodo} onClose={() => setEditingId(undefined)} />}
        {managingLists && <ListManager lists={lists} onAdd={addList} onRename={renameList} onDelete={deleteList} onClose={() => setManagingLists(false)} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  storageNotice: { paddingHorizontal: 16, paddingVertical: 6 }, error: { fontSize: 12, color: '#B52F3B' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 6 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: -0.7, color: colors.primary },
  sprout: { width: 27, height: 27 },
  stem: { position: 'absolute', width: 3, height: 17, backgroundColor: colors.primary, left: 13, top: 10, borderRadius: 2 },
  leftLeaf: { position: 'absolute', width: 14, height: 9, left: 0, top: 6, backgroundColor: '#79AA7A', borderTopRightRadius: 10, borderBottomLeftRadius: 10, transform: [{ rotate: '25deg' }] },
  rightLeaf: { position: 'absolute', width: 15, height: 10, left: 12, top: 2, backgroundColor: colors.primary, borderTopLeftRadius: 10, borderBottomRightRadius: 10, transform: [{ rotate: '-25deg' }] },
  headingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  summary: { fontSize: 13, color: colors.textSecondary },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.backgroundSelected, overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: colors.primary },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  pendingTitle: { paddingVertical: 10, fontSize: 14, fontWeight: '600', color: colors.text },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  empty: { fontSize: 14, color: colors.textSecondary, paddingVertical: 16 },
  pressed: { opacity: 0.7 },
});
