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

## 6) Apple Health (iOS only) + Internal TestFlight

This project now includes Apple Health workout write support (`HealthKit`) for iOS builds.
It does not work in Expo Go.

Build and submit flow:

```bash
pnpm --filter @company/mobile prebuild
pnpm dlx eas-cli build --platform ios --profile production
pnpm dlx eas-cli submit --platform ios --latest
```

After upload, add the build to an Internal Testing group in App Store Connect.

Notes:

- Health permission strings are configured by the Expo plugin in `app.config.ts`.
- A Development Build or TestFlight build is required to test HealthKit.

## 7) Manual Session Registration (In App)

- Open `履歴とカレンダー`.
- Tap `手動で記録を追加`.
- Set start time and interval reps (`R1` to `R8`) and save.
- The saved item is included in daily/weekly stats and calendar marks immediately.

## 8) Generate App Icon with Gemini (Nano Banana Pro 3.0)

This repository includes an icon generation script using Gemini image generation.

Setup environment variable:

```bash
export GEMINI_API_KEY="<your-api-key>"
```

Generate icon candidate (uses `gemini-3-pro-image-preview` by default):

```bash
cd apps/mobile
pnpm icon:generate
```

Optional:

- Change model: `export GEMINI_IMAGE_MODEL="gemini-3-pro-image-preview"`
- Change output path: `export ICON_OUTPUT_PATH="assets/icon.alt.png"`
- Override prompt inline: `pnpm icon:generate "your custom prompt"`

Apply generated icon to Expo assets:

```bash
cp assets/icon.generated.png assets/icon.png
cp assets/icon.generated.png assets/adaptive-icon.png
cp assets/icon.generated.png assets/splash-icon.png
sips -z 48 48 assets/icon.generated.png --out assets/favicon.png
```

## Template Notes

- Native dependencies should stay in `apps/mobile/package.json`.
- Keep version alignment across workspaces with:

```bash
pnpm versions:check
```
