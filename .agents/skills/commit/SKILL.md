---
name: commit
description: Safely create a requested easy-do Git commit from the intended current changes. Do not use for push, amend, or rebase.
---

# Commit

Use only when the user explicitly requests a commit.

1. Read `git status --short`, `git diff`, and `git diff --cached`.
2. Confirm the intended files and leave unrelated existing changes untouched.
3. Stage only the confirmed files, then inspect `git diff --cached`.
4. Write a concise commit message that matches the staged change and run `git commit`.
5. Report the resulting commit hash and message.

Use a UTF-8 temporary message file with `git commit --file <path>` when Korean text would be passed through the shell. This Skill does not push, amend, rebase, tag, or create a release.
