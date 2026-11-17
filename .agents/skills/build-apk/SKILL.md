---
name: build-apk
description: Run an explicitly requested GitHub Actions QA APK or separate EAS preview APK workflow; not Play AAB.
---

# APK build — explicit request only

Do not build after automatic QA commit or push. Identify which build the user requested.

## GitHub Actions QA APK (normal easy-do QA)

1. Confirm the matching remote `qa/X.Y.Z` branch and that all intended tested changes were pushed.
2. Verify `.github/workflows/build-qa-apk.yml` remains `workflow_dispatch`-only; never add a push trigger.
3. Only after user requests QA build: `gh workflow run build-qa-apk.yml --ref qa/X.Y.Z`.
4. Report the actual Actions run URL, completion status and artifact URL if available. Never claim completion before it occurs.
5. The workflow records successful QA revisions using existing `qa/vX.Y.Z[-N]` tags. This Skill must not tag manually or merge into master.

## EAS preview APK (only if specifically requested)

1. Read app.json and eas.json. Confirm `build.preview.distribution=internal` and `build.preview.android.buildType=apk`.
2. Confirm requested source and version. Do not change app identifiers, credentials, signing, versionCode or eas.json.
3. Run `npx.cmd --yes eas-cli@23.2.0 build --platform android --profile preview`.
4. Report actual build URL/APK only after available; otherwise report genuine failure/pending status.

Do not substitute EAS preview for GitHub Actions QA without user authorization. Never build a Play Store AAB through this Skill.
