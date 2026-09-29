---
name: handoff
description: 로컬 PC와 Codespace 등 다른 개발환경으로 작업을 넘기기 전에 현재 WIP를 docs/CURRENT_WORK.md에 정리하고 Git 동기화 위험을 검사한다. commit/push/pull은 자동 수행하지 않는다.
---

# 작업 인계

사용자가 `handoff`, `인계`, `외부에서 이어서`, `Codespace로 이동 준비`, `PC에서 이어서 할 수 있게 정리`처럼 환경 전환을 요청했을 때 사용한다.

## 절차

1. `AGENTS.md`와 `docs/PROJECT.md`의 관련 규칙만 확인한다.
2. `git branch --show-current`, `git status --short`, 필요한 범위의 `git diff`를 확인한다.
3. 현재 대화에서 한 작업과 실제 코드 상태를 대조한다. 추측으로 완료/검증을 기록하지 않는다.
4. `docs/CURRENT_WORK.md`를 현재 WIP 기준으로 갱신한다.
5. 현재 작업이 AGENTS.md의 장기 기록 대상에도 해당하면 `docs/DEVLOG_PENDING.md`에 중복되지 않는 짧은 원재료 메모만 남긴다.
6. `npm run handoff`를 실행해 upstream, ahead/behind, 미커밋 변경, CURRENT_WORK 상태를 확인한다.
7. 사용자가 다음 환경에서 무엇을 해야 하는지 3~6줄로 보고한다.

## CURRENT_WORK 작성 규칙

다음 항목을 실제 필요한 범위만 채운다.

- 현재 작업과 상태
- 목표
- 이번 세션에서 완료한 것
- 변경한 주요 파일
- 다음 세션에도 필요한 구현 결정
- 실제 수행한 검증과 미검증 항목
- 남은 작업
- 같은 실패를 반복하지 않기 위해 필요한 폐기 접근/원인
- 다음 세션이 시작할 정확한 지점
- branch / source environment / 갱신 시점

대화 전체를 복사하지 않는다. 다음 세션이 코드와 함께 읽으면 작업을 재구성할 수 있는 최소 정보만 남긴다.

## 보안

아래 값은 `CURRENT_WORK.md`, `DEVLOG_PENDING.md`, 커밋 메시지에 기록하지 않는다.

- API key, token, password, 쿠키
- `.env` 실제 값
- keystore/서명키와 비밀번호
- 인증 JSON의 비밀 필드
- 개인정보가 포함된 테스트 데이터

파일명이나 "비밀값이 필요함" 같은 비민감 사실만 필요한 경우 기록한다.

## Git 안전 규칙

이 스킬 실행 자체는 commit/push/pull/stash/reset 권한이 아니다.
사용자 명시 요청 없이는 `git add`, `commit`, `push`, `pull`, `reset`, `stash`, branch 삭제를 수행하지 않는다.
기존 staged 변경도 임의로 건드리지 않는다.

handoff 결과에 미커밋 변경이 있으면 "다른 환경에는 아직 전달되지 않음"을 명확히 보고한다. ahead가 있으면 push 필요 가능성을, behind가 있으면 최신 원격 변경이 있음을 보고하되 자동 조치하지 않는다.

## 작업 완료 시

이어받을 WIP가 완전히 끝났고 장기 기록이 필요한 내용도 기존 체계에 반영됐다면 `docs/CURRENT_WORK.md`를 `상태: idle`과 최소 메타만 남도록 정리할 수 있다. 단, 작업 완료를 추측하지 않는다.
