---
name: verify
description: easy-do 변경의 TypeScript, 기존 테스트, lint 준비 상태와 Expo Android 호환성을 검사한다. 구현 완료 및 Reviewer 검증 때 사용한다.
---

# easy-do 검증

AGENTS.md와 이번 변경 범위를 확인한다. 앱 코드를 고치지 않고 검사 결과를 보고한다.
Manager가 준 성공한 검사 결과는 변경이 없으면 재실행하지 않는다. 신규 untracked 파일도 검토한다.

- 문서·Codex 설정만: 링크/설정/스킬 로딩, Git diff, 버전 일치 검사를 우선한다.
- 버전 관리 도구 변경: `node scripts/test-manage-version.cjs`로 격리된 임시 파일에서 미리보기·적용·부분 쓰기 실패를 검사한다.
- 앱 코드: `npx.cmd tsc --noEmit`을 실행한다. 로컬 TypeScript가 없으면 자동 설치하지 말고 차단 사유를 보고한다.
- 상태·날짜·저장 변경: `node scripts/test-todo-storage.cjs`. 날짜 변경은 필요하면 별도 프로세스에서 `TZ=America/New_York`도 검사한다. PowerShell에서는 기존 `$env:TZ`를 보관하고 finally에서 복구한다.
- lint: package.json의 실제 명령, node_modules의 ESLint, 설정 파일을 먼저 확인한다. 현재 `expo lint`는 도구가 없으면 설치를 시작하므로 **바로 실행하지 않는다**. 준비가 모두 된 경우에만 `npm.cmd run lint`; 없으면 SKIP(미구성)과 이유를 보고한다.
- Expo API/패키지 변경 전 https://docs.expo.dev/versions/v57.0.0/ 와 실제 dependency를 확인한다.
- 화면/네이티브/에셋/의존성 변경: Manager가 `npx.cmd expo export --platform android --output-dir .expo/verify-android`로 번들을 확인한다. 읽기 전용 Reviewer는 실행 증거를 받는다.
- Expo config 변경: `npx.cmd expo config --type public`으로 실제 설정을 확인한다. 비밀 환경변수는 출력하지 않는다.
- `expo-doctor`가 설치되어 있지 않으면 임의 다운로드하지 않는다. 필요하면 도구 설치 이유를 먼저 설명한다.
- `node scripts/manage-version.cjs check`와 `git diff --check`를 사용한다. 기존 변경과 이번 변경을 구별한다.

`reset-project`, prebuild, 패키지 설치, Git 쓰기는 검증 명령이 아니다.
결과는 PASS/FAIL/BLOCKED, 실제 명령·종료 코드, lint SKIP 이유, Android 실기기 미검증 항목으로 보고한다.
번들 성공은 APK 생성이나 Expo Go 실기기 검증을 의미하지 않는다.
