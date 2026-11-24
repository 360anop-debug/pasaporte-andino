#!/usr/bin/env bash
# Ensambla PASAPORTE_ANDINO_ENTREGA_FINAL.zip con la estructura exigida por la Orden Maestra.
# Uso: scripts/empaquetar-entrega.sh <dir_entregables_ci> <dir_salida>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CI="${1:?dir con la rama entregables}"; OUTDIR="${2:?dir salida}"
E="$OUTDIR/PASAPORTE_ANDINO_ENTREGA_FINAL"
rm -rf "$E"; mkdir -p "$E"/{instaladores,qa/{capturas,reportes,logs-sanitizados},scripts,docs}
cp "$ROOT"/{README.md,CHANGELOG.md,MATRIZ_FIDELIDAD_VISUAL.md,AUDITORIA_REUTILIZACION_CE360.md,AUDITORIA_SEGURIDAD.md,MATRIZ_PRUEBAS_Y_RESULTADOS.md,LIMITACIONES_Y_PENDIENTES.md} "$E/"
cp "$ROOT"/docs/*.md "$E/docs/"
# Código fuente sin dependencias ni compilados
rsync -a --exclude node_modules --exclude dist --exclude 'dist-*' "$ROOT/web-tourism/" "$E/web-tourism/"
rsync -a --exclude vendor --exclude storage --exclude .phpunit.cache "$ROOT/backend-integration/" "$E/backend-integration/"
rsync -a --exclude node_modules --exclude 'android/app/build' --exclude 'android/build' --exclude 'android/.gradle' --exclude 'android/app/src/main/assets/public' "$ROOT/android/" "$E/android/"
rsync -a --exclude node_modules --exclude web --exclude dist-installer "$ROOT/windows/" "$E/windows/"
cp -r "$ROOT"/scripts/* "$E/scripts/"; cp -r "$ROOT/.github" "$E/scripts/github-actions"
cp -r "$ROOT/qa/scripts" "$ROOT/qa/e2e" "$ROOT/qa/fixtures" "$E/qa/"; rm -rf "$E/qa/e2e/node_modules"
# Instaladores (reensamblados desde partes si hiciera falta) — solo los realmente compilados por CI
( cd "$CI/instaladores" && shopt -s nullglob && for p in *.part00; do [ -e "$p" ] || continue; b="${p%.part00}"; cat "$b".part* > "$b"; rm "$b".part*; done )
for f in PasaporteAndino-Android.apk PasaporteAndino-Android.aab PasaporteAndino-Setup.exe; do [ -f "$CI/instaladores/$f" ] && cp "$CI/instaladores/$f" "$E/instaladores/"; done
( cd "$CI/instaladores" && sha256sum -c SHA256SUMS.txt --ignore-missing )
# QA
cp -r "$ROOT/qa/capturas/web" "$ROOT/qa/capturas/comparativas" "$E/qa/capturas/"
for d in "$CI"/qa/android-e2e-*; do [ -d "$d" ] && cp -r "$d" "$E/qa/capturas/$(basename "$d")"; done
[ -d "$CI/qa/android" ] && cp -r "$CI/qa/android" "$E/qa/capturas/android-build" || true
[ -d "$CI/qa/windows" ] && cp -r "$CI/qa/windows" "$E/qa/capturas/windows-instalado" || true
find "$E/qa/capturas" -name '*.txt' -exec mv {} "$E/qa/logs-sanitizados/" \; 2>/dev/null || true
[ -d "$CI/qa/qa-backend" ] && cp "$CI"/qa/qa-backend/* "$E/qa/reportes/" || true
cp "$ROOT"/qa/reportes/* "$E/qa/reportes/"; cp "$CI/RESULTADO_CI.md" "$E/qa/reportes/" 2>/dev/null || true
# Sanitizar: sin secretos ni rutas personales
# (patrones de secretos reales; las expresiones ${{ github.token }} del workflow no son secretos)
if grep -rIlE "BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|x-access-token:[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}" "$E"; then echo "SECRETO DETECTADO"; exit 1; fi
find "$E" \( -name '*.jks' -o -name '*.keystore' -o -name '*.p12' -o -name '*.pfx' -o -name 'local.php' -o -name '.env.local' \) | grep . && { echo "ARCHIVO SENSIBLE DETECTADO"; exit 1; } || true
# Manifiesto
python3 -I - "$E" <<'PY'
import os, sys, json, hashlib
root = sys.argv[1]; out = []
for d, _, fs in os.walk(root):
    for f in sorted(fs):
        p = os.path.join(d, f); r = os.path.relpath(p, root)
        if r == 'MANIFEST_SHA256.json': continue
        out.append({'archivo': r.replace(os.sep, '/'), 'bytes': os.path.getsize(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest()})
json.dump({'entrega': 'PASAPORTE_ANDINO_ENTREGA_FINAL', 'archivos': sorted(out, key=lambda x: x['archivo'])}, open(os.path.join(root, 'MANIFEST_SHA256.json'), 'w'), indent=1, ensure_ascii=False)
print(len(out), 'archivos en manifiesto')
PY
( cd "$OUTDIR" && rm -f PASAPORTE_ANDINO_ENTREGA_FINAL.zip && zip -qr9 PASAPORTE_ANDINO_ENTREGA_FINAL.zip PASAPORTE_ANDINO_ENTREGA_FINAL && unzip -tq PASAPORTE_ANDINO_ENTREGA_FINAL.zip && sha256sum PASAPORTE_ANDINO_ENTREGA_FINAL.zip && du -h PASAPORTE_ANDINO_ENTREGA_FINAL.zip )
