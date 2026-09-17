import { useWindowDimensions } from 'react-native';

export type LayoutSize = 'compact' | 'medium' | 'expanded';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const size: LayoutSize = width < 600 ? 'compact' : width < 840 ? 'medium' : 'expanded';
  const isCompactHeight = height < 480;
  // 높이가 낮은 가로·분할 화면에서는 두 영역이 서로 눌리지 않게 한 열로 유지합니다.
  const usesTwoPane = width >= 600 && height >= 480;

  // 기기 이름 대신 실제 화면 폭으로만 넓은 화면의 여백과 읽기 폭을 정합니다.
  return {
    size,
    isCompactHeight,
    usesTwoPane,
    contentMaxWidth: size === 'compact' ? undefined : size === 'medium' ? 720 : 960,
    horizontalPadding: size === 'compact' ? 16 : size === 'medium' ? 24 : 32,
    modalMaxWidth: size === 'compact' ? 360 : size === 'medium' ? 520 : 640,
  };
}
