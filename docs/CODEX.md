# easy-do Codex 운영

## 모델과 설치 환경

2026-09-08 확인: VS Code 내장 CLI 0.153.0, npm 전역 CLI 0.153.4는 별개 설치본이다.
VS Code CLI의 model/list에서 아래 모델 ID와 reasoning 지원을 확인했다.

| 역할 | 모델 | reasoning |
| --- | --- | --- |
| Manager | 현재 세션 선택 유지 (사용자 지정 GPT-6 Astra) | 사용자 지정 Medium 유지 |
| Worker | gpt-5.6-terra | medium |
| Reviewer | gpt-5.6-sol | low |
| Explorer | gpt-5.6-luna | low |

프로젝트는 Manager model/reasoning을 덮어쓰지 않는다. 별도 CLI config/read는 Astra/low를 반환했다. 이는 사이드바 활성 턴의 Medium 선택을 직접 확인한 결과가 아니다.
Plus의 정확한 차감량/절감률은 확인할 수 없다. 역할별 모델 분리와 호출·문맥·검증 감소 정책이며 비용/속도 수치를 보장하지 않는다.
아래 설치 경로 표 중 VS Code/npm 버전은 재확인했으며 다른 설치본 버전은 이전 조사 기록이다.
### 실행 파일 경로와 실제 버전

| 구분 | 실행 파일의 절대 경로 | `--version` 결과 | 실행 환경 확인 |
| --- | --- | --- | --- |
| VS Code Codex 확장 | `%USERPROFILE%\.vscode\extensions\openai.chatgpt-26.901.22334-win32-x64\bin\windows-x86_64\codex.exe` | `codex-cli 0.153.0` | 실행 중인 app-server의 부모가 `Code.exe`임을 확인. 현재 VS Code에서 사용하는 설치본 |
| npm 전역 Codex CLI | `%USERPROFILE%\AppData\Roaming\npm\node_modules\@openai\codex\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe` | `codex-cli 0.153.4` | `codex.cmd --version`과 실제 바이너리의 결과가 일치 |
| PATH에서 발견한 별도 설치본 | `%USERPROFILE%\AppData\Local\Programs\OpenAI\Codex\bin\codex.exe` | `codex-cli 0.153.2` | 실행 가능한 별도 경로. 현재 VS Code의 app-server 경로와 다름 |
| 데스크톱 앱 실행 중인 런타임 | `%USERPROFILE%\AppData\Local\OpenAI\Codex\bin\994e8469124a0d31\codex.exe` | `codex-cli 0.153.0-alpha.5` | 부모가 WindowsApps의 OpenAI.Codex `ChatGPT.exe`. VS Code 프로세스와 구별 |

npm 진입점은 `%USERPROFILE%\AppData\Roaming\npm\codex.cmd`이며, PowerShell용 `codex.ps1`도 같은 폴더에 있습니다.
이 진입점은 `node_modules\@openai\codex\bin\codex.js`를 통해 npm 설치본을 실행합니다.
VS Code 확장과 npm CLI는 **별개 설치본**입니다. npm의 버전만 확인해서 VS Code의 실제 실행 버전으로 기록하지 않습니다.
`codex.exe`를 확장자까지 지정하면 PATH의 별도 설치본이 선택될 수 있으므로 위 절대 경로나 `codex.cmd`로 구분합니다.
경로에 포함된 확장 버전·런타임 식별자는 업데이트 시 바뀔 수 있습니다. 재확인에는 `Get-Command codex*`, `Get-CimInstance Win32_Process`, 각 경로의 `--version`을 사용합니다.

## 설정과 호출

- `.codex/config.toml`: `agents.max_concurrent_threads_per_session = 2`. Manager 제외 동시 자식 상한이다. `max_threads`는 사용하지 않는다.
- 역할 미지정 자식 기본은 Terra/medium. `.codex/agents/*.toml`의 `model`, `model_reasoning_effort`가 역할별 값이다.
- 작은 작업 Manager 직접, 일반 Worker 1개, 독립 파일 영역만 2개 병렬. 세 번째 영역은 순차 처리한다. Reviewer는 필요할 때 Worker 완료 후 호출한다.
- 역할 선택 도구가 있으면 custom agent를 사용한다. 없으면 역할 지침과 명시 model/reasoning, fork_turns="none"을 전달한다. TOML이 자동 적용됐다고 주장하지 않는다.
- 복잡한 리뷰의 effort 상향은 도구/설정 우선순위를 확인한 뒤 해당 작업에만 적용한다. custom TOML의 값을 도구가 무조건 덮어쓴다고 가정하지 않는다.
- 기존 세션/이미 생성한 자식에 소급 적용은 보장하지 않는다. 다음 새 세션에서 로딩을 확인한다.
- 자식 권한은 부모의 실제 런타임 선택이 우선할 수 있다. 읽기 전용 역할은 행동 규칙도 지킨다.

## 규칙의 위치

| 파일 | 단일 관리 대상 |
| --- | --- |
| AGENTS.md | 항상 적용되는 개발·UI·위임·Git·버전 핵심 |
| .codex/agents/*.toml | 역할별 모델·행동·짧은 보고 |
| .agents/skills/verify/SKILL.md | LOW/NORMAL/HIGH 검증과 실행 명령 |
| .agents/skills/expo-start/SKILL.md | 빠른 LAN 실행·기존 서버·QR |
| .agents/skills/build-apk/SKILL.md | APK 준비·실행 범위 |
| .agents/skills/commit/SKILL.md | 명시 커밋 요청 처리 |
| .agents/skills/release/SKILL.md | 릴리스 노트 준비 |

상세 파일을 매번 모두 읽지 않는다. $verify, $expo-start, $build-apk, $commit, $release 또는 평소 문장으로 요청한다.
예: “제목만 바꿔줘”는 Manager/최소 검사, “저장 구조를 바꿔줘”는 Worker와 독립 검토, “Expo 열어줘”는 서버/QR만.

## 버전 명령

기준은 app.json의 expo.version이며 package.json과 lockfile 루트 버전을 일치시킨다.
`node scripts/manage-version.cjs check`는 확인, `patch|minor --reason "설명"`은 미리보기, `--apply`를 붙이면 적용한다.
작업 시작 버전과 이번 묶음의 증가 여부를 확인한다. 완료된 사용자 체감 변경에 한 번만 적용하고 재작업은 같은 CHANGELOG 항목을 보완한다.
Reviewer가 필요한 작업은 PASS 후, 작은 변경은 Manager 검증 후 판단한다. 문서/설정/검사만이면 증가하지 않는다.
기존 버전 항목이 있거나 사용자 버전 지시가 다르면 이력을 확인한다. 1.0.0은 사용자 승인 필요.
Android versionCode는 앱 버전과 별도다. APK 작업 때 실제 EAS local/remote 설정을 확인하며 임의 초기화하지 않는다.

## APK 준비 상태

`eas.json`의 preview 프로필은 직접 설치할 Android APK를 만든다. `npx.cmd --yes eas-cli@23.2.0 build --platform android --profile preview`로 실행한다.
앱 식별자는 `com.justinhjm.easydo`, EAS 프로젝트는 `@ceba77/easy-do`다. 앱 표시 버전은 0.3.1이고 별도 빌드 번호는 EAS remote에서 관리한다. 서명 키를 Git에 넣지 않는다.
빌드 시 소스가 EAS로 업로드된다. 로컬 android 폴더는 생성하지 않는다. npm run android는 개발 서버 실행이며 APK 빌드가 아니다.

## GitHub Pages 개인정보처리방침

- 공개 파일은 `docs/privacy.html`이다. GitHub Pages 설정에서 브랜치와 `/docs` 폴더를 Source로 직접 선택한다.
- 기본 예상 주소는 `https://<repository-owner>.github.io/<repository-name>/privacy.html`이다. 실제 owner와 repository name, Pages의 배포 브랜치에 따라 최종 주소가 정해진다.
- 앱 본문 기준은 `src/constants/privacy-policy.ts`이다. 개인정보처리방침을 바꿀 때는 같은 원문이 유지되도록 `docs/privacy.html`도 같은 변경에서 함께 갱신한다.

## 검증 근거와 한계

설정 syntax는 TOML 파서, 실효 설정은 설치된 app-server --stdio --strict-config의 config/read, 모델은 model/list, 스킬은 skills/list로 확인한다.
실제 에이전트 호출과 적용 모델 확인은 별도로 구분한다. 로딩 성공만으로 응답 성공을 주장하지 않는다.
공식 근거: https://developers.openai.com/codex/multi-agent/ (custom agent 모델/effort와 동시 상한).
전역 설정·앱 소스·앱 버전은 변경하지 않는다.

2026-09-08 확인 결과: VS Code 0.153.0과 npm CLI 0.153.4 모두 strict-config 로딩 성공. config/read에서 자식 동시 상한 2와 기본 terra/medium을 확인했고, model/list에서 위 네 모델, skills/list에서 프로젝트 스킬 5개와 오류 없음이 확인됐다.
Worker·Explorer·Reviewer는 최소 문맥으로 실제 호출해 응답을 확인했다. Reviewer는 이번 설정/문서 변경을 LOW 범위에서 PASS로 판단했다. 역할 설정과 모델 제공 여부는 확인했지만, 서버 내부에서 실제 적용한 모델·reasoning의 별도 실행 기록은 확인하지 못했다. Plus 사용량 절감률이나 응답 시간 개선 폭은 측정하지 않았다.
