# easy-do Codex 개발 운영

## 확인한 환경

- Windows + VS Code Codex 확장. 실행 중인 프로세스의 경로·부모 프로세스와 각 실행 파일의 `--version`으로 아래 설치본을 재확인했습니다.
- 사용자 전역 `~/.codex/config.toml`은 보존합니다. easy-do는 이미 trusted 프로젝트입니다.
- 프로젝트 `.codex/config.toml`: 자식 동시 상한 3개, Manager 포함 최대 4개. 모델/추론 수준은 기존 사용자 선택을 상속합니다.
- 전역 `danger-full-access` 및 실행 중 권한 선택은 역할 파일의 기본 권한보다 우선할 수 있습니다. 읽기 전용을 OS 차단으로 보장한다고 주장하지 않습니다.
- 앱은 Expo `~57.0.20`, React Native `0.86.3`, AsyncStorage `2.2.0`. 실제 버전은 app.json의 expo.version이며 package/lock에도 맞춥니다.

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

## 구조

```text
사용자 → Main Codex (Manager)
             ├─ 필요할 때 Explorer
             ├─ Worker 0~3개 (서로 다른 파일)
             └─ Reviewer → FAIL이면 담당자만 재작업 → 재검증
                         → PASS → Manager 버전/CHANGELOG 판단
                         → 최종 diff 확인 → 사용자 보고
                         → 별도 명시 요청이 있을 때만 Git 쓰기
```

작은 작업은 Manager 직접 또는 Worker 1개, 독립된 중간 작업은 2개, 큰 작업은 최대 3개입니다.
Explorer·Reviewer도 자식 슬롯을 쓰므로 Worker 3개를 실행한 뒤 Reviewer를 무조건 동시에 추가하지 않습니다.
자식은 `[agents] enabled = false`와 역할 지침으로 재위임하지 않습니다. 생성과 조율은 Manager만 합니다.
Reviewer는 변경 diff·신규 파일·검증 증거를 보고 PASS/FAIL/BLOCKED를 판단합니다. 전체 코드를 매번 다시 읽지 않습니다.
통합 검증 결과를 재사용하고 수정된 결함 담당자만 재투입합니다.

`.codex/agents/*.toml`은 공식 custom agent 형식입니다. 역할 선택을 노출하지 않는 `collaboration.spawn_agent` 도구에서는
Manager가 해당 역할 파일을 읽고 메시지로 지침을 전달합니다. `task_name`을 역할 설정 자동 적용 인자로 오인하지 않습니다.
이 경로에서도 별도의 subagent로 검토하지만 TOML의 sandbox 설정이 적용됐다고 말하지 않습니다.
설정은 다음 새 대화에서 다시 읽힙니다. 스킬이 안 보이면 VS Code의 Codex 대화를 새로 열거나 확장을 다시 로드합니다.

## 평소 요청

- “완료 체크박스 색만 조금 바꿔줘.” → 작은 작업으로 구현 후 Reviewer.
- “오늘 보기와 저장 로직의 이 오류를 고쳐줘.” → 의존성을 보고 순차/병렬 결정.
- “사용자 리스트 검색과 Android 기능을 추가해줘.” → 파일 소유권을 분리할 수 있을 때 Worker 병렬.
- “검증해줘” 또는 `$verify`.
- “휴대폰에서 실행해줘” 또는 `$expo-start`.
- “폰에 설치할 APK를 준비해줘” 또는 `$build-apk`.
- “릴리스 노트만 준비해줘. 게시하지 마.” 또는 `$release`.
- “커밋 메시지만 제안해줘”와 “이번 변경을 커밋해줘”는 다릅니다. `$commit`은 push를 포함하지 않습니다.

## 파일과 스킬

| 파일 | 역할 |
| --- | --- |
| AGENTS.md | Manager 조율·UI/학습 규칙·버전·Git 정책 |
| .codex/config.toml | 프로젝트 동시 실행 설정 |
| .codex/agents/explorer.toml | 읽기 중심 조사자 |
| .codex/agents/worker.toml | 지정 파일 구현자 |
| .codex/agents/reviewer.toml | 독립 검증자 |
| .agents/skills/verify/SKILL.md | 범위에 맞는 검사; lint 자동 설치 방지 |
| .agents/skills/expo-start/SKILL.md | Windows Expo Go 실행·QR/LAN/tunnel |
| .agents/skills/build-apk/SKILL.md | 실제 설정에 맞춘 EAS APK 준비 |
| .agents/skills/release/SKILL.md | 버전·검증·산출물·릴리스 노트 준비 |
| .agents/skills/commit/SKILL.md | 명시 요청에 한정한 커밋 |
| scripts/manage-version.cjs | 버전 일치 검사·미리보기·명시 적용 |
| scripts/test-manage-version.cjs | 임시 폴더에서 버전 적용·오류 복원 검증 |
| CHANGELOG.md | 앱 변경 이력과 미배포 개발 도구 변경 |

Skills는 `name`, `description`이 있는 SKILL.md로 구성됩니다. `/skills` 또는 `$이름`으로 호출하거나 설명에 맞는 자연어 요청으로 선택됩니다.
상세 절차는 해당 스킬을 선택할 때만 읽으므로 매 대화에 다섯 절차 전체를 넣지 않습니다.

## 버전 관리

```powershell
node scripts/manage-version.cjs check
node scripts/manage-version.cjs patch --reason "완료 처리 오류 수정"
# 사용자 체감 앱 변경 완료 및 Reviewer PASS 후, 이번 작업에서 아직 증가하지 않았을 때만 실행
node scripts/manage-version.cjs patch --reason "완료 처리 오류 수정" --apply
```

실제 앱 동작/UI/UX/기능에 사용자 체감 변화가 완료되고 Reviewer PASS가 난 경우에만 PATCH/MINOR를 판단합니다.
새 사용자 기능은 `minor`, 작은 사용자 체감 수정은 `patch` 대상이며 `major`는 도구가 거부합니다.
하나의 사용자 요청 또는 하나의 논리적인 작업 묶음에서 버전은 **최대 한 번**만 증가시킵니다.
작업 도중 여러 수정·Reviewer 재작업·재검증이 있어도 다시 올리지 않습니다. 같은 작업을 후속 메시지로 이어가도 동일합니다.
Manager는 시작 버전과 이미 증가했는지를 기존 보고·CHANGELOG에서 확인하며, 증가 후 재작업은 같은 버전의 CHANGELOG 항목을 보완합니다.
기본은 미리보기이며 세 JSON 버전과 CHANGELOG를 함께 갱신합니다. 전역/프로젝트 모델 설정은 이 도구와 무관합니다.
단순 조사, 문서 수정, Codex 설정 변경, 테스트만 수행한 경우 앱 버전을 증가시키지 않습니다. 사용자 체감 변화가 없는 내부 정리도 증가 사유가 아닙니다.
필요한 기록만 Unreleased에 남깁니다. 이 제한은 Manager의 작업 절차이며 기존 도구에 요청 식별·중복 적용 차단 기능을 새로 추가한 것은 아닙니다.
자동 버전 관리는 백그라운드 데몬이나 Git hook이 아닙니다.
Android versionCode는 현재 없고 임의로 추가하지 않았습니다. 향후 빌드 시 EAS remote/local 관리 방식을 먼저 확인합니다.

## 현재 빌드 준비 상태

eas.json, android 폴더, android.package, EAS projectId가 없습니다. 이번 작업에서 생성하지 않습니다.
현재 `npm run android`는 개발 서버 실행이며 APK 빌드가 아닙니다.
Expo Go는 공용 개발 앱, Development Build는 expo-dev-client 포함 개발 앱, preview APK는 직접 설치 가능한 별도 앱입니다.
독립 설치가 목적이면 EAS internal distribution의 APK 프로필이 우선입니다. AAB는 Play Store 제출용입니다.
계정·프로젝트·서명·소스 업로드 권한이 준비되어야 실제 클라우드 빌드가 가능합니다.
Windows에서 EAS `--local`은 공식 지원 경로가 아닙니다. `expo run:android`는 네이티브 폴더를 만들 수 있으므로 단순 실행 스킬에서 사용하지 않습니다.

## 제한과 안전

AGENTS/Skills는 실행 지침이며 Git 자체를 잠그는 보안 경계는 아닙니다. 이번 구성에 Git hook, 자동 게시, 스케줄러는 없습니다.
commit/push/tag/Release와 원격 변경은 각각 사용자의 명시 허가 범위에서만 Manager가 합니다.
기존 staged/unstaged 변경은 보존합니다. 이번 구성을 이유로 이전 앱 변경 전체를 커밋 대상으로 선택하지 않습니다.
Reviewer PASS는 검토한 코드와 검증 범위에 대한 결과입니다. 실기기·서명 APK 설치 미검증은 별도로 보고합니다.

## 공식 근거

- Custom agents/상한/권한 상속: https://developers.openai.com/codex/multi-agent
- 프로젝트 스킬 경로/호출: https://developers.openai.com/codex/skills
- 프로젝트 설정: https://developers.openai.com/codex/config-reference
- Expo SDK57: https://docs.expo.dev/versions/v57.0.0/
- APK: https://docs.expo.dev/build-reference/apk/
- Windows 로컬 EAS 제한: https://docs.expo.dev/build-reference/local-builds/

문서는 바뀔 수 있으므로 설정 확장 때 설치된 CLI의 실제 파서와 기능도 확인합니다. `max_threads` 같은 과거 예제를 그대로 복사하지 않습니다.

## 구축 검증 결과

- 두 CLI의 `app-server --stdio --strict-config`에 공식 `config/read` 요청: 프로젝트 설정 활성화 및 자식 상한 3 확인.
- 두 CLI의 `skills/list`: 다섯 프로젝트 스킬 모두 활성, 로딩 오류 0.
- Python 3.11 내장 tomllib: 프로젝트/역할 TOML 네 파일 파싱 성공.
- skill-creator의 보조 quick_validate.py는 기존 PyYAML 미설치로 실행하지 못함. 새 패키지는 설치하지 않고 Codex 실제 스킬 로딩으로 검증.
- 별도 Explorer 호출·응답 성공. 별도 Reviewer 호출 → 버전 도구 부분 쓰기 오류 FAIL → 담당 Manager 수정 → 동일 Reviewer 재검증 PASS.
- 버전 도구 테스트: 미리보기, PATCH/MINOR, MAJOR 거부, 설정 불일치, 빌드번호/다른 의존성 버전 보존, 동시 수정 거부, 부분 쓰기·복원 실패 처리 통과.
- 이 세션의 생성 도구에는 역할 선택 인자가 없어 역할 파일 지침을 메시지로 전달하는 대체 경로로 smoke test(최소 동작 확인)를 수행함.
- 실제 Android APK 빌드나 설치는 이번 설정 작업의 검증 범위가 아님. 앱 버전 0.1.0 유지, Git commit/push/tag/Release 미실행.
