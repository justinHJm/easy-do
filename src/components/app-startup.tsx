import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { characterImages } from '@/constants/character';
import { Colors } from '@/constants/theme';

export function AppStartup({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo} accessible accessibilityLabel="easy-do">
          <View style={styles.sprout} importantForAccessibility="no-hide-descendants">
            <View style={styles.stem} /><View style={styles.leftLeaf} /><View style={styles.rightLeaf} />
          </View>
          <Text style={styles.brand}>easy-do</Text>
        </View>
        <Image source={characterImages.idle} resizeMode="contain" style={styles.character} accessible={false} />
        <Text style={styles.greeting}>오늘도 가볍게 시작해요</Text>
        {error ? (
          <View style={styles.status}>
            <Text style={styles.detail} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={Colors.light.primary} accessibilityLabel="저장 데이터 불러오는 중" />
            <Text style={styles.detail}>저장된 내용을 불러오고 있어요</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7, color: Colors.light.primary },
  sprout: { width: 27, height: 27 },
  stem: { position: 'absolute', width: 3, height: 17, backgroundColor: Colors.light.primary, left: 13, top: 10, borderRadius: 2 },
  leftLeaf: { position: 'absolute', width: 14, height: 9, left: 0, top: 6, backgroundColor: '#79AA7A', borderTopRightRadius: 10, borderBottomLeftRadius: 10, transform: [{ rotate: '25deg' }] },
  rightLeaf: { position: 'absolute', width: 15, height: 10, left: 12, top: 2, backgroundColor: Colors.light.primary, borderTopLeftRadius: 10, borderBottomRightRadius: 10, transform: [{ rotate: '-25deg' }] },
  character: { width: 128, height: 128 },
  greeting: { color: Colors.light.text, fontSize: 17, textAlign: 'center', fontWeight: '500' },
  status: { gap: 12, alignItems: 'center', maxWidth: 320 },
  detail: { color: Colors.light.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retry: { backgroundColor: Colors.light.primary, minHeight: 48, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
