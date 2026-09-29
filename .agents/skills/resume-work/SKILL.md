---
name: resume-work
description: 다른 PC/Codespace/Codex 세션에서 넘겨받은 easy-do 작업을 docs/CURRENT_WORK.md와 실제 Git/코드 상태로 복원한다. 문서보다 실제 코드와 Git을 우선한다.
---

# 작업 이어받기

사용자가 `이어서 해`, `인계받아`, `resume-work`, `CURRENT_WORK 보고 계속`, `PC/Codespace에서 계속`처럼 이전 환경의 작업을 재개하려 할 때 사용한다.

## 절차

1. `AGENTS.md`, `docs/PROJECT.md`, `docs/CURRENT_WORK.md`를 확인한다.
2. `npm run handoff`를 실행해 현재 branch, upstream, ahead/behind, 미커밋 상태를 확인한다.
3. `CURRENT_WORK.md`에 적힌 주요 파일과 실제 파일/최근 diff 또는 관련 commit을 필요한 범위만 확인한다.
4. 문서와 실제 상태가 다르면 실제 코드와 Git 상태를 우선하고 차이를 짧게 보고한다.
5. 상태가 `idle`이면 이어받을 WIP가 없다고 보고하고 새 작업 지시를 기다린다.
6. 인계 상태가 정상이고 사용자가 실제 작업 재개까지 요청했다면 `남은 작업`과 `다음 세션 시작`을 기준으로 이어서 진행한다.

## 원격 차이가 있을 때

- `behind > 0`이고 작업 트리가 clean이어도 자동 pull하지 않는다. 사용자가 최신 원격 변경을 가져오라고 명시하면 `git pull --ff-only`만 사용한다.
- `ahead > 0 && behind > 0`이면 작업을 진행하지 말고 분기 상태와 충돌 가능성을 먼저 보고한다.
- 미커밋 변경과 원격 변경이 함께 있으면 자동 stash/reset/pull하지 않는다.
- branch가 인계 메타와 다르면 의도된 전환인지 먼저 확인한다.

## CURRENT_WORK 신뢰 규칙

`CURRENT_WORK.md`는 인계 힌트이지 진실의 원천이 아니다.
우선순위는 다음과 같다.

1. 실제 작업 트리와 파일 내용
2. Git branch/commit/diff
3. 테스트·검증의 실제 출력
4. `CURRENT_WORK.md`
5. 이전 대화의 기억이나 추정

문서에 PASS라고 적혀 있어도 현재 변경 이후의 증거가 아니면 재사용 가능 여부를 판단한다. 실행하지 않은 검사를 PASS로 쓰지 않는다.

## 보고

작업 시작 전에 다음만 짧게 정리한다.

- 인계받은 현재 작업
- Git 동기화 상태
- 완료/남은 작업
- 바로 진행할 다음 단계
- 문서와 실제 상태가 달랐다면 그 차이

세션을 이어받는 것만으로 commit/push/tag/release 권한이 생기지 않는다.
