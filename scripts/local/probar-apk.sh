#!/usr/bin/env bash
# Compila APK de release (producción) y de staging (para el dispositivo), instala en el teléfono/emulador conectado
# por USB/adb, ejecuta el E2E completo (flujo + nativo) y desinstala. El backend local debe estar en marcha
# (scripts/local/backend-staging.sh en otra terminal).
# Requisitos: Android Studio (SDK 35, build-tools, platform-tools en PATH), JDK 21, Node 22, teléfono con
# «Depuración USB» activada (o emulador AVD con imagen API 34 «Google APIs» o AOSP).
# Firma de release: exportar PA_KEYSTORE_PATH, PA_KEYSTORE_PASSWORD, PA_KEY_ALIAS, PA_KEY_PASSWORD (keystore del propietario).
# Sin ellas se crea un keystore de PRUEBA local en ~/.pasaporte-andino/prueba.jks (no publicar con él).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
OUT=qa/capturas/android-local; mkdir -p "$OUT" qa/logs instaladores
adb devices | grep -w device || { echo "No hay dispositivo adb conectado"; exit 2; }
if [ -z "${PA_KEYSTORE_PATH:-}" ]; then
  mkdir -p "$HOME/.pasaporte-andino"; export PA_KEYSTORE_PATH="$HOME/.pasaporte-andino/prueba.jks" PA_KEYSTORE_PASSWORD=prueba-local-123 PA_KEY_ALIAS=pasaporte PA_KEY_PASSWORD=prueba-local-123
  [ -f "$PA_KEYSTORE_PATH" ] || keytool -genkeypair -keystore "$PA_KEYSTORE_PATH" -alias pasaporte -keyalg RSA -keysize 4096 -validity 3650 -storepass "$PA_KEYSTORE_PASSWORD" -keypass "$PA_KEY_PASSWORD" -dname "CN=Pasaporte Andino PRUEBA, O=Cultura Educa 360, C=PE"
fi
GRADLEW=./gradlew; case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) GRADLEW=./gradlew.bat;; esac
set -e
( cd web-tourism && npm ci && npm test && rm -rf dist && npm run build:prod )
( cd android && npm ci && npx cap sync android && cd android && $GRADLEW --no-daemon assembleRelease bundleRelease )
cp android/android/app/build/outputs/apk/release/app-release.apk instaladores/PasaporteAndino-Android.apk
cp android/android/app/build/outputs/bundle/release/app-release.aab instaladores/PasaporteAndino-Android.aab
( cd web-tourism && rm -rf dist && npx vite build --mode android-device )
( cd android && PA_STAGING=1 npx cap sync android && cd android && $GRADLEW --no-daemon assembleDebug )
cp android/android/app/build/outputs/apk/debug/app-debug.apk instaladores/PasaporteAndino-Android-staging.apk
set +e
PKG=net.aprep.region.pasaporteandino
adb reverse tcp:8080 tcp:8080
adb uninstall $PKG >/dev/null 2>&1
adb install -r instaladores/PasaporteAndino-Android-staging.apk | tee qa/logs/android-local-install-staging.txt
npm --prefix qa install >/dev/null
PA_E2E_PARTE=todo node qa/e2e/android.cjs "$OUT"; E2E=$?
adb uninstall $PKG | tee qa/logs/android-local-uninstall-staging.txt
adb install instaladores/PasaporteAndino-Android.apk | tee qa/logs/android-local-install-release.txt
adb shell am start -W -n $PKG/.MainActivity; sleep 15
adb exec-out screencap -p > "$OUT/40-release-primer-arranque.png"
adb uninstall $PKG | tee qa/logs/android-local-uninstall-release.txt
sha256sum instaladores/PasaporteAndino-Android.* | tee qa/logs/sha256-apk-local.txt
echo "E2E Android: código de salida $E2E (0 = todo correcto). Resultados en $OUT/resultado.json"
exit $E2E
