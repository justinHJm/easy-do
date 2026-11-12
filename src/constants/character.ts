const base = require('@/assets/characters/normalized/easydo-base.png');
const jump = require('@/assets/characters/normalized/easydo-jump.png');
const heart = require('@/assets/characters/normalized/easydo-heart.png');

// Metro가 포함할 에셋을 미리 찾을 수 있도록 경로를 직접 적습니다.
export const characterImages = {
  welcome: require('@/assets/characters/normalized/easydo-wave.png'),
  idle: base,
  completed: require('@/assets/characters/normalized/easydo-happy.png'),
  cheer: require('@/assets/characters/normalized/easydo-cheer.png'),
  clap: require('@/assets/characters/normalized/easydo-clap.png'),
  celebrate: jump,
  thinking: require('@/assets/characters/reactions/easydo-thinking.png'),
  sleepy: require('@/assets/characters/normalized/easydo-sleep.png'),
  surprised: require('@/assets/characters/reactions/easydo-surprised.png'),
  comfort: heart,
};

export const characterAlternateFrames = {
  idle: require('@/assets/characters/reactions/easydo-blink.png'),
  welcome: require('@/assets/characters/reactions/easydo-wave-alternate.png'),
  cheer: require('@/assets/characters/reactions/easydo-cheer-alternate.png'),
};

export const bubbleImages = {
  basic: require('@/assets/bubbles/bubble-basic.png'),
};

export type CharacterMood = keyof typeof characterImages;
export type CharacterReaction = { mood: CharacterMood; message: string };

const welcomeMessages = ['오늘도 천천히 해봐요!', '하나만 해도 충분해요.', '오늘도 반가워요!', '좋은 시작이에요!'];
const completedMessages = ['좋아요! 하나 해냈어요!', '차근차근 잘하고 있어요!', '오늘도 한 걸음 전진!', '멋져요! 수고했어요!'];
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function randomReaction(kind: 'welcome' | 'completed', displayName?: string): CharacterReaction {
  if (kind === 'welcome') {
    const name = displayName?.trim();
    const messages = name ? [...welcomeMessages, `${name}님, 오늘도 반가워요!`] : welcomeMessages;
    return { mood: 'welcome', message: pick(messages) };
  }
  return { mood: pick(['completed', 'cheer', 'clap'] as const), message: pick(completedMessages) };
}

export function restingReaction(hour: number, hasTodos: boolean, pending: boolean, overdue: boolean): CharacterReaction {
  if (hour >= 22 || hour < 6) return { mood: 'sleepy', message: '늦은 시간이네요. 잠깐 쉬어도 좋아요.' };
  if (!hasTodos) return { mood: 'thinking', message: '오늘은 어떤 일을 해볼까요?' };
  if (overdue) return { mood: 'comfort', message: '괜찮아요. 하나씩 해도 충분해요.' };
  if (pending) return { mood: 'idle', message: '다음 할 일도 천천히 해봐요!' };
  return { mood: 'idle', message: '하나씩 해봐요!' };
}
