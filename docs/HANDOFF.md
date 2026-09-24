# easy-do 개발환경 전환

이 문서는 집 PC의 로컬 저장소와 GitHub Codespace를 번갈아 사용할 때 작업이 꼬이지 않도록 하는 최소 규칙을 정리한다.

## 구조

- 집 PC: 기존 로컬 저장소를 유지한다. Android Studio, 실제 Galaxy, 네이티브/위젯 검증은 이쪽을 우선한다.
- 외부/P12: GitHub Codespace를 사용한다. Codex, TypeScript/Expo 코드 수정, lint/test, 문서 작업을 수행한다.
- GitHub: 두 개발환경 사이의 소스코드 전달 경로다.
- `.local/`: Git에 올리면 안 되는 일반 자료의 로컬 작업 영역이다. 필요하면 Google Drive 등 별도 저장소로 동기화한다.
- 비밀값: `.env`, 인증 키, keystore 등은 Git에 넣지 않는다. 로컬은 기존 비Git 파일을 사용하고 Codespace는 Codespaces Secrets를 우선한다.

## Codespace 최초 생성

`.devcontainer/devcontainer.json`이 다음을 자동 준비한다.

1. Node.js 22 개발 컨테이너
2. `npm ci`
3. 프로젝트 로컬 환경과 맞춘 Codex CLI 0.153.4
4. Expo Metro용 8081 포트 전달

Codespace 머신은 2 CPU를 요구한다. 머신 유형 선택 화면이 나오면 2-core를 사용한다.

Codex 로그인/인증 값은 저장소에 기록하지 않는다. Codespace를 처음 만들었을 때 필요한 인증만 사용자가 직접 진행한다.

## 환경을 바꾸기 전

항상 먼저 실행한다.

```bash
npm run handoff
```

이 명령은 다음만 수행한다.

- 현재 branch 확인
- `git fetch --prune origin`
- upstream 대비 ahead/behind 확인
- 미커밋 변경 확인
- 안전한 다음 행동 안내

자동 `commit`, `push`, `pull`, `reset`, `stash`는 하지 않는다.

## PC -> Codespace

1. PC에서 `npm run handoff`
2. 미커밋 변경이 있으면 Codex 결과와 diff를 사용자가 확인한다.
3. 다른 환경에서도 이어야 할 소스 변경만 사용자가 명시적으로 commit/push 한다.
4. P12에서 같은 branch의 Codespace를 연다.
5. Codespace에서 `npm run handoff`
6. behind만 있고 작업 트리가 clean이면 `git pull --ff-only`로 최신 커밋을 가져온다.

## Codespace -> PC

반대 방향도 동일하다.

1. Codespace에서 `npm run handoff`
2. 변경을 검토한다.
3. 필요한 경우에만 사용자가 commit/push를 지시한다.
4. PC에서 `npm run handoff`
5. clean + behind 상태를 확인한 뒤 `git pull --ff-only`
6. Android/실기기 검증을 진행한다.

## 미완성 코드

미완성이라는 이유만으로 Git에 절대 올리면 안 되는 것은 아니다. 기기 전환이 필요하면 작업 branch에 WIP 커밋을 둘 수 있다. 단, easy-do의 기존 Git 규칙대로 commit/push는 사용자 명시 요청이 있을 때만 수행한다.

반면 아래 자료는 branch 종류와 상관없이 Git에 넣지 않는다.

- `.env`와 API key/token
- keystore/서명키/비밀번호
- 인증 JSON
- 개인정보가 포함된 테스트 데이터
- `.local/` 아래의 비Git 자료

## Google Drive 역할

Google Drive는 Git의 대체재가 아니라 비Git 자료 저장소로만 사용한다.

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
- 환경을 바꿀 때 `npm run handoff`를 먼저 실행한다.
- `ahead > 0`이면 push 여부를 확인한다.
- `behind > 0`이면 현재 작업 트리가 clean인지 먼저 확인한다.
- `ahead > 0`과 `behind > 0`이 동시에 나오면 자동 동기화하지 않고 차이를 먼저 검토한다.
