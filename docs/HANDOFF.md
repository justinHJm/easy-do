# easy-do 개발환경 전환

이 문서는 집 PC의 로컬 저장소와 GitHub Codespace를 번갈아 사용할 때 코드뿐 아니라 현재 작업 맥락도 안전하게 넘기는 규칙을 정리한다.

## 구조

- 집 PC: 기존 로컬 저장소를 유지한다. Android Studio, 실제 Galaxy, 네이티브/위젯 검증은 이쪽을 우선한다.
- 외부/P12: GitHub Codespace를 사용한다. Codex, TypeScript/Expo 코드 수정, lint/test, 문서 작업을 수행한다.
- GitHub: 두 개발환경 사이의 소스코드와 `CURRENT_WORK.md` 전달 경로다.
- `docs/CURRENT_WORK.md`: Codex 세션이 달라도 현재 WIP를 이어가기 위한 임시 인계문서다.
- `.local/`: Git에 올리면 안 되는 일반 자료의 로컬 작업 영역이다. 필요하면 Google Drive 등 별도 저장소로 동기화한다.
- 비밀값: `.env`, 인증 키, keystore 등은 Git에 넣지 않는다. 로컬은 기존 비Git 파일을 사용하고 Codespace는 Codespaces Secrets를 우선한다.

## Codespace 최초 생성

`.devcontainer/devcontainer.json`이 다음을 자동 준비한다.

1. Node.js 22 개발 컨테이너
2. `npm ci`
3. Codex CLI 0.153.4
4. Expo Metro용 8081 포트 전달

Codespace 머신은 2 CPU를 요구한다. 머신 유형 선택 화면이 나오면 2-core를 사용한다.

Codex 로그인/인증 값은 저장소에 기록하지 않는다. Codespace를 처음 만들었을 때 필요한 인증만 사용자가 직접 진행한다.

## 세션 인계 원칙

Codex CLI/VS Code 확장/Desktop의 대화 세션 자체를 기기간 동기화하려 하지 않는다. 대신 다음 네 가지를 함께 사용한다.

1. `AGENTS.md`: 항상 지켜야 할 작업 규칙
2. `docs/PROJECT.md`: 프로젝트 장기 맥락
3. `docs/CURRENT_WORK.md`: 지금 하던 작업의 임시 기억
4. 실제 Git branch/diff/code: 최종 진실의 원천

`CURRENT_WORK.md`와 실제 코드가 다르면 실제 코드와 Git 상태를 우선한다.

## 나가기 전: handoff

Codex에게 다음처럼 요청한다.

```text
외부에서 이어서 할 거니까 handoff 해.
```

또는 handoff skill을 직접 사용한다.

handoff는 다음을 수행한다.

- 현재 branch/status/diff 확인
- 이번 세션의 실제 완료/미완료/검증 상태 확인
- `docs/CURRENT_WORK.md` 갱신
- 장기 기록 기준에도 해당하면 `docs/DEVLOG_PENDING.md`에 필요한 최소 메모 보완
- `npm run handoff` 실행
- 다음 환경에서 필요한 행동 보고

handoff 자체는 `commit`, `push`, `pull`, `stash`, `reset`을 수행하지 않는다.

## 새 환경에서: resume-work

Codex에게 다음처럼 요청한다.

```text
CURRENT_WORK 확인하고 인계받아서 이어서 해.
```

resume-work는 다음을 수행한다.

- `AGENTS.md`, `PROJECT.md`, `CURRENT_WORK.md` 확인
- `npm run handoff`로 실제 Git 동기화 상태 확인
- 인계문서와 실제 코드/branch/diff 대조
- 차이가 있으면 실제 상태를 우선해 보고
- WIP가 정상적으로 전달됐으면 남은 작업부터 이어서 진행

`CURRENT_WORK.md` 상태가 `idle`이면 이어받을 WIP가 없는 것으로 본다.

## 환경을 바꾸기 전 Git 검사

항상 다음 명령을 사용할 수 있다.

```bash
npm run handoff
```

이 명령은 다음만 수행한다.

- 현재 branch 확인
- `git fetch --prune origin`
- upstream 대비 ahead/behind 확인
- 미커밋 변경 확인
- `docs/CURRENT_WORK.md` 존재/상태 확인
- 안전한 다음 행동 안내

자동 `commit`, `push`, `pull`, `reset`, `stash`는 하지 않는다.

## PC -> Codespace 예시

1. PC에서 Codex에게 `handoff 해` 요청
2. Codex가 `CURRENT_WORK.md`와 필요 시 `DEVLOG_PENDING.md`를 갱신
3. `npm run handoff` 결과 확인
4. 변경과 인계문서를 사용자가 검토
5. 다른 환경에서도 이어야 하면 사용자가 명시적으로 WIP commit/push 요청
6. P12에서 같은 branch의 Codespace를 연다.
7. Codex에게 `CURRENT_WORK 확인하고 이어서 해` 요청
8. behind 상태면 먼저 동기화 필요 여부를 확인한다.

## Codespace -> PC

반대 방향도 동일하다.

1. Codespace에서 handoff
2. 변경/인계문서 검토
3. 필요한 경우에만 사용자 승인 후 commit/push
4. PC에서 최신 원격 상태 확인
5. resume-work로 인계 확인
6. Android/실기기 검증이 필요하면 PC에서 진행

## 미완성 코드

미완성이라는 이유만으로 Git에 절대 올리면 안 되는 것은 아니다. 기기 전환이 필요하면 작업 branch에 WIP 커밋을 둘 수 있다. 단, easy-do의 기존 Git 규칙대로 commit/push는 사용자 명시 요청이 있을 때만 수행한다.

반면 아래 자료는 branch 종류와 상관없이 Git에 넣지 않는다.

- `.env`와 API key/token
- keystore/서명키/비밀번호
- 인증 JSON의 비밀정보
- 개인정보가 포함된 테스트 데이터
- `.local/` 아래의 비Git 자료

## Google Drive 역할

Google Drive는 Git이나 `CURRENT_WORK.md`의 대체재가 아니라 비Git 자료 저장소로 사용한다.

권장 폴더 예시:

```text
Google Drive/
  Development/
    easy-do/
      local-data/
      references/
      design-originals/
      store-assets/
      backups/
```

프로젝트 내부 `.local/`과 Drive의 `local-data/`를 필요할 때 동기화할 수 있다. 자동 동기화를 켤 경우에도 `.gitignore`의 `.local/` 제외는 유지한다.

Drive OAuth/token을 저장소 파일에 넣지 않는다. Codespace에서 Drive 자동 동기화를 추가할 때는 별도 인증 도구의 보안 저장소 또는 Codespaces Secret을 사용한다.

## 충돌 방지 원칙

- 한 환경에서 미커밋 코드를 남겨둔 채 다른 환경에서 같은 파일을 수정하지 않는다.
- 환경을 바꿀 때 handoff를 먼저 수행한다.
- `ahead > 0`이면 push 여부를 확인한다.
- `behind > 0`이면 현재 작업 트리가 clean인지 먼저 확인한다.
- `ahead > 0`과 `behind > 0`이 동시에 나오면 자동 동기화하지 않고 차이를 먼저 검토한다.
- `CURRENT_WORK.md`를 대화 전체 보관소처럼 키우지 않는다. 완료된 내용은 장기 기록 체계로 넘기고 idle로 정리한다.
