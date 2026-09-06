import { useEffect, useReducer, useRef, useState } from 'react';
import { loadTodos, saveTodos } from '@/storage/todo-storage';

import type { Todo, TodoPriority } from '@/types/todo';

type TodoAction =
  | { type: 'add'; title: string; priority?: TodoPriority }
  | { type: 'toggle'; id: Todo['id'] }
  | { type: 'hydrate'; todos: readonly Todo[] };

const priorityOrder: Record<TodoPriority, number> = { high: 0, normal: 1, low: 2 };

// Reducer(상태 변경 규칙을 모은 함수)는 요청에 따라 새 배열을 반환합니다.
// 원본의 추가 순서는 유지하고, 화면에 보여 줄 미완료 목록만 별도로 정렬합니다.
export function todosReducer(todos: readonly Todo[], action: TodoAction): readonly Todo[] {
  switch (action.type) {
    case 'hydrate': {
      const maxId = action.todos.reduce((max, todo) => Math.max(max, todo.id), 0);
      // 저장소를 읽는 동안 사용자가 추가·완료한 항목도 보존합니다.
      // 새 항목의 번호를 저장된 최대 번호만큼 옮겨 기존 Todo와 번호가 겹치지 않게 합니다.
      return [...action.todos, ...todos.map((todo) => ({ ...todo, id: maxId + todo.id }))];
    }
    case 'add': {
      // 입력창 외의 곳에서 호출해도 공백뿐인 Todo가 생기지 않도록 여기서도 검사합니다.
      const title = action.title.trim();
      if (!title) return todos;

      // 저장된 항목까지 포함한 최대 번호 다음 값을 사용합니다. 우선순위 생략 시 보통으로 만듭니다.
      const id = todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
      return [...todos, { id, title, priority: action.priority ?? 'normal', completed: false }];
    }
    // 해당 항목만 복사해 완료 여부를 반전합니다. 원본을 직접 수정하지 않아 React가 변경을 인식합니다.
    case 'toggle':
      return todos.map((todo) =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
      );
  }
}

export function getTodoSummary(todos: readonly Todo[]) {
  // filter가 만든 새 배열을 정렬하므로 원본은 바뀌지 않습니다.
  // 우선순위가 같으면 증가하는 id로 비교해 먼저 추가한 항목이 앞에 오게 합니다.
  const incompleteTodos = todos
    .filter((todo) => !todo.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.id - b.id);
  const completedTodos = todos.filter((todo) => todo.completed);
  const totalCount = todos.length;
  const completedCount = completedTodos.length;

  return {
    incompleteTodos,
    completedTodos,
    totalCount,
    completedCount,
    // 완료 개수 / 전체 개수를 백분율로 바꿉니다. 빈 목록에서는 0으로 나누지 않습니다.
    // 계산값의 정밀도는 유지하고, 반올림은 화면에서 표시할 때만 합니다.
    completionRate: totalCount === 0 ? 0 : (completedCount / totalCount) * 100,
  };
}

// TodoProvider에서 상태를 한 번 만들고, 각 화면은 Context를 통해 같은 상태를 사용합니다.
export function useTodos() {
  // dispatch(변경 요청을 보내는 함수)가 Reducer를 거쳐 Todo 상태를 갱신합니다.
  const [todos, dispatch] = useReducer(todosReducer, []);
  // useState는 값이 바뀌면 화면을 다시 그립니다. loaded는 초기 읽기 완료 여부입니다.
  const [loaded, setLoaded] = useState(false);
  // useRef는 화면을 다시 그리지 않고 값을 기억합니다. 사용자 변경이 있었는지를 기록합니다.
  const hasChanges = useRef(false);

  // useEffect는 화면이 연결된 뒤 저장소 읽기를 시작합니다. 빈 의존성 배열([])은 연결 시 실행한다는 뜻입니다.
  // 비동기 처리(결과를 기다리는 동안 다른 작업을 허용하는 방식) 중 화면이 사라지면 결과를 적용하지 않습니다.
  useEffect(() => {
    let active = true;
    void loadTodos().then((storedTodos) => {
      if (!active) return;
      dispatch({ type: 'hydrate', todos: storedTodos });
      setLoaded(true);
    });
    // 정리 함수는 연결 해제 시 실행되며, 개발 모드의 재실행에서도 이전 읽기 결과를 무시하게 합니다.
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // 초기 빈 목록이나 읽기 실패 결과만으로 기존 저장 내용을 덮어쓰지 않습니다.
    // 읽기가 끝났고 사용자 변경이 있을 때만 저장합니다. 이후 todos가 바뀔 때마다 다시 실행됩니다.
    // void는 완료를 여기서 기다리지 않는다는 표시이며, 저장 오류는 저장 함수 내부에서 처리합니다.
    if (loaded && hasChanges.current) void saveTodos(todos);
  }, [todos, loaded]);

  function addTodo(title: string, priority: TodoPriority = 'normal') {
    if (!title.trim()) return;
    hasChanges.current = true;
    dispatch({ type: 'add', title, priority });
  }

  function toggleTodo(id: Todo['id']) {
    hasChanges.current = true;
    dispatch({ type: 'toggle', id });
  }

  return { todos, addTodo, toggleTodo, ...getTodoSummary(todos) };
}
