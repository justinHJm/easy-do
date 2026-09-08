---
name: release
description: easy-do 버전·변경 내역·검증 증거로 릴리스 노트를 준비한다. 실제 게시 권한을 포함하지 않는다.
---

# 릴리스 준비

AGENTS의 Git/버전 정책과 docs/CODEX.md의 버전 명령을 따른다. 준비 요청만으로 버전을 올리지 않는다.
현재 Git 상태, 버전 일치, CHANGELOG와 기존 검증 증거를 확인한다. 부족한 검사만 verify 위험 등급에 따라 수행하며 Reviewer는 조건부다.
APK/AAB 준비 여부는 build-apk 참고. 준비 요청만으로 빌드·소스 업로드·서명 키 생성은 하지 않는다.
노트는 버전, 사용자 변화, 검증 결과, 알려진 제한과 실제 산출물만 포함한다. 미커밋 변경이 있으면 대상 커밋이 미확정임을 알린다.
commit/push/tag/GitHub Release는 각각 명시 요청 때만 실행한다. 존재하지 않는 commit/tag/APK를 주장하지 않는다.
