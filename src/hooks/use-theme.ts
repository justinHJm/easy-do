import { Colors } from '@/constants/theme';

// 기기의 다크 모드 설정과 관계없이 v0.1 화면을 흰색 기반으로 유지하기 위해 밝은 색상만 반환합니다.
export function useTheme() {
  return Colors.light;
}
