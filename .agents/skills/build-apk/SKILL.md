---
name: build-apk
description: easy-do를 Android 폰에 직접 설치할 APK로 준비하거나 명시 요청에 따라 빌드한다. Expo Go 실행과 배포용 APK를 구분한다.
---

# Android APK

AGENTS.md와 SDK57 문서를 먼저 읽고 실제 app.json, eas.json, android 폴더, EAS CLI 설치·로그인 상태를 확인한다.
현재 기준은 `docs/CODEX.md`의 빌드 준비 상태다. 실행 시 최신 파일을 다시 확인한다.

공식 절차: https://docs.expo.dev/build-reference/apk/ , https://docs.expo.dev/build/setup/ , https://docs.expo.dev/build-reference/local-builds/ .
EAS CLI(Expo 클라우드 빌드 도구)는 SDK와 버전이 별개이므로 설치되어 있으면 버전을 확인한다. 없으면 필요성을 설명한 뒤 사용할 명시 버전을 확인하며 앱 dependency에 넣지 않는다.

- Expo Go: 이미 설치된 공용 앱으로 개발 코드를 실행한다. 독립 APK가 아니다.
- Development Build: expo-dev-client가 필요한 개발용 앱이다. 현재 요청이 일반 설치 APK면 이 패키지를 추가하지 않는다.
- Preview APK: Play Store 없이 직접 설치 가능하다. AAB는 Play Store 제출용이고 직접 설치 파일이 아니다.

EAS 경로를 우선한다. `android.package`, EAS projectId, 서명 키, eas.json이 없으면 필요한 구성을 먼저 설명한다.
단순 구성/절차 요청으로 계정·프로젝트 생성, 소스 업로드, 원격 빌드를 실행하지 않는다. 빌드 요청 범위와 서비스 사용 허가가 확보됐을 때 진행한다.
기존 eas.json이 있으면 병합한다. 예시 프로필은 `build.preview.distribution = "internal"`, `build.preview.android.buildType = "apk"`다.
준비된 CLI에서 `eas build --platform android --profile preview`를 사용한다. 실행 전에 사용자에게 소스가 EAS로 업로드됨을 알린다.
앱 식별자와 키를 임의로 기존 것과 바꾸지 않는다. 키·비밀번호를 Git이나 보고서에 넣지 않는다.
Windows의 `eas build --local`은 공식 지원 경로가 아니다. Android Studio/SDK 기반 로컬 빌드를 사용하려면 별도 요청 범위와 도구 준비를 확인한다.
`expo run:android`는 android 폴더가 없으면 prebuild를 실행한다. 설치 APK 준비만을 위해 네이티브 폴더를 임의 생성하거나 `prebuild --clean`을 실행하지 않는다.
버전·versionCode는 현재 EAS의 local/remote 소스를 확인한 뒤 AGENTS.md 정책을 따른다.
완료 시 실제 빌드 상태, APK 경로/다운로드 주소, 설치 방법과 미검증 항목을 보고한다. 내부 배포 링크의 공개 범위를 확인한다.
tag, push, Release, Play Store 제출은 실행하지 않는다.
