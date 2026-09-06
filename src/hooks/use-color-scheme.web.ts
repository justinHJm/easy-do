import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * 정적 렌더링(미리 만든 웹 화면)과 브라우저의 첫 표시가 달라지지 않도록 처음에는 밝은 모드를 사용합니다.
 * 브라우저에 연결된 뒤 useEffect에서 준비 상태를 바꾸면 실제 기기 색상 모드를 반영합니다.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
