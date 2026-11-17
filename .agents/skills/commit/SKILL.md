---
name: commit
description: Safely commit selected changes when explicitly requested or invoked by qa-sync for verified QA work.
---

# Commit

Standalone commit requires the user's explicit request. QA branch auto-commits may be invoked by Manager under the standing `qa-sync` policy, never on `master`.

1. Read `git status --short`, `git diff` and `git diff --cached`.
2. Compare the before/after state and identify only task-owned file changes. If a file mixes unrelated user edits, stop rather than staging it wholesale.
3. For automatic QA commits, require `qa/X.Y.Z`, consistent app/package/lock version, successful required verification and appropriate Reviewer verdict. Follow `qa-sync` for push.
4. Reject auto-commit if pre-existing staged entries exist. Do not modify the user's index, stash, reset, clean or use `git add .` / `git add -A`.
5. Stage **only explicitly enumerated task paths** using `git add -- <paths>`. Review `git diff --cached --name-status` and `git diff --cached` for scope, secrets and build artifacts.
6. Write a concise commit message and commit; report SHA and message. For Korean text in a shell, use a UTF-8 temporary message file via `git commit --file <path>`.

Standalone commit does not imply push. Only `qa-sync` authorizes automatic QA push. Never automatically build an APK, create QA tags, publish, or merge.
