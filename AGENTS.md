# easy-do 핵심 규칙

- Android Todo 앱. React Native + Expo SDK 57 + TypeScript. 단순하고 초보자가 읽기 쉬운 구조를 우선한다.
- Expo 기능 구현 전 https://docs.expo.dev/versions/v57.0.0/ 와 실제 설치 버전을 확인한다. 최신 SDK API를 그대로 적용하지 않는다. 단순 실행에는 이미 확인한 문서를 다시 읽지 않는다.
- 변경은 작게, 요청 범위 안에서 한다. 기존 기능과 사용자 변경을 보존한다. 새 dependency 필요성을 먼저 설명하고 불필요한 설치·추상화·리팩터링을 피한다.
- 타입은 명확하게, any는 최소화한다. 계산 가능한 상태를 중복 저장하지 않는다. 비직관적 핵심 로직에만 왜 필요한지 간결한 한국어 주석을 쓴다.
- UI: 흰 배경, 초록 강조, compact한 Todo 중심 화면, 오른쪽 체크박스, 완료는 회색+취소선. 우선순위 높음/보통/낮음, 기본 보통.
- 캐릭터는 보조 요소다. 그림·말풍선·대사는 분리하고 대사는 배열로 관리한다. 성장/보상은 요청 전 구현하지 않는다.

## Agent 사용

- Main Codex가 Manager다. 위임할 작업은 범위 결정에 필요한 파일만 확인하고 전체 프로젝트를 미리 탐색하지 않는다.
- 작은 텍스트·스타일·1~2파일 단순 수정·문서·설정은 Manager 직접 처리한다. 기본적으로 Explorer/Worker/Reviewer를 만들지 않는다.
- 일반 구현은 Worker 1개. 명확히 독립된 파일 영역일 때만 Worker 2개 병렬. 독립적인 세 번째 영역도 동시 상한 2를 지키며 앞 작업 종료 후 배정한다.
- Explorer는 위치/의존성 조사 자체가 주 작업이거나 탐색 비용 절감이 명확할 때만 사용한다.
- Reviewer는 저장/AsyncStorage, shared/global state, architecture, Android native/Widget, dependency, Expo/build 설정, 큰 회귀 위험, Worker 불확실성, 검증 실패 또는 독립 검토 가치가 명확할 때만 사용한다. 작은 가역 변경에는 Manager 검증으로 끝낸다.
- 생성·조율은 Manager만 한다. 자식 재위임 금지. 같은 파일 동시 수정 금지. 역할 지침·모델은 `.codex/agents/*.toml`이 기준이다.
- 전달은 요구사항·소유 파일·완료 기준·관련 증거만. 전체 대화/프로젝트 배경을 복사하지 않는다. 가능하면 fork_turns="none"을 사용한다.
- 보고는 changed files / key change / verification / unresolved risk만 각 1~2줄. Explorer는 relevant files / symbols / flow / constraints. 미실행 검사를 PASS로 쓰지 않는다.
- 검증 상세는 `.agents/skills/verify/SKILL.md`. 적절한 성공 검사를 이유 없이 반복하지 않는다.

## Git·버전·Skills

- commit/push/tag/release/force push 및 원격 변경은 각각 사용자 명시 요청 없이는 금지. 기존 변경을 임의 stage/reset/unstage하지 않는다.
- 버전은 앱의 사용자 체감 변경이 완료된 논리 작업당 최대 1회. 작은 변경은 PATCH, 기능/마일스톤은 MINOR, 1.0.0은 사용자 승인 필요. Reviewer가 필요한 작업은 PASS 후 판단한다.
- 조사·문서·Codex 설정·테스트만이면 앱 버전 유지. 재작업/후속 요청으로 같은 묶음을 중복 증가시키지 않는다. 증가할 때 CHANGELOG도 갱신한다.
- 운영/버전 명령은 `docs/CODEX.md`, 실행·검증·빌드·커밋·릴리스 절차는 각 `.agents/skills/*/SKILL.md`에서 필요할 때만 읽는다.
