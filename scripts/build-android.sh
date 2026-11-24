#!/usr/bin/env bash
# Compila el APK de release con configuración de producción.
# Requisitos: Node 22, JDK 21, Android SDK (ANDROID_HOME) con platform 35 y build-tools.
# Firma: exporta PA_KEYSTORE_PATH, PA_KEYSTORE_PASSWORD, PA_KEY_ALIAS, PA_KEY_PASSWORD (keystore del PROPIETARIO, fuera del repo).
# Sin esas variables se genera un APK de release SIN firmar (no instalable) → firmar con apksigner.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/web-tourism" && npm ci && npm test && npm run build:prod
cd "$ROOT/android" && npm ci && npx cap sync android
cd "$ROOT/android/android" && ./gradlew --no-daemon assembleRelease bundleRelease
mkdir -p "$ROOT/instaladores"
cp app/build/outputs/apk/release/app-release*.apk "$ROOT/instaladores/PasaporteAndino-Android.apk"
cp app/build/outputs/bundle/release/app-release.aab "$ROOT/instaladores/PasaporteAndino-Android.aab" || true
sha256sum "$ROOT"/instaladores/PasaporteAndino-Android.*
