# easy-do Codex 운영 보충

`AGENTS.md`는 항상 적용되는 작업 규칙의 기준이다. 이 문서는 프로젝트에서만 필요한 Codex 파일의 위치를 안내한다.

`.codex/config.toml`에서 `agents.enabled = false`로 설정해 이 프로젝트의 하위 에이전트 도구를 비활성화한다. [OpenAI Docs의 하위 에이전트 설정](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## 프로젝트 Skills

| Skill | 사용할 때 |
| --- | --- |
| `verify` | 변경 위험도에 맞는 자동 검증이 필요할 때 |
| `expo-start` | LAN Expo Go 실행 또는 QR 표시가 필요할 때 |
| `build-apk` | 직접 설치할 APK 준비 또는 빌드 요청일 때 |
| `commit` | 사용자가 명시적으로 commit을 요청했을 때 |

Skill은 요청에 맞는 경우에만 읽는다. APK/AAB, 버전, signing, Git 게시 절차의 상세 기준은 해당 Skill과 현재 설정을 확인한 뒤 적용한다.
