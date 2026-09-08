---
name: verify
description: easy-do 변경 위험을 LOW/NORMAL/HIGH로 분류해 필요한 검사만 수행한다. 이미 통과한 증거는 재사용한다.
---

# 변경 범위에 맞는 검증

가장 높은 실제 위험으로 분류한다. 파일 수만으로 확대하지 않는다. 앱 코드는 수정하지 않는다.

| 등급 | 대상 | 검사 |
| --- | --- | --- |
| LOW | 문구/스타일/작은 UI, 문서, 단순 Codex 설정 | 변경 파일과 연결 확인. TS/JSX 타입 위험이 있으면 typecheck. 문서만이면 앱 검사 생략. |
| NORMAL | 일반 기능, 화면 내부 상태, 여러 관련 파일 | typecheck와 관련 기존 테스트·준비된 lint. |
| HIGH | 저장/AsyncStorage, shared state/architecture, Android/Widget, dependency, Expo/build 설정, 큰 회귀 위험 | NORMAL + 영향 범위의 넓은 테스트/Android 번들·config 확인. AGENTS의 조건부 Reviewer 사용. |

- TypeScript: `npx.cmd tsc --noEmit`.
- 상태/날짜/저장: `node scripts/test-todo-storage.cjs`. 날짜 경계 변경 때만 필요에 따라 TZ=America/New_York로 추가 검사하고 원래 환경을 복원한다.
- 버전 스크립트 변경: `node scripts/test-manage-version.cjs`.
- lint는 ESLint와 설정이 이미 있는 경우만 관련 파일 검사. 현재 미구성이므로 SKIP; expo lint가 설치를 유도하면 실행하지 않는다.
- Android 번들은 네이티브 연계·새 에셋·의존성·빌드 변경 또는 번들 회귀 우려 때 `npx.cmd expo export --platform android --output-dir .expo/verify-android`. 모든 작은 UI 수정에 실행하지 않는다.
- Expo 설정 변경은 `npx.cmd expo config --type public`; 비밀 환경변수 출력 금지. API는 SDK57 기준.
- Codex 설정만이면 TOML/Skill 문법과 설치된 CLI의 config/agents 로딩 확인. 앱 테스트·Android 번들 불필요.
- diff/버전 관련 변경에만 `git diff --check`, `node scripts/manage-version.cjs check` 적용.
- 적절한 검사가 통과했고 영향 변경이 없으면 반복하지 않는다. 도구 자동 설치·캐시 초기화·prebuild·Git 쓰기는 검증이 아니다.

보고는 등급, 실제 검사/결과, SKIP 이유, 남은 위험만. Reviewer는 Manager 증거를 재사용한다. 번들 성공은 실기기 성공이 아니다.
