#!/usr/bin/env bash
# Se ejecuta dentro del emulador (reactivecircus/android-emulator-runner).
set -uxo pipefail
OUT=qa/capturas/android
mkdir -p "$OUT" qa/logs
PKG=net.aprep.region.pasaporteandino
adb wait-for-device
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
adb logcat -c
# 1) APK de staging: instalación + E2E completo
adb install -r instaladores/PasaporteAndino-Android-staging.apk | tee qa/logs/android-install-staging.txt
node qa/e2e/android.cjs "$OUT"; E2E=$?
adb logcat -d -s chromium:I Capacitor:V "Capacitor/Console":V AndroidRuntime:E > qa/logs/android-logcat-staging.txt || true
adb uninstall $PKG | tee qa/logs/android-uninstall-staging.txt
adb shell pm list packages | grep -c $PKG > qa/logs/android-tras-desinstalar.txt || true
# 2) APK de release (producción): instalación, primer arranque, captura y desinstalación
adb install instaladores/PasaporteAndino-Android.apk | tee qa/logs/android-install-release.txt
adb shell am start -W -n $PKG/.MainActivity | tee qa/logs/android-start-release.txt
sleep 12
adb exec-out screencap -p > "$OUT/40-release-primer-arranque.png"
adb shell input keyevent 4; sleep 2
adb shell pidof $PKG > qa/logs/android-release-pid.txt || echo "proceso no vivo" >> qa/logs/android-release-pid.txt
adb logcat -d -s AndroidRuntime:E > qa/logs/android-logcat-release-errores.txt || true
adb uninstall $PKG | tee qa/logs/android-uninstall-release.txt
exit $E2E
