import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { randomReaction, type CharacterReaction } from '@/constants/character';

export type CharacterMotion = 'idle' | 'welcome' | 'completed' | 'celebrate' | 'touch';

const durations = { welcome: 1750, completed: 1750, celebrate: 1750, touch: 600 };
type Event = Exclude<CharacterMotion, 'idle'>;
type TimedReaction = CharacterReaction & { motion: Event; sequence: number };

export function useHomeCharacter(welcomeEnabled: boolean, reactionsEnabled: boolean, displayName?: string) {
  const [reaction, setReaction] = useState<TimedReaction | null>(null);
  const [active, setActive] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());
  const enabled = useRef(false);
  const sequence = useRef(0);
  const currentMotion = useRef<Event | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReaction = useCallback(() => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = null;
    currentMotion.current = null;
    setReaction(null);
  }, []);

  const play = useCallback((motion: Event, next: CharacterReaction) => {
    if (!enabled.current || (motion === 'welcome' ? !welcomeEnabled : !reactionsEnabled)) return;
    if (currentMotion.current === 'celebrate' && motion === 'celebrate') return;
    clearReaction();
    currentMotion.current = motion;
    setReaction({ ...next, motion, sequence: ++sequence.current });
    reactionTimer.current = setTimeout(clearReaction, durations[motion]);
  }, [clearReaction, reactionsEnabled, welcomeEnabled]);

  useFocusEffect(useCallback(() => {
    let clock: ReturnType<typeof setTimeout> | undefined;
    function updateClock() {
      const now = new Date();
      const hour = now.getHours();
      setHour(hour);
      if (hour >= 22) now.setDate(now.getDate() + 1);
      now.setHours(hour < 6 || hour >= 22 ? 6 : 22, 0, 0, 0);
      clock = setTimeout(updateClock, Math.max(1000, now.getTime() - Date.now()));
    }

    function syncActivity(isActive: boolean) {
      if (clock !== undefined) clearTimeout(clock);
      enabled.current = isActive;
      setActive(isActive);
      clearReaction();
      if (isActive) {
        updateClock();
        play('welcome', randomReaction('welcome', displayName));
      }
    }

    syncActivity(AppState.currentState === null || AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      const isActive = state === 'active';
      if (enabled.current !== isActive) syncActivity(isActive);
    });
    return () => {
      subscription.remove();
      syncActivity(false);
    };
  }, [clearReaction, displayName, play]));

  return { reaction, active, hour, play };
}
