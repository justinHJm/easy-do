---
name: expo-start
description: Windows에서 easy-do의 기존 Metro를 재사용하거나 LAN으로 빠르게 실행하고 Expo Go QR을 바로 보여준다. 앱 실행 전용이며 검증은 하지 않는다.
---

# easy-do 실행

이 스킬은 실행만 한다. verify, typecheck, test, lint, git 검사, expo doctor, 패키지 설치를 실행 전에 자동 수행하지 않는다. 시작 요청만으로 Explorer/Reviewer를 호출하지 않는다.
이미 확인한 AGENTS.md·SDK 문서·package.json을 매번 다시 탐색하지 않는다. 코드/API/패키지 변경 작업일 때만 SDK 57 문서와 실제 버전을 확인한다: https://docs.expo.dev/versions/v57.0.0/

## 빠른 실행 순서

1. 대화에 살아 있는 이 프로젝트의 Expo 터미널 세션이 있으면 먼저 재사용한다. 해당 세션에 `c`를 보내 QR을 다시 출력한다. 이 명령은 Metro 캐시를 삭제하지 않는다.
2. 세션을 모를 때만 기본 포트 8081(또는 이미 알려진 포트)의 리스너와 해당 프로세스 명령줄을 한 번 확인한다. 포트 점유만으로 같은 프로젝트라고 판단하지 않는다. 필요하면 `/status` 응답과 Expo manifest의 `extra.expoGo.developer.projectRoot`를 확인한다. manifest는 `/`에 `expo-platform: android`, `Accept: application/expo+json` 헤더로 요청한다. localhost로 요청하면 `debuggerHost`도 루프백 주소일 수 있으므로 휴대폰 QR에 그대로 쓰지 않는다. 터미널의 LAN URL을 우선하며 세션을 잃었으면 현재 PC의 LAN 주소로 manifest 응답을 확인한다. 다른 프로젝트/미확인 서버는 종료하지 않으며 임의로 다른 포트에 중복 실행하지 않는다.
3. 이 프로젝트의 서버가 없다면 프로젝트 루트에서 다음 명령을 **대화형 터미널**로 실행한다.

   ```powershell
   npx.cmd expo start --lan --go
   ```

   `--lan`은 같은 네트워크 연결, `--go`는 Expo Go QR을 명시한다. VS Code PowerShell의 `.ps1` 실행 정책 문제를 피하려고 `npx.cmd`를 사용한다. 로컬 Expo가 없다고 설치를 제안하면 자동 설치하지 않고 중단해 원인을 보고한다.
4. Codex 도구에서는 `tty: true`로 실행하고 장기 실행 세션을 유지한다. 새 출력은 짧게 기다려 확인하고, QR/Metro URL이 나오면 **즉시 전달**한다. 첫 Android 번들 완료나 휴대폰 연결을 기다린 뒤 QR을 보고하지 않는다. 터미널 QR을 숨기는 `CI=1`, `EXPO_NO_QR_CODE=1`을 이 실행에 설정하지 않는다. 상속된 값 때문에 QR이 숨겨지면 실행 프로세스에서만 해제하고 전역 설정은 바꾸지 않는다.
5. 사이드바에서 터미널 QR을 사용자가 볼 수 없으면 로그에서 확인한 실제 `exp://...` URL로 아래 보조 스크립트를 한 번 실행하고 출력 PNG를 이미지로 표시한다. 주소만 보내거나 사용자가 다시 QR을 요청할 때까지 기다리지 않는다.

   ```powershell
   node .agents/skills/expo-start/scripts/render-qr.cjs '로그에서 확인한 exp://주소'
   ```

   스크립트는 이미 설치된 Expo CLI의 QR 라이브러리를 재사용한다. 실패하면 라이브러리 탐색/설치를 반복하지 말고 터미널 `c` QR과 실제 주소를 전달한다. 이전 PNG를 현재 URL 확인 없이 재사용하지 않는다.

## 연결과 종료

- 기본은 항상 LAN이다. PC와 휴대폰을 같은 Wi-Fi에 연결하고 Expo Go로 스캔하도록 짧게 안내한다.
- **사용자가 명시적으로 tunnel을 요청했을 때만** `--lan` 대신 `--tunnel`을 사용한다. LAN 실패만으로 ngrok/tunnel로 전환하거나 패키지를 설치하지 않는다.
- 정상 실행에서 `--clear`, 캐시 삭제, 저장 데이터 초기화, reset-project, prebuild, APK 빌드를 하지 않는다. 캐시 삭제는 사용자가 요청한 문제 해결 때만 별도로 판단한다.
- 서버를 켜 둔다. 시간 측정·검증이 끝났다는 이유로 종료/재시작하지 않는다. 종료는 사용자 요청 때 한다.
- 요청 시 측정은 시작 직전부터 QR 출력 확인까지 잰다. 기존 서버 재사용 시간과 새 서버 시작 시간을 구분하고, 측정하지 않은 새 시작 속도를 추정하지 않는다. 도구 대기 시간을 포함하면 그 점을 밝힌다.
