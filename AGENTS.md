# Codex 작업 규칙

- 프로젝트 고유 규칙은 `docs/PROJECT.md`를 따른다.
- 변경은 작게, 요청 범위 안에서 한다. 기존 기능과 사용자 변경을 보존한다. 새 dependency 필요성을 먼저 설명하고 불필요한 설치·추상화·리팩터링을 피한다.
- 타입은 명확하게, any는 최소화한다. 계산 가능한 상태를 중복 저장하지 않는다. 비직관적 핵심 로직에만 왜 필요한지 간결한 한국어 주석을 단다.

## Agent 사용

- Main Codex가 Manager다. 위임할 작업은 범위 결정에 필요한 파일만 확인하고 전체 프로젝트를 미리 탐색하지 않는다.
- 작은 텍스트·스타일·1~2파일 단순 수정·문서·설정은 Manager가 직접 처리한다. 기본적으로 Explorer/Worker/Reviewer를 만들지 않는다.
- 일반 구현은 Worker 1개. 명확히 독립된 파일 영역일 때만 Worker 2개 병렬. 독립적인 세 번째 영역은 동시 상한 2를 지키며 앞 작업 종료 후 배정한다.
- Explorer는 위치/의존성 조사 자체가 주 작업이거나 탐색 비용 절감이 명확할 때만 사용한다.
- Reviewer는 저장, shared/global state, architecture, native 기능, dependency, build 설정, 큰 회귀 위험, Worker 불확실성, 검증 실패 또는 독립 검토 가치가 명확할 때만 사용한다. 작은 가역 변경은 Manager 검증으로 끝낸다.
- 생성·조율은 Manager만 한다. 자식 재위임과 같은 파일 동시 수정은 금지한다. 역할 지침·모델은 `.codex/agents/*.toml`이 기준이다.
- 전달은 요구사항·소유 파일·완료 기준·관련 증거만 한다. 전체 대화·프로젝트 배경은 복사하지 않는다. 가능하면 `fork_turns="none"`을 사용한다.
- 보고는 changed files / key change / verification / unresolved risk를 각 1~2줄로 한다. Explorer는 relevant files / symbols / flow / constraints를 보고한다. 미실행 검사를 PASS로 쓰지 않는다.
- 적절한 성공 검사를 이유 없이 반복하지 않는다.

## Git·Skills

- commit/push/tag/release/force push 및 원격 변경은 각각 사용자 명시 요청 없이는 금지한다. 기존 변경을 임의로 stage/reset/unstage하지 않는다.
- 운영 명령과 실행·검증·빌드·커밋·릴리스 절차는 프로젝트 문서와 해당 skill 지침에서 필요할 때만 확인한다.
