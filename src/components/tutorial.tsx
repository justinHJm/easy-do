import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { characterImages } from '@/constants/character';
import { Colors } from '@/constants/theme';

type TutorialProps = { onComplete: () => void };

const steps = [
  { title: 'easy-do에 오신 것을 환영해요', description: '작은 할 일을 차분히 정리하고, 오늘의 흐름을 한눈에 살펴보세요.', image: 'welcome' },
  { title: '할 일을 추가해 보세요', description: '홈 화면의 입력칸에 할 일을 적고 추가하면 목록에 바로 나타나요.', image: 'idle' },
  { title: '우선순위와 기한을 정해요', description: '중요한 일은 우선순위를 높이고, 필요한 경우 기한을 지정해 놓치지 마세요.', image: 'cheer' },
  { title: '통계와 위젯을 확인해요', description: '통계 탭에서 진행 상황을 보고, 홈 화면 위젯으로 오늘 할 일을 빠르게 확인할 수 있어요.', image: 'completed' },
  { title: '마이에서 내 설정을 관리해요', description: '프로필, 목록, 완료 기록과 앱 설정을 마이 탭에서 관리할 수 있어요.', image: 'idle' },
  { title: '준비가 되었어요', description: '이제 나만의 Todo를 시작해 보세요. 튜토리얼은 마이 > 도움말에서 언제든 다시 볼 수 있어요.', image: 'welcome' },
] as const;

export function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <SafeAreaView style={styles.overlay} accessibilityViewIsModal>
        <View style={styles.card} accessibilityLabel={`튜토리얼 ${step + 1} / ${steps.length}`}>
          <Text style={styles.progress}>{step + 1} / {steps.length}</Text>
          <Image source={characterImages[current.image]} style={styles.character} resizeMode="contain" accessible={false} />
          <Text accessibilityRole="header" style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
          <View style={styles.dots} accessibilityLabel={`${steps.length}단계 중 ${step + 1}단계`}>
            {steps.map((item, index) => <View key={item.title} style={[styles.dot, index === step && styles.activeDot]} />)}
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" style={styles.skipButton} onPress={onComplete}><Text style={styles.skipText}>건너뛰기</Text></Pressable>
            <Pressable accessibilityRole="button" style={styles.nextButton} onPress={isLast ? onComplete : () => setStep((value) => value + 1)}>
              <Text style={styles.nextText}>{isLast ? '시작하기' : '다음'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(37, 53, 45, 0.52)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: Colors.light.background, borderRadius: 24, padding: 24, alignItems: 'center', gap: 16 },
  progress: { alignSelf: 'flex-end', color: Colors.light.textSecondary, fontSize: 13, fontWeight: '600' },
  character: { width: 136, height: 136 },
  title: { color: Colors.light.text, fontSize: 23, lineHeight: 31, fontWeight: '700', textAlign: 'center' },
  description: { color: Colors.light.textSecondary, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 7, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C9D7CD' },
  activeDot: { width: 22, backgroundColor: Colors.light.primary },
  actions: { flexDirection: 'row', width: '100%', gap: 12, marginTop: 4 },
  skipButton: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement },
  skipText: { color: Colors.light.text, fontWeight: '600' },
  nextButton: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary },
  nextText: { color: '#FFFFFF', fontWeight: '700' },
});
