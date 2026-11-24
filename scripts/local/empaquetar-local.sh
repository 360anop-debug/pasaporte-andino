#!/usr/bin/env bash
# Ensambla PASAPORTE_ANDINO_ENTREGA_FINAL.zip con los binarios y evidencias generados EN LA LAPTOP
# (scripts/local/probar-apk.sh y probar-exe-windows.ps1). Uso: scripts/local/empaquetar-local.sh [dir_salida]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
OUT="${1:-$ROOT/entrega}"; CI="$OUT/ci-local"
rm -rf "$CI"; mkdir -p "$CI/instaladores" "$CI/qa"
for f in PasaporteAndino-Android.apk PasaporteAndino-Android.aab PasaporteAndino-Setup.exe; do
  [ -f "instaladores/$f" ] && cp "instaladores/$f" "$CI/instaladores/" || echo "AVISO: falta instaladores/$f (no se incluirá; márquelo NO_ENTREGADO)"
done
( cd "$CI/instaladores" && sha256sum * > SHA256SUMS.txt && cat SHA256SUMS.txt )
[ -d qa/capturas/android-local ] && cp -r qa/capturas/android-local "$CI/qa/android-e2e-local"
[ -d qa/capturas/windows-local ] && mkdir -p "$CI/qa/windows/qa/capturas" && cp -r qa/capturas/windows-local "$CI/qa/windows/qa/capturas/windows"
mkdir -p "$CI/qa/qa-backend" && cp qa/logs/*.txt "$CI/qa/qa-backend/" 2>/dev/null || true
printf '# Resultado local\n- commit: %s\n- fecha: %s\n- generado en la laptop del propietario (sin GitHub Actions)\n' "$(git rev-parse HEAD)" "$(date -u +%FT%TZ)" > "$CI/RESULTADO_CI.md"
bash scripts/empaquetar-entrega.sh "$CI" "$OUT"
