---
name: expo-start
description: Windows에서 기존 easy-do Metro를 재사용하거나 LAN/Expo Go로 빠르게 실행하고 QR을 즉시 표시한다. 검증은 하지 않는다.
---

# 빠른 실행

전체 탐색, verify/typecheck/lint/test/Git 검사, Reviewer, 버전/CHANGELOG 변경, 문서 재조회, 설치를 실행 전에 하지 않는다.

1. 알려진 살아 있는 프로젝트 터미널 세션이 있으면 `c`로 QR을 다시 표시한다. 캐시 삭제가 아니다.
2. 세션을 모를 때만 알려진 포트(기본 8081)와 프로세스를 한 번 확인한다. 포트만으로 같은 앱이라고 단정하지 않는다. 필요하면 `/`에 `expo-platform: android`, `Accept: application/expo+json`을 보내 `extra.expoGo.developer.projectRoot`를 확인한다. 다른/불명확한 서버는 종료하거나 중복 실행하지 않는다.
3. 서버가 없으면 루트에서 `npx.cmd expo start --lan --go`를 대화형 터미널(`tty: true`)로 실행한다. 로컬 Expo가 없으면 설치하지 말고 보고한다.
4. 짧게 출력을 확인해 QR/실제 exp:// LAN 주소가 나오면 바로 전달한다. 번들 완료를 기다리지 않는다. 실행 프로세스에 CI=1/EXPO_NO_QR_CODE=1을 설정하지 않는다. 상속되어 QR을 가리면 그 프로세스에서만 해제한다.
5. 사이드바에 QR이 안 보이면 `node .agents/skills/expo-start/scripts/render-qr.cjs '실제 exp://주소'`로 만든 PNG를 표시한다. 실패하면 설치/탐색을 반복하지 말고 터미널 QR과 주소를 전달한다. localhost manifest의 debuggerHost를 휴대폰 주소로 쓰지 않는다. 이전 QR도 실제 URL 확인 후 사용한다.

PC와 휴대폰은 같은 Wi-Fi. tunnel은 **사용자 명시 요청 때만** --lan 대신 --tunnel을 쓴다. ngrok 설치 여부도 그때만 확인한다. 캐시 삭제/--clear는 기본 동작이 아니다.
서버는 유지하고 사용자 종료 요청 때만 끈다. 버전/패키지 문제나 연결 실패 때만 해당 부분을 좁게 조사한다.
측정 요청 때는 QR 확인까지 시간(도구 대기 포함 여부)과 재사용/새 시작을 구분한다. 미측정 속도를 추정하지 않는다.
