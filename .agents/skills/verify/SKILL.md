---
name: verify
description: Select and run the minimum mechanical checks for an easy-do change based on LOW, NORMAL, or HIGH risk.
---

# Verify

Choose the lowest risk level that covers the changed area. Report commands run, results, skipped checks, and remaining verification limits. This Skill performs checks; it does not make a review verdict.

| Risk | Use for | Minimum checks |
| --- | --- | --- |
| LOW | Documentation, styling, or small isolated UI/configuration edits | Inspect the changed files; run typecheck only when TypeScript or JSX changed. |
| NORMAL | Ordinary features, screen behavior, or utility logic | Typecheck and relevant focused tests. |
| HIGH | AsyncStorage, shared state, architecture, Android/Widget, dependencies, Expo/build configuration, or material regression risk | NORMAL checks plus relevant storage tests and Android/Expo configuration checks. |

## Commands

- TypeScript: `npx.cmd tsc --noEmit`
- Todo storage, recurrence, and date behavior: `node scripts/test-todo-storage.cjs`
- Version script: `node scripts/test-manage-version.cjs`
- Version consistency and diff whitespace: `node scripts/manage-version.cjs check` and `git diff --check`
- Expo public configuration: `npx.cmd expo config --type public`
- Android export when Android configuration or native-facing code changed: `npx.cmd expo export --platform android --output-dir .expo/verify-android`

Run lint only when ESLint is already configured; do not install it during verification. An export or automated test does not prove real-device Widget behavior.
