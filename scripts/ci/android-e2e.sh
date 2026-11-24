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
timeout 300 adb install -r instaladores/PasaporteAndino-Android-staging.apk | tee qa/logs/android-install-staging.txt
timeout 28m node qa/e2e/android.cjs "$OUT"; E2E=$?
echo "== logcat (errores, WebView, Capacitor) =="
timeout 60 adb logcat -d -v brief | grep -E "AndroidRuntime|FATAL|Capacitor|pasaporteandino|am_proc_died|ActivityManager: (Start proc|Killing|Process .* has died)" | grep -vE "Accessibility|Cronet" | tail -60 || true
timeout 60 adb logcat -d -s chromium:I Capacitor:V "Capacitor/Console":V AndroidRuntime:E > qa/logs/android-logcat-staging.txt || true
timeout 120 adb uninstall $PKG | tee qa/logs/android-uninstall-staging.txt
adb shell pm list packages | grep -c $PKG > qa/logs/android-tras-desinstalar.txt || true
# 2) APK de release (producción): instalación, primer arranque, captura y desinstalación
timeout 300 adb install instaladores/PasaporteAndino-Android.apk | tee qa/logs/android-install-release.txt
timeout 120 adb shell am start -W -n $PKG/.MainActivity | tee qa/logs/android-start-release.txt
sleep 20
timeout 60 adb exec-out screencap -p > "$OUT/40-release-primer-arranque.png"
adb shell input keyevent 4; sleep 2
adb shell pidof $PKG > qa/logs/android-release-pid.txt || echo "proceso no vivo" >> qa/logs/android-release-pid.txt
timeout 60 adb logcat -d -s AndroidRuntime:E > qa/logs/android-logcat-release-errores.txt || true
timeout 120 adb uninstall $PKG | tee qa/logs/android-uninstall-release.txt
exit $E2E
