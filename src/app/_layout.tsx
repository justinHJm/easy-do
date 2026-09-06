import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { TodoProvider } from '@/contexts/todo-context';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.backgroundElement,
  },
};

export default function TabLayout() {
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="dark" />
      <TodoProvider>
        <AppTabs />
      </TodoProvider>
    </ThemeProvider>
  );
}
