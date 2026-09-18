import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { loadData, saveData, resetStoredData } from '@/storage/todo-storage';
import { emptyData, initializeLocalData, getTodoSummary, rollover, updateData, visibleTodos, type DataAction } from '@/utils/todo-state';
import { dateKey } from '@/utils/due-date';
import type { HydrationState, TodoData, TodoEdits, TodoPriority, TodoView } from '@/types/todo';

// 표시 시간을 늘리는 지연이 아니라 응답하지 않는 저장소에서 빠져나오기 위한 최대 대기 시간입니다.
export const HYDRATION_TIMEOUT_MS = 15000;

function refreshTodoWidget() {
  // 앱 실행 환경에서만 위젯 모듈을 불러와 기존 저장소 단위 검사를 유지합니다.
  void import('@/widgets/request-todo-widget-update')
    .then(({ requestTodoWidgetUpdate }) => requestTodoWidgetUpdate())
    .catch((error: unknown) => {
      if (Platform?.OS === 'android') console.warn('Todo widget update failed', error);
    });
}

export function useTodos() {
  const [data, setData] = useState<TodoData>(emptyData);
  const [today, setToday] = useState(() => dateKey(new Date()));
  // hydration(저장 데이터를 메모리 상태로 복원)은 성공·실패를 구분해 무한 로딩을 막습니다.
  const [hydrationState, setHydrationState] = useState<HydrationState>('loading');
  const loaded = hydrationState === 'ready';
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  // 비동기 읽기 직전에 들어온 입력도 사라지지 않게 작업 자체를 대기시켰다가 복원 결과에 적용합니다.
  const ready = useRef(false);
  const queued = useRef<{ action: DataAction; now: string }[]>([]);
  const current = useRef(data);
  const writeVersion = useRef(0);
  const mounted = useRef(false);
  const resetting = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const persist = useCallback((next: TodoData, refreshWidget = false) => {
    const version = ++writeVersion.current;
    void saveData(next).then(() => {
      if (mounted.current && version === writeVersion.current) setStorageError(null);
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.info('Todo persisted', { todoCount: next.todos.length });
      if (refreshWidget) refreshTodoWidget();
    }).catch(() => {
      if (mounted.current && version === writeVersion.current) setStorageError('저장하지 못했어요. 다시 시도해 주세요.');
    });
  }, []);

  useEffect(() => {
    let active = true;
    ready.current = false;
    setHydrationState('loading');
    setStorageError(null);
    function fail(message: string) {
      if (!active) return;
      active = false;
      clearTimeout(timeout);
      ready.current = false;
      setHydrationState('error');
      setStorageError(message);
    }
    const timeout = setTimeout(() => fail('불러오기가 지연되고 있어요. 저장된 데이터는 그대로 남아 있어요.'), HYDRATION_TIMEOUT_MS);
    void loadData(new Date().toISOString()).then((stored) => {
      if (!active) return;
      let next = initializeLocalData(stored, new Date().toISOString());
      for (const { action, now } of queued.current) next = updateData(next, action, now);
      queued.current = [];
      next = rollover(next, dateKey(new Date()));
      // 시간 초과 후 도착한 옛 요청은 위 active 검사에서 제외됩니다. 재시도 결과를 덮어쓰지 않습니다.
      clearTimeout(timeout);
      active = false;
      current.current = next;
      ready.current = true;
      setData(next);
      setToday(dateKey(new Date()));
      setHydrationState('ready');
      setStorageError(null);
      // 읽기가 성공한 뒤에만 새 구조를 저장합니다. 초기 빈 배열이나 읽기 오류로 원본을 덮어쓰지 않습니다.
      persist(next);
    }).catch(() => {
      fail('데이터를 불러오지 못했어요. 원본을 보존하고 있어요. 다시 시도해 주세요.');
    });
    return () => { active = false; clearTimeout(timeout); };
  }, [reload, persist]);

  const send = useCallback((action: DataAction) => {
    if (resetting.current) return;
    const now = new Date().toISOString();
    // 자정 직후 타이머보다 먼저 입력하더라도 현재 날짜에 맞는 목록을 보여줍니다.
    setToday(dateKey(new Date(now)));
    if (!ready.current) {
      if (action.type !== 'day') queued.current.push({ action, now });
      return;
    }
    // 연속 탭 입력도 최신 원본을 기준으로 처리하며, UI 갱신을 기다리지 않고 저장 요청을 보냅니다.
    const next = updateData(current.current, action, now);
    if (next !== current.current) {
      current.current = next;
      setData(next);
      persist(next, true);
    }
  }, [persist]);

  useEffect(() => {
    const refresh = () => { setToday(dateKey(new Date())); send({ type: 'day' }); };
    // 자정에는 가벼운 타이머, 백그라운드에서 돌아올 때는 AppState로 날짜를 다시 확인합니다.
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [send]);

  useEffect(() => {
    // 저장소 복원이 끝난 뒤에만 첫 안내를 열어 빈 기본 상태가 잠깐 보이는 일을 막습니다.
    if (hydrationState === 'ready' && data.settings.tutorialCompleted !== true) setTutorialVisible(true);
  }, [data.settings.tutorialCompleted, hydrationState]);

  function retryStorage() {
    if (resetting.current) return;
    if (ready.current) persist(current.current);
    else {
      setHydrationState('loading');
      setStorageError(null);
      setReload((value) => value + 1);
    }
  }

  async function resetAllData(): Promise<boolean> {
    if (!ready.current || resetting.current) return false;
    resetting.current = true;
    // 삭제 확인 UI에서만 호출합니다. 디스크 처리에 성공한 뒤 화면 원본을 교체해 실패를 성공으로 보이지 않게 합니다.
    ++writeVersion.current;
    const initial = initializeLocalData(emptyData(), new Date().toISOString());
    try {
      await resetStoredData(initial);
      current.current = initial;
      queued.current = [];
      if (mounted.current) { setData(initial); setToday(dateKey(new Date())); setStorageError(null); }
      refreshTodoWidget();
      return true;
    } catch {
      if (mounted.current) setStorageError('데이터를 삭제하지 못했어요. 다시 시도해 주세요.');
      return false;
    } finally { resetting.current = false; }
  }

  return {
    ...data, today, loaded, hydrationState, storageError, retryStorage, tutorialVisible,
    resetAllData,
    updateProfile: (displayName: string, avatar: string) => send({ type: 'profile', displayName, avatar }),
    updateSettings: (changes: { characterReactions?: boolean; welcomeMessages?: boolean; tutorialCompleted?: boolean }) => send({ type: 'settings', changes }),
    openTutorial: () => setTutorialVisible(true),
    completeTutorial: () => { setTutorialVisible(false); send({ type: 'settings', changes: { tutorialCompleted: true } }); },
    addTodo: (title: string, priority: TodoPriority = 'none', listId?: number) => send({ type: 'add', title, priority, listId }),
    editTodo: (id: number, changes: TodoEdits) => send({ type: 'edit', id, changes }),
    deleteTodo: (id: number) => send({ type: 'delete', id }),
    toggleTodo: (id: number, occurrenceDate?: string) => send({ type: 'toggle', id, occurrenceDate }),
    addList: (name: string) => send({ type: 'list-add', name }),
    renameList: (id: number, name: string) => send({ type: 'list-rename', id, name }),
    deleteList: (id: number) => send({ type: 'list-delete', id }),
    getView: (view: TodoView) => getTodoSummary(visibleTodos(data, view, today)),
  };
}
