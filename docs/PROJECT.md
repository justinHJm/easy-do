# easy-do 프로젝트 기준

## 제품과 기술

- easy-do는 Android 중심 Todo 앱이며 React Native, Expo SDK 57, TypeScript를 사용한다.
- 빠르게 기록하고 확인하는 가벼운 Todo 경험을 우선한다. UI는 Todo 중심, 한국어 우선, 라이트·다크 모드를 유지한다.
- 기존 저장 데이터와 사용자 동작을 깨지 않는 최소 변경을 우선한다.

## 데이터와 주요 구조

- Todo, 목록, History, 반복 완료 기록, 프로필, 설정은 AsyncStorage의 단일 데이터 구조로 보관한다.
- 날짜·반복·정렬 규칙은 `src/utils/`, 저장 호환은 `src/storage/`, 화면 공용 상태는 `src/contexts/`와 `src/hooks/`에 둔다.
- 반복 Todo는 발생일 단위로 처리한다. 종료일이 없던 기존 반복 데이터는 계속 동작해야 한다.

## Android와 Widget

- Android 홈 화면에는 오늘 Todo와 전체 Todo Widget이 있다.
- `react-native-android-widget` config plugin이 `app.json`에 선언되어 있으며, Widget은 앱과 같은 저장 데이터를 사용한다.
- 이 프로젝트는 CNG 방식이다. `android/`와 `ios/`는 생성물이며 Git에 포함하지 않는다. native 또는 config plugin 변경은 실제 Android 기기 검증이 필요하다.

## 버전과 검증

- 표시 버전은 `app.json`, `package.json`, `package-lock.json`에서 함께 관리한다. Android versionCode는 EAS remote 관리와 별개다.
- 변경 위험도와 실행할 검증은 `verify` Skill을 따른다. Android export나 자동 테스트는 실기기 Widget 동작을 대체하지 않는다.
