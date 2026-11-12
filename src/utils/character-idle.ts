export type CharacterIdleAction = 'blink' | 'lookAround';

// One pending timer per visible character. The caller cancels it when a reaction takes over.
export function scheduleCharacterIdle(play: (action: CharacterIdleAction) => void) {
  let timer: ReturnType<typeof setTimeout>;
  let lookAvailableAt = Date.now() + 10000;

  function schedule() {
    timer = setTimeout(() => {
      const now = Date.now();
      const look = now >= lookAvailableAt && Math.random() < 0.3;
      if (look) lookAvailableAt = now + 14000;
      play(look ? 'lookAround' : 'blink');
      schedule();
    }, 2900 + Math.random() * 3300);
  }

  schedule();
  return () => clearTimeout(timer);
}
