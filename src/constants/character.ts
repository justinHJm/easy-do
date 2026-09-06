// 그림과 문구를 분리해 이미지 교체나 문구 수정이 서로 영향을 주지 않게 합니다.
// 경로를 직접 적은 require를 사용해야 Expo가 포함할 에셋을 미리 찾을 수 있습니다.
export const characterImages = {
  welcome: require('@/assets/characters/easydo-wave.png'),
  idle: require('@/assets/characters/easydo-base.png'),
  completed: require('@/assets/characters/easydo-happy.png'),
};

export const bubbleImages = {
  basic: require('@/assets/bubbles/bubble-basic.png'),
};

export const characterMessages = {
  welcome: '오늘도 반가워요!',
  idle: '하나씩 해봐요!',
  completed: '좋아요! 하나 해냈어요!',
};

export type CharacterMood = keyof typeof characterImages;
export const CHARACTER_REACTION_MS = 1500;
