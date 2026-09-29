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
- 로컬 PC와 Codespace 등 개발환경을 바꿀 때는 `docs/CURRENT_WORK.md`를 임시 인계문서로 사용한다. 나가기 전에는 handoff skill, 새 환경에서는 resume-work skill을 우선한다.
- `CURRENT_WORK.md`는 실제 코드/Git보다 우선하지 않는다. 비밀값을 기록하지 않고, 완료된 장기 기록은 기존 CHANGELOG/DEVLOG 체계로 넘긴 뒤 idle로 정리한다.
- handoff 요청은 `CURRENT_WORK.md` 갱신과 읽기/검사 명령을 허용할 뿐 commit/push/pull/stash/reset 권한을 뜻하지 않는다.

## 개발 기록

easy-do의 장기 개발 기록은 별도 자동화가 Git 변경사항과 Codex 작업 기록을 종합해 Google Drive의 DevLog, Troubleshooting, Backlog, Roadmap 등에 정리한다. Codex는 매 작업마다 사람이 읽는 완성형 DevLog를 직접 작성하지 않고, 의미 있는 작업이 끝났을 때 자동화용 짧은 메모만 `docs/DEVLOG_PENDING.md`에 남긴다.

### 기록 대상

- 실제 기능 추가·제거, 사용자 동작 또는 데이터 구조 변경, 버그 수정
- 반복 실패 뒤 원인을 해결한 작업, Reviewer가 발견한 중요한 문제·회귀, rollback/revert
- 중요한 설계 결정, build/native/storage/widget/lifecycle 관련 문제, 다음 작업에 영향을 주는 기술적 결정
- 다음 세션에서 이어야 하는 중요한 WIP

단순 문구·spacing·색상·사소한 스타일·주석 변경이나 의미 없는 정리는 별도 기록 가치가 없으면 남기지 않는다.

### 기록 형식과 원칙

- 날짜 항목이 있으면 그 아래에, 없으면 `## YYYY-MM-DD`를 만들어 작업별로 `### 작업 제목`과 목적·구현·문제/원인·검증·남은 작업 중 필요한 항목만 짧게 기록한다.
- 실제 구현과 검증 수준을 추측하지 않는다. 자동검증 완료, Reviewer PASS, 실기기 미검증, APK 미빌드, 미커밋, WIP, 배포 전, 원격 미반영처럼 실제 상태를 명시한다.
- 이 파일은 최종 개발 연혁이 아니라 자동화용 원재료다. Git diff로 알기 어려운 변경 이유, 실패 원인, 버린 시도, 보류·롤백 이유, 미검증 항목을 우선 기록한다.

`DEVLOG_PENDING.md`는 해당 기능 작업과 함께 commit할 수 있다. commit/push/tag/release 승인 규칙은 위 Git 규칙을 따르며, 특정 작업의 명시 승인이 있더라도 tag·release는 별도 명시 없이는 수행하지 않는다.
