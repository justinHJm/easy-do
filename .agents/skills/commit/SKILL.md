---
name: commit
description: easy-do diff를 검토하고 커밋 메시지를 준비한다. 사용자가 실제 커밋을 명시 요청했을 때만 Manager가 커밋하며 push는 포함하지 않는다.
---

# 커밋 준비와 명시 요청 처리

AGENTS.md를 따르고 현재 요청이 메시지 제안/검토인지 실제 "커밋해"인지 구분한다. 스킬 선택만으로 commit 권한을 추정하지 않는다.
`git status --short`, `git diff`, `git diff --cached`를 읽고 이번 작업 파일과 기존 staged 변경을 구별한다.
변경 내용과 맞는 간결한 커밋 제목·필요한 본문을 준비한다. 검증·Reviewer 상태와 버전/CHANGELOG 일치를 확인한다.
명시 커밋 요청이 없으면 메시지 초안과 포함할 파일만 보고하고 Git 인덱스를 바꾸지 않는다.
실제 요청이 있을 때도 기존 staged 파일을 임의로 unstage/reset하지 않는다. 범위를 특정할 수 없고 다른 변경이 섞여 있으면 커밋 직전에 구체적인 범위를 확인한다.
`git add .` 대신 확인된 파일만 stage한다. `git diff --cached`로 최종 내용을 확인하고 요청된 범위만 commit한다.
여러 줄 메시지는 UTF-8 임시 파일로 작성해 `git commit --file <file>`을 사용한다. shell 문자열 보간으로 사용자 텍스트를 실행하지 않는다.
commit은 검증 실패를 숨기는 수단이 아니다. commit 때문에 버전을 한 번 더 올리지 않는다.
push, tag, Release, amend, reset, 원격 변경, force push는 별도 요청 없이는 하지 않는다.
완료 시 실제 commit 결과와 남은 변경을 보고한다. 이 스킬을 Worker/Reviewer에게 Git 쓰기 권한을 주는 용도로 사용하지 않는다.
