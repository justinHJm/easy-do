import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { bubbleImages, characterImages, type CharacterMood } from '@/constants/character';
import { Colors } from '@/constants/theme';

export function CharacterGreeting({ mood, message }: { mood: CharacterMood; message: string }) {
  return (
    <View style={styles.row}>
      <Image source={characterImages[mood]} style={styles.character} resizeMode="contain" accessible={false} />
      <ImageBackground source={bubbleImages.basic} style={styles.bubble} resizeMode="stretch">
        <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  character: { width: 72, height: 72 },
  // 에셋의 투명 여백과 왼쪽 아래 꼬리를 피해 텍스트를 말풍선 몸통 안에 배치합니다.
  bubble: { flex: 1, maxWidth: 260, minHeight: 88, justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 14, paddingBottom: 26 },
  message: { color: Colors.light.text, fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '500' },
});
