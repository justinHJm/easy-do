# easy-do

easy-do는 우선순위, 기한, 반복 Todo와 Android 홈 화면 위젯을 지원하는 가벼운 Todo 앱입니다.

## 주요 기능

- Todo 추가·수정·완료·삭제와 완료 기록 확인
- 우선순위, 기한, 반복 일정, 사용자 목록, 보기 필터
- Android 홈 화면의 오늘 Todo·전체 Todo 위젯
- 한국어 우선 UI와 라이트·다크 모드

## 시작하기

```sh
npm ci
npx expo start
```

TypeScript와 저장 로직을 확인할 때는 다음 명령을 사용합니다.

```sh
npx tsc --noEmit
node scripts/test-todo-storage.cjs
```

Expo Go는 JavaScript·TypeScript 화면 확인용입니다. Android Widget과 설치·업데이트 동작은 실제 Android 빌드 및 기기에서 확인해야 합니다.

## 프로젝트 구조

| 위치 | 역할 |
| --- | --- |
| `src/app/` | 앱 화면과 레이아웃 |
| `src/components/` | Todo 입력·목록·편집·화면 구성 요소 |
| `src/utils/` | Todo 상태, 날짜, 반복, 통계 규칙 |
| `src/storage/` | AsyncStorage 저장과 이전 데이터 호환 |
| `src/widgets/` | Android Todo Widget 렌더링·동기화 |
| `assets/` | 캐릭터, 위젯 미리보기, 앱 이미지 |
| `docs/PROJECT.md` | 프로젝트 기술·데이터·Widget 기준 |

## 데이터 원칙

할 일과 관련 설정은 기기에 로컬 저장됩니다. 반복 Todo는 발생일별 완료 기록을 유지하며, 기존 저장 데이터의 호환성을 보존합니다.
