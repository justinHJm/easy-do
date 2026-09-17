import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { CharacterGreeting } from '@/components/character-greeting';
import { CHARACTER_REACTION_MS, characterMessages, randomReaction } from '@/constants/character';

import { TodoInput } from '@/components/todo-input';
import { TodoItem } from '@/components/todo-item';
import { Colors } from '@/constants/theme';
import { useTodoContext } from '@/contexts/todo-context';
import { TodoEditor } from '@/components/todo-editor';
import type { TodoView } from '@/types/todo';
import { AppState } from 'react-native';
import { ListManager, TodoViews, viewLabels } from '@/components/todo-views';
import { localDate } from '@/utils/due-date';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

const colors = Colors.light;

export default function HomeScreen() {
  const layout = useResponsiveLayout();
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
  const [reaction, setReaction] = useState<ReturnType<typeof randomReaction> | null>(() => welcomeEnabled ? randomReaction('welcome', displayName) : null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화면이 사라지면 예약된 반응도 취소해, 더 이상 표시되지 않는 화면의 상태를 바꾸지 않습니다.
  useEffect(() => {
    // 다른 탭에서 설정을 바꾸면 예약된 칭찬도 취소합니다. OFF인 환영 문구가 다시 나타나지 않게 합니다.
    if (reactionTimer.current !== null) clearTimeout(reactionTimer.current);
    setReaction(welcomeEnabled ? randomReaction('welcome', displayName) : null);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (reactionTimer.current !== null) clearTimeout(reactionTimer.current);
      setReaction(welcomeEnabled ? randomReaction('welcome', displayName) : null);
    });
    return () => { subscription.remove(); if (reactionTimer.current !== null) clearTimeout(reactionTimer.current); };
  }, [welcomeEnabled, reactionsEnabled, displayName, profile.localProfileId]);

  function handleToggleTodo(id: number, occurrenceDate?: string) {
    // 사용자의 완료 동작만 확인하므로 저장 데이터를 불러오거나 완료를 취소할 때는 칭찬하지 않습니다.
    const isCompleting = incompleteTodos.some((todo) => todo.id === id);
    toggleTodo(id, occurrenceDate);
    if (!isCompleting || !reactionsEnabled) return;

    // 연속으로 완료하면 이전 타이머를 취소하고 마지막 완료부터 1.5초 동안 반응을 유지합니다.
    if (reactionTimer.current !== null) clearTimeout(reactionTimer.current);
    setReaction(randomReaction('completed'));
    reactionTimer.current = setTimeout(() => {
      setReaction(welcomeEnabled ? { mood: 'idle', message: characterMessages.idle } : null);
      reactionTimer.current = null;
    }, CHARACTER_REACTION_MS);
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
        <View style={[styles.content, { maxWidth: layout.contentMaxWidth }]}>
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
        {!layout.isCompactHeight && reaction && <CharacterGreeting {...reaction} />}
        {storageError && <Pressable accessibilityRole="button" onPress={retryStorage} style={styles.storageNotice}>
          <Text style={styles.error}>{storageError} · 다시 시도</Text>
        </Pressable>}
        <View style={[styles.homeBody, layout.usesTwoPane && styles.wideBody]}>
        <TodoViews vertical={layout.usesTwoPane} view={activeView} lists={lists} onChange={setView} onManage={() => { if (loaded) setManagingLists(true); }} />
        <View style={styles.todoPane}>
        <TodoInput onAdd={addTodo} lists={lists} defaultListId={selectedList?.id} disabled={!loaded} />
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
        </View>
        </View>
        {editingTodo && <TodoEditor key={editingTodo.id} todo={editingTodo} lists={lists}
          onSave={editTodo} onDelete={deleteTodo} onClose={() => setEditingId(undefined)} />}
        {managingLists && <ListManager lists={lists} onAdd={addList} onRename={renameList} onDelete={deleteList} onClose={() => setManagingLists(false)} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: '100%', alignSelf: 'center' },
  homeBody: { flex: 1 },
  wideBody: { flexDirection: 'row', gap: 12 },
  todoPane: { flex: 1, minWidth: 0 },
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
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  pendingTitle: { paddingVertical: 10, fontSize: 14, fontWeight: '600', color: colors.text },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  empty: { fontSize: 14, color: colors.textSecondary, paddingVertical: 16 },
  pressed: { opacity: 0.7 },
});
