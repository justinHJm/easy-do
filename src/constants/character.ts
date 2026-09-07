// 그림과 문구를 분리해 이미지 교체나 문구 수정이 서로 영향을 주지 않게 합니다.
// 경로를 직접 적은 require를 사용해야 Expo가 포함할 에셋을 미리 찾을 수 있습니다.
export const characterImages = {
  welcome: require('@/assets/characters/easydo-wave.png'),
  idle: require('@/assets/characters/easydo-base.png'),
  completed: require('@/assets/characters/easydo-happy.png'),
  cheer: require('@/assets/characters/easydo-cheer.png'),
  clap: require('@/assets/characters/easydo-clap.png'),
};

export const bubbleImages = {
  basic: require('@/assets/bubbles/bubble-basic.png'),
};

export const characterMessages = {
  welcome: ['오늘도 천천히 해봐요!', '하나만 해도 충분해요.', '오늘도 반가워요!', '좋은 시작이에요!'],
  idle: '하나씩 해봐요!',
  completed: ['좋아요! 하나 해냈어요!', '차근차근 잘하고 있어요!', '오늘도 한 걸음 전진!', '멋져요! 수고했어요!'],
};

export type CharacterMood = keyof typeof characterImages;
export const CHARACTER_REACTION_MS = 1500;

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
// 렌더링 때마다 뽑으면 입력 중에도 대사가 바뀝니다. 접속·완료 이벤트에서만 새 반응을 선택합니다.
export function randomReaction(kind: 'welcome' | 'completed', displayName?: string): { mood: CharacterMood; message: string } {
  // 일부 인사만 개인화해 모든 문구가 이름으로 시작하지 않게 합니다.
  const messages = kind === 'welcome' && displayName?.trim()
    ? [...characterMessages.welcome, `${displayName.trim()}님, 오늘도 반가워요!`] : characterMessages[kind];
  return { mood: kind === 'welcome' ? pick(['welcome', 'idle'] as const) : pick(['completed', 'cheer', 'clap'] as const),
    message: pick(messages) };
}
