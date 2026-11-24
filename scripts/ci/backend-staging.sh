#!/usr/bin/env bash
# Prepara la BD de staging (usuario de privilegios mínimos), migra, siembra y arranca el servidor PHP.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
mysql -h127.0.0.1 -uroot -p"${MYSQL_ROOT_PASSWORD:-root}" -e "CREATE DATABASE IF NOT EXISTS pa_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'pa_app'@'%' IDENTIFIED BY 'pa_local_dev'; GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,DROP,REFERENCES ON pa_staging.* TO 'pa_app'@'%'; FLUSH PRIVILEGES;"
set -a; . "$ROOT/scripts/staging.env.sh"; set +a
cd "$ROOT/backend-integration"
php bin/migrate.php up
php bin/seed.php base
php bin/seed.php demo
cd "$ROOT"
nohup php -S 0.0.0.0:8080 scripts/staging-router.php > "${RUNNER_TEMP:-/tmp}/php-staging.log" 2>&1 &
for i in $(seq 1 30); do curl -fsS http://127.0.0.1:8080/pasaporte/api/v1/salud && break; sleep 1; done
