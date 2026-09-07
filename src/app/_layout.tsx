import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { TodoProvider, useTodoContext } from '@/contexts/todo-context';
import { AppStartup } from '@/components/app-startup';

// React가 첫 화면을 배치하기 전 네이티브 시작 화면이 먼저 사라져 빈 화면이 보이지 않도록 합니다.
void SplashScreen.preventAutoHideAsync().catch((error: unknown) => console.warn('시작 화면 유지 실패:', error));

function revealApp() {
  // 데이터 복원 완료까지 네이티브 화면을 붙잡으면 재시도 버튼도 가려집니다.
  // 대신 첫 React 화면이 배치되면 숨겨, 전용 로딩/오류 UI가 초기화를 안내하게 합니다.
  void SplashScreen.hideAsync().catch((error: unknown) => console.warn('시작 화면 전환 실패:', error));
}

function AppContent() {
  const { hydrationState, storageError, retryStorage } = useTodoContext();
  // 홈과 탭은 모든 데이터가 복원된 뒤에만 생성합니다. 아직 빈 원본 상태를 화면에 노출하지 않습니다.
  if (hydrationState !== 'ready') {
    return <AppStartup error={hydrationState === 'error' ? storageError ?? '데이터를 불러오지 못했어요.' : null} onRetry={retryStorage} />;
  }
  return <AppTabs />;
}

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
    <View style={styles.screen} onLayout={revealApp}>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <TodoProvider>
          <AppContent />
        </TodoProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFFFFF' } });
