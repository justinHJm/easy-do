# easy-do 프로젝트 규칙

## 기술 스택과 Expo

- Android Todo 앱이며 React Native + Expo SDK 57 + TypeScript를 사용한다. 단순하고 초보자가 읽기 쉬운 구조를 우선한다.
- Expo 기능 구현 전 [Expo SDK 57 문서](https://docs.expo.dev/versions/v57.0.0/)와 실제 설치 버전을 확인한다. 최신 SDK API를 그대로 적용하지 않는다. 단순 실행에는 이미 확인한 문서를 다시 읽지 않는다.

## UI와 캐릭터

- UI는 흰 배경, 초록 강조, compact한 Todo 중심 화면을 사용한다. 체크박스는 오른쪽에 두고, 완료 항목은 회색+취소선으로 표시한다.
- 우선순위는 높음/보통/낮음이며 기본값은 보통이다.
- 캐릭터는 보조 요소다. 그림·말풍선·대사는 분리하고, 대사는 배열로 관리한다. 성장/보상은 요청 전 구현하지 않는다.

## 버전과 운영

- 버전은 앱의 사용자 체감 변경이 완료된 논리 작업당 최대 1회 올린다. 작은 변경은 PATCH, 기능/마일스톤은 MINOR, 1.0.0은 사용자 승인 후 올린다. Reviewer가 필요한 작업은 PASS 후 판단한다.
- 조사·문서·Codex 설정·테스트만이면 앱 버전을 유지한다. 재작업·후속 요청으로 같은 묶음을 중복 증가시키지 않는다. 증가할 때 CHANGELOG도 갱신한다.
- 검증 상세는 `.agents/skills/verify/SKILL.md`를 따른다.
- 운영·버전 명령은 `docs/CODEX.md`, 실행·검증·빌드·커밋·릴리스 절차는 각 `.agents/skills/*/SKILL.md`에서 필요할 때만 확인한다.

## Agent 검토 기준

- AsyncStorage, Android native/Widget, Expo/build 설정은 Reviewer 사용 여부를 판단할 때 프로젝트 고유 위험 요소로 본다.
