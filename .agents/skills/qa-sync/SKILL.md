---
name: qa-sync
description: Auto-commit and push verified task-owned edits on the matching qa/X.Y.Z branch; never build APKs or modify master.
---

# QA sync — Manager only

Standing authorization: after implementation and verification, synchronize only task-owned changes to `qa/X.Y.Z`. Worker and Reviewer never perform Git writes. This is not triggered by analysis, planning or incomplete work.

1. **Baseline**: record starting `git status --short`, `git diff`, `git diff --cached` and task-owned paths before editing. Run the `verify` Skill at the proper risk level and Reviewer when required. Any FAIL/BLOCKED, unverified destructive change or unknown file ownership blocks sync.
2. **Target**: require the current branch to be `qa/X.Y.Z` and the version in `app.json`, `package.json`, root `package-lock.json` and `packages[""]` to equal X.Y.Z. Never auto-commit or push from `master`. Normal sync must not create new branches; version transitions use `version-start`.
3. **Local safety**: inspect current status including untracked files and cached diff. If pre-existing staged changes exist, stop without unstaging. If a task file includes pre-existing user edits, stop for review. No `git add .`, `git add -A`, stash, reset, clean, amend or force operations.
4. **Remote safety**: `git fetch origin`; inspect `origin/qa/X.Y.Z`. If it exists, require `git merge-base --is-ancestor origin/qa/X.Y.Z HEAD`; otherwise stop without merge, rebase or force push. If it does not exist, validate expected ancestry and ensure remote branch was not concurrently created.
5. **Stage**: follow `commit` Skill with exact paths. Recheck staged diff, surprising deletions and credentials. If no task-owned changes exist, do not make an empty commit.
6. **Commit and push**: create one normal commit, then `git push -u origin HEAD:refs/heads/qa/X.Y.Z` (without force). If remote advanced meanwhile, stop on rejected push and report instead of rewriting history.
7. **Report**: branch, commit SHA, push outcome, verification status and remaining local changes. State **QA APK not built**. Do not trigger Actions, tag, PR, release or master merge.

An explicit QA APK request is a separate `build-apk` procedure.
