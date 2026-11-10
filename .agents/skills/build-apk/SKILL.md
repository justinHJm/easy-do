---
name: build-apk
description: Prepare or run the configured EAS preview APK workflow for direct Android installation. Do not use for Play Store AAB work.
---

# Build preview APK

Use this Skill only for an explicitly requested APK preparation or build. Expo Go is not an installable APK.

1. Read `app.json` and `eas.json`; confirm `build.preview.distribution` is `internal` and `build.preview.android.buildType` is `apk`.
2. Confirm the requested source state and app version. Do not change app identifiers, signing, credentials, versionCode, or `eas.json` as part of preparation.
3. Run the configured EAS CLI version:

   ```powershell
   npx.cmd --yes eas-cli@23.2.0 build --platform android --profile preview
   ```

4. Tell the user that EAS uploads the source for this build. Report the build URL or downloaded APK only after it exists; otherwise report the actual failure or pending state.

Do not use `eas build --local`, `expo prebuild`, or `expo run:android` for this workflow. Do not create a Play Store AAB, release, tag, or publish action.
