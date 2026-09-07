---
name: release
description: easy-do 버전·CHANGELOG·검증·APK/AAB 준비 상태를 확인하고 릴리스 노트를 준비한다. 실제 게시와 tag/push는 별도 명시 요청이 필요하다.
---

# 릴리스 준비

AGENTS.md의 버전/Git 정책을 따른다. 기본 동작은 로컬 준비이며 release 스킬 이름 자체는 게시 승인이 아니다.
`git status --short`, 이번 작업 범위, `node scripts/manage-version.cjs check`, CHANGELOG를 확인한다.
하나의 사용자 요청 또는 하나의 논리적인 작업 묶음에서는 버전을 최대 한 번만 증가시킨다. 시작 버전·기존 작업 보고·CHANGELOG로 증가 여부를 확인한다.
여러 수정이나 Reviewer 재작업·재검증, 같은 작업의 후속 메시지가 있어도 이미 증가했다면 버전은 유지하고 같은 CHANGELOG 항목만 보완한다.
아직 증가하지 않았더라도 실제 앱 동작/UI/UX/기능의 사용자 체감 변화가 완료되고 Reviewer PASS가 난 경우에만 Manager가 PATCH/MINOR를 판단한다.
단순 조사, 문서 수정, Codex 설정 변경, 테스트만 수행한 경우에는 버전을 올리지 않는다. 릴리스 노트 준비 자체도 증가 사유가 아니다. 1.0.0은 사용자 승인 없이는 금지한다.
verify 스킬 절차에서 변경에 필요한 검증과 Reviewer 결과를 확인한다.
APK/AAB는 build-apk 스킬 절차로 준비 가능 여부만 확인한다. 준비 요청만으로 빌드·업로드·서명 키 생성은 하지 않는다.
릴리스 노트 초안에 버전, 사용자 변화, 수정점, 검증 결과, 알려진 제한, 실제 존재하는 산출물만 넣는다. 원하면 `docs/releases/<version>.md`로 저장한다.
미커밋 파일이 있으면 아직 Git 릴리스 대상이 확정되지 않았음을 보고한다. 존재하지 않는 commit/tag/배포 파일을 주장하지 않는다.
실제 commit, push, tag, GitHub Release는 사용자가 각각 허용한 범위에서만 Manager가 진행한다. 커밋 요청을 원격 게시 승인으로 해석하지 않는다.
