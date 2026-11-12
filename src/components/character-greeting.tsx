import { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { bubbleImages, characterAlternateFrames, characterImages, type CharacterReaction } from '@/constants/character';
import { Colors } from '@/constants/theme';
import type { CharacterMotion } from '@/hooks/use-home-character';

type Props = CharacterReaction & {
  active?: boolean;
  motion?: CharacterMotion;
  sequence?: number;
  onPress?: () => void;
  idleMessageTimeout?: number;
};

export function CharacterGreeting({ mood, message, active = false, motion = 'idle', sequence, onPress, idleMessageTimeout }: Props) {
  const [messageHidden, setMessageHidden] = useState(false);
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const offset = useSharedValue(0);
  const frame = useSharedValue(0);
  const alternate = mood === 'idle' || mood === 'welcome' || mood === 'cheer' ? characterAlternateFrames[mood] : undefined;
  const primaryFrame = useAnimatedStyle(() => ({ opacity: 1 - frame.value }), [frame]);
  const alternateFrame = useAnimatedStyle(() => ({ opacity: frame.value }), [frame]);
  const horizontal = motion === 'welcome' || motion === 'touch';
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: horizontal ? offset.value : 0 }, { translateY: horizontal ? 0 : offset.value }],
  }), [horizontal, offset]);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    let updated = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      updated = true;
      setReducedMotion(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !updated) setReducedMotion(enabled);
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [active]);

  useEffect(() => {
    cancelAnimation(offset);
    offset.value = 0;
    if (!active || reducedMotion) return;
    switch (motion) {
      case 'idle':
        offset.value = withRepeat(withDelay(8000, withSequence(
          withTiming(-2, { duration: 300 }), withTiming(0, { duration: 350 }),
        )), -1);
        break;
      case 'welcome':
        offset.value = withSequence(withTiming(-3, { duration: 160 }), withTiming(3, { duration: 260 }), withTiming(0, { duration: 240 }));
        break;
      case 'completed':
        offset.value = withSequence(withTiming(-5, { duration: 260 }), withTiming(0, { duration: 320 }));
        break;
      case 'celebrate':
        offset.value = withSequence(withTiming(-9, { duration: 250 }), withTiming(0, { duration: 300 }),
          withTiming(-5, { duration: 200 }), withTiming(0, { duration: 260 }));
        break;
      case 'touch':
        offset.value = withSequence(withTiming(3, { duration: 130 }), withTiming(-2, { duration: 150 }), withTiming(0, { duration: 220 }));
        break;
    }
    return () => cancelAnimation(offset);
  }, [active, motion, offset, reducedMotion, sequence]);

  useEffect(() => {
    cancelAnimation(frame);
    frame.value = 0;
    if (!active || reducedMotion || !alternate) return;

    // 두 PNG를 같은 영역에 유지하고 불투명도만 전환해, 파일 로딩이나 배치 변화 없이 프레임을 교체합니다.
    const showAfter = (delay: number) => withDelay(delay, withTiming(1, { duration: 0 }));
    const hideAfter = (delay: number) => withDelay(delay, withTiming(0, { duration: 0 }));
    if (mood === 'idle' && motion === 'idle') {
      frame.value = withRepeat(withSequence(showAfter(5700), hideAfter(115)), -1);
    } else if (mood === 'welcome' && motion === 'welcome') {
      frame.value = withSequence(showAfter(125), hideAfter(115), showAfter(120), hideAfter(115));
    } else if (mood === 'cheer' && motion === 'completed') {
      frame.value = withSequence(showAfter(140), hideAfter(150));
    } else if (mood === 'cheer' && motion === 'idle') {
      frame.value = withRepeat(withSequence(showAfter(7800), hideAfter(150)), -1);
    }
    return () => cancelAnimation(frame);
  }, [active, alternate, frame, mood, motion, reducedMotion, sequence]);

  useEffect(() => {
    setMessageHidden(false);
    if (motion !== 'idle' || idleMessageTimeout === undefined) return;
    const timer = setTimeout(() => setMessageHidden(true), idleMessageTimeout);
    return () => clearTimeout(timer);
  }, [idleMessageTimeout, message, mood, motion, sequence]);

  const character = <Animated.View style={[styles.character, animatedStyle]}>
    {alternate ? <>
      <Animated.Image source={characterImages[mood]} style={[styles.frame, primaryFrame]} resizeMode="contain" accessible={false} />
      <Animated.Image source={alternate} style={[styles.frame, alternateFrame]} resizeMode="contain" accessible={false} />
    </> : <Image source={characterImages[mood]} style={styles.character} resizeMode="contain" accessible={false} />}
  </Animated.View>;

  return (
    <View style={styles.row}>
      {onPress ? <Pressable accessibilityRole="button" accessibilityLabel="캐릭터에게 인사하기"
        style={styles.character} onPress={onPress}>{character}</Pressable> : character}
      {messageHidden ? <View style={styles.bubble} /> : <ImageBackground source={bubbleImages.basic} style={styles.bubble} resizeMode="stretch">
        <Text style={styles.message} numberOfLines={2} accessibilityLabel={message}
          accessibilityLiveRegion="polite">{message}</Text>
      </ImageBackground>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 88, paddingHorizontal: 16 },
  character: { width: 72, height: 72 },
  frame: { ...StyleSheet.absoluteFill, width: 72, height: 72 },
  // 에셋의 투명 여백과 왼쪽 아래 꼬리를 피해 텍스트를 말풍선 몸통 안에 배치합니다.
  bubble: { flex: 1, maxWidth: 260, height: 88, justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 10, paddingBottom: 18 },
  message: { color: Colors.light.text, fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '500' },
});
