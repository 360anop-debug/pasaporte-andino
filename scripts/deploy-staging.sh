#!/usr/bin/env bash
# Despliegue ATÓMICO a staging (o producción tras aprobación). NO toca el sitio de Cultura Educa 360:
# instala solo en /pasaporte (web) y /pasaporte/api (API) mediante releases versionadas y un symlink.
# Uso: DEPLOY_HOST=usuario@servidor DEPLOY_BASE=/var/www/pasaporte-andino ENV_FILE=/etc/pasaporte-andino/staging.env scripts/deploy-staging.sh
set -euo pipefail
: "${DEPLOY_HOST:?}" "${DEPLOY_BASE:?}" "${ENV_FILE:?ruta del archivo de entorno EN EL SERVIDOR (no en el repo)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REL="$(date -u +%Y%m%d%H%M%S)-$(git -C "$ROOT" rev-parse --short HEAD)"
( cd "$ROOT/web-tourism" && npm ci && npm run build:prod )
( cd "$ROOT/backend-integration" && composer install --no-dev --optimize-autoloader -q )
TMP="$(mktemp -d)"; mkdir -p "$TMP/$REL"
cp -r "$ROOT/web-tourism/dist" "$TMP/$REL/web"
rsync -a --exclude storage --exclude tests --exclude .env.test.sh --exclude phpunit.xml "$ROOT/backend-integration/" "$TMP/$REL/api/"
tar -C "$TMP" -czf "$TMP/$REL.tgz" "$REL"
scp "$TMP/$REL.tgz" "$DEPLOY_HOST:/tmp/"
ssh "$DEPLOY_HOST" bash -s -- "$DEPLOY_BASE" "$REL" "$ENV_FILE" <<'REMOTE'
set -euo pipefail
BASE="$1"; REL="$2"; ENVF="$3"
mkdir -p "$BASE/releases" "$BASE/shared/storage" "$BASE/backups"
tar -C "$BASE/releases" -xzf "/tmp/$REL.tgz" && rm "/tmp/$REL.tgz"
set -a; . "$ENVF"; set +a
# 1) Backup verificado de las tablas pa_* (solo del módulo turístico)
DB=$(php -r 'preg_match("/dbname=([^;]+)/", getenv("PA_DB_DSN"), $m); echo $m[1];')
mysqldump --single-transaction --no-tablespaces -u"$PA_DB_USER" -p"$PA_DB_PASS" "$DB" $(mysql -N -u"$PA_DB_USER" -p"$PA_DB_PASS" "$DB" -e "SHOW TABLES LIKE 'pa\_%'") > "$BASE/backups/pre-$REL.sql" || true
test -s "$BASE/backups/pre-$REL.sql" || echo "AVISO: primera instalación (sin tablas pa_* previas)"
# 2) Migraciones aditivas
ln -sfn "$BASE/shared/storage" "$BASE/releases/$REL/api/storage"
( cd "$BASE/releases/$REL/api" && php bin/migrate.php up && php bin/seed.php base )
# 3) Cambio atómico de versión
ln -sfn "$BASE/releases/$REL" "$BASE/current.tmp" && mv -Tf "$BASE/current.tmp" "$BASE/current"
# 4) Verificación posterior
curl -fsS "${PA_PUBLIC_BASE_URL%/}/api/v1/salud" && echo "OK $REL"
ls -1dt "$BASE"/releases/* | tail -n +6 | xargs -r rm -rf
REMOTE
