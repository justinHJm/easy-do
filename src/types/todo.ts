// 유니언 타입(허용할 값을 나열한 타입)으로 정해진 세 우선순위만 사용하게 합니다.
export type TodoPriority = 'high' | 'normal' | 'low';

// readonly는 필드를 직접 대입하는 실수를 타입 검사에서 막습니다. 변경할 때는 새 객체를 만듭니다.
export type Todo = {
  readonly id: number;
  readonly title: string;
  readonly priority: TodoPriority;
  readonly completed: boolean;
};
