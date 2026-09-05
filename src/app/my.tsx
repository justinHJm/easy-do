import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

export default function MyScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>마이</Text>
      <Text style={styles.message}>준비 중</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background, padding: Spacing.four },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
  message: { marginTop: Spacing.three, fontSize: 16, color: Colors.light.textSecondary },
});
