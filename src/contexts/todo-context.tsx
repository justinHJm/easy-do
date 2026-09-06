import { createContext, useContext, type PropsWithChildren } from 'react';

import { useTodos } from '@/hooks/use-todos';

// Context(하위 화면에 공통 값을 전달하는 통로)의 초기값 null로 Provider 누락을 구별합니다.
const TodoContext = createContext<ReturnType<typeof useTodos> | null>(null);

// Provider(공유 값을 공급하는 컴포넌트)를 탭 바깥에 두어 탭 이동 중에도 같은 Todo 상태를 유지합니다.
export function TodoProvider({ children }: PropsWithChildren) {
  const todos = useTodos();
  return <TodoContext.Provider value={todos}>{children}</TodoContext.Provider>;
}

// 화면마다 useTodos를 호출하면 별도 목록이 만들어집니다. 화면에서는 이 Hook으로 공통 목록을 가져옵니다.
export function useTodoContext() {
  const context = useContext(TodoContext);
  // Provider 밖에서 잘못 사용한 경우 원인을 바로 알 수 있도록 개발 오류를 명확히 알립니다.
  if (context === null) {
    throw new Error('useTodoContext must be used within TodoProvider.');
  }
  return context;
}
