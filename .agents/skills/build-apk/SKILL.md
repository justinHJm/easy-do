---
name: build-apk
description: easy-do를 Android 폰에 직접 설치할 APK로 준비하거나 명시 요청에 따라 빌드한다. Expo Go 실행과 배포용 APK를 구분한다.
---

# Android APK

AGENTS.md와 SDK57 문서를 먼저 읽고 실제 app.json, eas.json, android 폴더, EAS CLI 설치·로그인 상태를 확인한다.
현재 기준은 `docs/CODEX.md`의 빌드 준비 상태다. 실행 시 최신 파일을 다시 확인한다.

## APK 이름과 아이콘

- 전달할 APK 파일명은 `easy-do v<현재 버전>.apk`로 한다. 버전은 해당 빌드의 앱 버전에서 읽는다. 예: `easy-do v0.1.1.apk`. EAS 다운로드 URL의 자동 파일명과 구분하고, 로컬에 다운로드할 때 이 이름으로 저장한다.
- 앱 아이콘은 `assets/characters/easydo-base.png`의 기존 캐릭터를 사용한다. 현재 원본은 Android adaptive icon(기기 모양에 맞춰 잘리는 아이콘)의 안전 영역보다 넓으므로 `expo.icon`만 지정하는 기본 아이콘 방식을 사용한다. Expo 예제의 adaptiveIcon 설정은 제거하여 예제 그림이 남거나 캐릭터가 잘리지 않게 한다. 나중에 adaptive icon을 적용할 때는 충분한 여백이 있는 별도 아이콘 에셋을 먼저 준비한다.
- 아이콘용 가공이 필요하면 원본 캐릭터 에셋을 보존한다. 아이콘 변경은 새 APK를 빌드해야 반영되며 이미 배포한 APK에는 소급 적용되지 않는다.

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
