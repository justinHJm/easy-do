import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.light;

export default function AppTabs() {
  return (
    <Tabs style={styles.container}>
      <TabSlot style={styles.content} />
      <TabList style={styles.tabList}>
        <TabTrigger name="home" href="/" asChild>
          <TabButton>홈</TabButton>
        </TabTrigger>
        <TabTrigger name="stats" href="/stats" asChild>
          <TabButton>통계</TabButton>
        </TabTrigger>
        <TabTrigger name="my" href="/my" asChild>
          <TabButton>마이</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tab,
        isFocused && styles.selected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, isFocused && styles.selectedLabel]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  tabList: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundElement,
    padding: 8,
    gap: 8,
  },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  selected: { backgroundColor: colors.backgroundSelected },
  pressed: { opacity: 0.7 },
  label: { fontSize: 14, color: colors.textSecondary },
  selectedLabel: { color: colors.primary, fontWeight: '600' },
});
