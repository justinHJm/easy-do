import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.brand}>easy-do</Text>
        <Text style={styles.title}>오늘 할 일</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, gap: Spacing.one },
  brand: { fontSize: 14, fontWeight: '600', color: Colors.light.primary },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
});
