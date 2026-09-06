import { Redirect } from 'expo-router';

// 이전 Explore 주소로 들어와도 오류나 예제 화면 대신 홈으로 이동하도록 연결을 남깁니다.
export default function ExploreScreen() {
  return <Redirect href="/" />;
}
