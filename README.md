# Native App Template (React Native + Expo)

Company-ready monorepo template for reusable iOS and Android app projects.

## Included

- Expo app in `apps/mobile`
- Shared packages in `packages/ui` and `packages/domain`
- Agent skills in `.agents/skills`
- GitHub Actions for CI and EAS release workflows
- Template initializer script (`scripts/init-template.sh`)

## 1) Initialize After Cloning

```bash
pnpm init:template
```

Optional custom values:

```bash
bash scripts/init-template.sh myorg "My App" my-app com.myorg.myapp com.myorg.myapp
```

## 2) Install (First Time)

```bash
pnpm install
```

## 3) Daily Startup (Expo Go on iPhone)

```bash
pnpm --filter @company/mobile start --tunnel --go --clear --port 8083
```

- Keep this terminal open while using the app.
- Scan the newly displayed QR code from Expo Go each time.
- If Expo Go shows an offline tunnel error, restart this command and scan a new QR code.

## 4) Other Commands

```bash
pnpm dev
pnpm ios
pnpm android
pnpm typecheck
pnpm verify
```

## 5) iOS / Android Delivery Paths

### Path A: Manual upload via Xcode / Android Studio

```bash
pnpm --filter @company/mobile prebuild
```

Then:

- iOS: open `apps/mobile/ios` in Xcode, Archive, Upload to App Store Connect.
- Android: open `apps/mobile/android` in Android Studio, build AAB, upload to Play Console.

### Path B: CI build and submit with EAS

- `/.github/workflows/release-ios.yml`
- `/.github/workflows/release-android.yml`

Required repository secret:

- `EXPO_TOKEN`

## Template Notes

- Native dependencies should stay in `apps/mobile/package.json`.
- Keep version alignment across workspaces with:

```bash
pnpm versions:check
```
