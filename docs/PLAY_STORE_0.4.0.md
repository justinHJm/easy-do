# easy-do v0.4.0 Google Play 출시 준비

2026년 11월 11일 기준으로 소스와 공식 문서를 확인했다. 아래 스토어 문구와 이미지는 제출 전에 검토할 초안이다.

## Android 빌드 및 서명

| 항목 | 현재 설정과 확인할 내용 |
| --- | --- |
| 표시 버전 | 앱 설정과 패키지·잠금 파일에서 `0.4.0`을 사용한다. |
| 대상 API | Expo SDK 57 및 설치된 React Native 0.86.3의 Android 카탈로그는 compile/target API 36이다. Google Play 신규 휴대전화 앱은 API 36 이상이 필요하다. 최종 AAB의 매니페스트에서 대상 API를 다시 확인한다. [Google Play 대상 API](https://support.google.com/googleplay/android-developer/answer/11926878) |
| 패키지 ID | Play용 `com.codeceba.easydo`, 내부 QA용 `com.justinhjm.easydo.qa`. Play Console과 최종 AAB에서 동일한 정식 ID를 확인한다. |
| 번들 | 기존 EAS `production` 프로필이 `app-bundle`을 지정한다. 승인 후 이 프로필로 서명된 AAB를 만들고, Play Console에서 패키지·버전·16 KB 호환성 검사를 확인한다. [Android 16 KB 호환성](https://developer.android.com/guide/practices/page-sizes) |
| versionCode | EAS 원격 버전 관리와 정식 프로필의 `autoIncrement: true`를 사용한다. 첫 업로드 전에 EAS 값과 Play Console에 사용한 최고 코드를 조회한다. [Expo 앱 버전 관리](https://docs.expo.dev/build-reference/app-versions/) |
| 서명 | EAS는 업로드 키로 AAB에 서명한다. Play App Signing에서 사용자 배포 키를 관리한다. 기존 직접 배포판을 Play판으로 덮어써야 하는 경우, 배포판 인증서와 Play 배포 인증서가 맞는지 키 선택 전에 확인한다. QA APK는 별도 ID 및 디버그 서명을 사용한다. [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756) |

## 개인정보와 Data safety

- 앱에서 작성한 할 일, 루틴, 완료 이력, 프로필과 설정은 AsyncStorage에 저장된다. 소스에서는 이 내용을 앱 서버로 보내는 경로를 찾지 못했다.
- Android 자동 백업 및 기기 이전은 운영체제 설정을 따른다. 앱과 웹 방침 소스에 이 동작을 반영했다. 공개 URL의 HTTP 200 응답은 확인했으며, 제출 전 업데이트된 문구가 공개 페이지에 반영됐는지 확인한다. [개인정보처리방침](https://justinhjm.github.io/easy-do/privacy.html) · [Android 자동 백업](https://developer.android.com/identity/data/autobackup)
- 의견 보내기는 외부 Google Forms로 이동한다. 양식의 이메일 수집 여부, 질문, 보관 기간과 응답 접근 권한은 계정에서 확인한다. 앱 외부 양식과 최종 AAB에 포함된 SDK의 동작을 확인한 후 Data safety 답변을 확정한다. 데이터 수집이 없는 앱도 공개 트랙 제출 시 양식과 개인정보처리방침 링크가 필요하다. [Data safety 안내](https://support.google.com/googleplay/android-developer/answer/10787469)
- 최종 AAB에서 권한 목록을 확인한다. 앱에서 사용하지 않는 외부 저장소 읽기·쓰기와 화면 위에 표시 권한은 Expo 설정에서 차단했다.

## 스토어 등록 초안

- 앱 이름은 **easy-do**.
- 짧은 설명은 **오늘 할 일과 반복 루틴을 정리하고, 홈 화면 위젯으로 바로 확인하세요.**
- 상세 설명은 **easy-do는 작은 할 일을 가볍게 정리하는 앱입니다. 우선순위와 기한을 정하고, 반복 루틴은 회차별로 완료할 수 있어요. 최근 7일과 이번 주 통계에서 흐름을 확인하고, 오늘 Todo와 전체 Todo를 Android 홈 화면 위젯에서 확인하세요. 할 일과 설정은 기기에 저장됩니다.**
- [스토어 아이콘](./play-store/icon.png)은 512×512 RGBA PNG, [기능 그래픽](./play-store/feature-graphic.png)은 1024×500 RGB PNG다. 기존 캐릭터를 사용했다. [Google Play 이미지 규격](https://support.google.com/googleplay/android-developer/answer/9866151)
- 휴대전화 스크린샷은 실제 빌드에서 예시 할 일로 촬영한다. 홈과 통계를 필수 컷으로, Android 위젯을 추가 컷으로 잡는다. PNG 또는 JPEG, 최소 2장, 각 변 320~3840px 및 최대 변 길이는 최소 변 길이의 2배 이하로 준비한다.

## 기기 QA 및 제출 전 확인

- 정식 서명으로 설치와 업데이트를 확인하고, 기존 할 일·완료 이력·설정이 유지되는지 본다. QA 패키지는 위젯 동작과 화면 QA에 사용한다.
- 좁은 화면, 큰 글자, 긴 루틴 이름, 루틴 4개 이상에서 통계와 팝오버가 잘리지 않는지 확인한다. 설명은 짧게 누르기, 다시 누르기, 바깥 누르기, 길게 누른 뒤 떼기를 검사한다.
- 앱 실행과 복귀, 연속 완료와 취소, 당일 마지막 완료, 모션 줄이기, 캐릭터 설정 OFF에서 반응을 검사한다. 두 Android 위젯과 앱의 완료·취소 동기화는 기기에서 확인한다.
- 제스처와 3버튼 모드에서 하단 탭 터치와 시스템 안전 영역을 확인한다. Expo Router SDK 57 NativeTabs의 공개 속성에 탭 높이 조절이 없어 화면의 하단 콘텐츠 여백을 8dp 줄였다. [Expo NativeTabs API](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/)
- 2023년 11월 13일 이후 생성된 개인 개발자 계정에는 비공개 테스트에 최소 12명이 14일 연속 참여한 뒤 프로덕션 액세스를 신청하는 절차가 적용된다. 계정 유형과 생성일은 Play Console에서 확인한다. [Google Play 비공개 테스트 요건](https://support.google.com/googleplay/android-developer/answer/14151465)

## 캐릭터 아트

기본 눈 감기·생각·놀람 표정과 손 흔들기·응원 교대 프레임 5종을 기존 그림을 편집해 제작했다. 새 에셋은 512×512 투명 PNG이며 대응 원본과 바닥선이 같다. 수면·토닥·전체 완료에는 기존 수면·하트·점프 그림을 사용한다. 기기 QA에서 프레임 전환과 시스템 모션 줄이기 동작을 확인한다.
