#!/usr/bin/env bash
# Inspección inicial reproducible: integridad del kit (SHA-256 vs MANIFEST), inventario y herramientas.
# Uso: scripts/inspeccion.sh <ruta/PASAPORTE_ANDINO_KIT_MAESTRO> [ruta/codigo-ce360]
set -euo pipefail
KIT="${1:?ruta al kit}"; CE360="${2:-}"
python3 -I - "$KIT" <<'PY'
import json, hashlib, os, sys, collections
kit = sys.argv[1]
m = json.load(open(os.path.join(kit, 'documentacion/MANIFEST.json'), encoding='utf-8'))
ok = bad = miss = 0; st = collections.Counter()
for a in m['archivos']:
    st[a['estado']] += 1
    p = os.path.join(kit, a['archivo'])
    if not os.path.exists(p): miss += 1; print('FALTA', a['archivo']); continue
    if hashlib.sha256(open(p, 'rb').read()).hexdigest() == a['sha256']: ok += 1
    else: bad += 1; print('SHA DISTINTO', a['archivo'])
    if a['estado'] == 'provisional': print('PROVISIONAL', a['archivo'], '-', a['notas'])
print(f'verificados={ok} distintos={bad} faltantes={miss} estados={dict(st)}')
PY
echo "== Referencias visuales"; python3 -I -c "import glob,sys;from PIL import Image;[print(f, Image.open(f).size) for f in sorted(glob.glob(sys.argv[1]+'/referencias_visuales/*.png'))]" "$KIT"
echo "== Herramientas"; for c in php composer node npm java mariadb; do printf "%-9s" $c; command -v $c >/dev/null && ($c --version 2>&1 | head -1) || echo "no"; done
if [ -n "$CE360" ]; then
  echo "== CE360: rutas, sesiones, biblioteca, migraciones (inspección rápida)"
  grep -rIlE "session_start|password_verify|biblioteca|library|CREATE TABLE" "$CE360" | head -100
else
  echo "== CE360: NO PROPORCIONADO → integración BLOQUEADA (ver AUDITORIA_REUTILIZACION_CE360.md)"
fi
