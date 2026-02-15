#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NEXT_SCOPE="${1:-company}"
NEXT_APP_NAME="${2:-Native App Template}"
NEXT_APP_SLUG="${3:-native-app-template}"
NEXT_IOS_BUNDLE_ID="${4:-com.company.nativeapp}"
NEXT_ANDROID_PACKAGE="${5:-com.company.nativeapp}"

if [[ ! "$NEXT_SCOPE" =~ ^[a-z0-9-]+$ ]]; then
  echo "ORG_SCOPE must match ^[a-z0-9-]+$"
  exit 1
fi

if [[ ! "$NEXT_APP_SLUG" =~ ^[a-z0-9-]+$ ]]; then
  echo "APP_SLUG must match ^[a-z0-9-]+$"
  exit 1
fi

CURRENT_SCOPE="$(sed -n 's#"name": "@\([^"]*\)/mobile"#\1#p' apps/mobile/package.json | head -n 1)"
CURRENT_APP_NAME="$(sed -n 's/^APP_NAME=//p' apps/mobile/.env.example | head -n 1)"
CURRENT_APP_SLUG="$(sed -n 's/^APP_SLUG=//p' apps/mobile/.env.example | head -n 1)"
CURRENT_IOS_BUNDLE_ID="$(sed -n 's/^IOS_BUNDLE_ID=//p' apps/mobile/.env.example | head -n 1)"
CURRENT_ANDROID_PACKAGE="$(sed -n 's/^ANDROID_PACKAGE=//p' apps/mobile/.env.example | head -n 1)"

CURRENT_SCOPE="${CURRENT_SCOPE:-company}"
CURRENT_APP_NAME="${CURRENT_APP_NAME:-Native App Template}"
CURRENT_APP_SLUG="${CURRENT_APP_SLUG:-native-app-template}"
CURRENT_IOS_BUNDLE_ID="${CURRENT_IOS_BUNDLE_ID:-com.company.nativeapp}"
CURRENT_ANDROID_PACKAGE="${CURRENT_ANDROID_PACKAGE:-com.company.nativeapp}"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&|]/\\&/g'
}

sedi() {
  local expr="$1"
  local file="$2"
  if sed --version >/dev/null 2>&1; then
    sed -i "$expr" "$file"
  else
    sed -i '' "$expr" "$file"
  fi
}

replace_all() {
  local from="$1"
  local to="$2"
  local from_esc
  local to_esc
  from_esc="$(escape_sed "$from")"
  to_esc="$(escape_sed "$to")"

  local files=(
    "package.json"
    "README.md"
    ".env.example"
    "apps/mobile/package.json"
    "apps/mobile/tsconfig.json"
    "apps/mobile/.env.example"
    "apps/mobile/app.config.ts"
    "apps/mobile/src/features/example/components/ExampleCard.tsx"
    "apps/mobile/src/features/example/screens/HomeScreen.tsx"
    "apps/mobile/src/design-system/Button.tsx"
    "apps/mobile/src/lib/env.ts"
    "packages/ui/package.json"
    "packages/domain/package.json"
    ".github/workflows/release-ios.yml"
    ".github/workflows/release-android.yml"
  )

  for f in "${files[@]}"; do
    if [[ -f "$f" ]]; then
      sedi "s|$from_esc|$to_esc|g" "$f"
    fi
  done
}

replace_all "@$CURRENT_SCOPE/" "@$NEXT_SCOPE/"
replace_all "$CURRENT_APP_NAME" "$NEXT_APP_NAME"
replace_all "$CURRENT_APP_SLUG" "$NEXT_APP_SLUG"
replace_all "$CURRENT_IOS_BUNDLE_ID" "$NEXT_IOS_BUNDLE_ID"
replace_all "$CURRENT_ANDROID_PACKAGE" "$NEXT_ANDROID_PACKAGE"
replace_all "${CURRENT_APP_SLUG}-workspace" "${NEXT_APP_SLUG}-workspace"

cp apps/mobile/.env.example apps/mobile/.env

echo "Template initialized."
echo "- ORG_SCOPE: $NEXT_SCOPE"
echo "- APP_NAME: $NEXT_APP_NAME"
echo "- APP_SLUG: $NEXT_APP_SLUG"
echo "- IOS_BUNDLE_ID: $NEXT_IOS_BUNDLE_ID"
echo "- ANDROID_PACKAGE: $NEXT_ANDROID_PACKAGE"
