---
name: version-start
description: Start an explicitly requested development version X.Y.Z on qa/X.Y.Z, safely preserving previous QA work.
---

# Version transition — Manager only

Trigger only when the user explicitly requests **starting development** on a particular version (for example, "0.4.2 개발 시작"). A version mentioned in conversation is not sufficient.

1. Fetch remote refs, inspect `git status --short`, `git diff`, `git diff --cached`, `git branch -vv` and current `app.json`, `package.json`, `package-lock.json`. Confirm the requested version is newer and exact. Reject unsafe uncommitted/staged changes; never stash, discard or overwrite user work.
2. Determine whether the previous QA branch has been integrated into `origin/master`. Check commit ancestry and actual changes (squash/cherry-pick may require diff review).
3. If integrated, base the next QA branch on current `origin/master`. Otherwise, base on the previous QA branch after verifying all intended work is included. Do not start from stale `master` if unmerged QA changes would be omitted.
4. Reuse `qa/X.Y.Z` only when it already exists with compatible ancestry; otherwise `git switch -c qa/X.Y.Z <verified-base>`. Stop on divergence. Do not rename/delete prior QA branches or edit historic `qa/vX.Y.Z[-N]` tags.
5. Use the existing `scripts/manage-version.cjs` to preview a consecutive `patch` or `minor` increase, then `--apply` after verifying that it matches the user's target version. Unsupported jumps/major changes require a separate plan. Update app.json, package.json, package-lock.json and CHANGELOG only; do not change versionCode, app ID or signing.
6. Run `node scripts/manage-version.cjs check`, `node scripts/test-manage-version.cjs` and the `verify` Skill appropriate to the change. If verification fails, retain edits locally and report rather than pushing.
7. After PASS, invoke `qa-sync` for a targeted version-transition commit and push to the new QA branch.
8. Do not run GitHub Actions QA build, create a QA tag, publish, open/merge a PR or change master. Report base choice, version, branch, commit/push result and remaining validation.

For a fresh version, the first successful manual build is normally `easy-do-qa-vX.Y.Z.apk`, subject to historical tags.
