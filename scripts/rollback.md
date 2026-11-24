# Rollback — Pasaporte Andino

El despliegue usa releases versionadas en `$DEPLOY_BASE/releases/<fecha>-<commit>` y el enlace `current`.
El sitio de Cultura Educa 360 no se modifica en ningún paso.

## 1. Volver a la versión anterior de la aplicación (sin tocar datos)
```bash
ssh usuario@servidor 'cd /var/www/pasaporte-andino && ls -1dt releases/* | sed -n 2p'
ssh usuario@servidor 'cd /var/www/pasaporte-andino && ln -sfn "$(ls -1dt releases/* | sed -n 2p)" current.tmp && mv -Tf current.tmp current'
curl -fsS https://region.aprep.net/pasaporte/api/v1/salud
```

## 2. Revertir la última migración (solo si la nueva versión la introdujo)
```bash
cd /var/www/pasaporte-andino/current/api && set -a && . /etc/pasaporte-andino/produccion.env && set +a
php bin/migrate.php status
php bin/migrate.php down          # revierte SOLO la última migración aplicada
```
`down` de la 001 elimina las tablas `pa_*`: antes, verificar el backup `backups/pre-<release>.sql`.

## 3. Restaurar datos del módulo desde backup
```bash
mysql -u <usuario_admin> -p <bd> < /var/www/pasaporte-andino/backups/pre-<release>.sql
```
Solo contiene tablas `pa_*`; no afecta a tablas de CE360.

## 4. Desactivar por completo la edición turística
Quitar el alias/location `/pasaporte` del virtual host y recargar el servidor web. Las tablas `pa_*` quedan intactas.

## Prueba del procedimiento
El ciclo `up → down → up` de las migraciones se ejecuta en cada CI (job *Backend PHP 8.4 + MariaDB*) y en `scripts/pruebas.sh`.
El rollback de symlink debe ensayarse en staging antes del despliegue de producción (registro en DEPLOY_PRODUCCION.md).
