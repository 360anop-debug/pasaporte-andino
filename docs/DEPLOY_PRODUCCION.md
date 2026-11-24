# Despliegue en region.aprep.net — con compuertas

**Generar APK/EXE no equivale a producción actualizada.** El orden obligatorio es:

1. **Inventario del servidor** (propietario/infraestructura): versión de PHP (8.4), MariaDB, virtual host de `region.aprep.net`,
   cómo está montado CE360, backups existentes. Ejecutar `scripts/inspeccion.sh` con el código real de CE360.
2. **Staging equivalente** (p. ej. `staging.region.aprep.net` o `/pasaporte-staging`) con copia anonimizada.
3. `scripts/deploy-staging.sh` → migraciones `pa_*`, semilla `base`, verificación `/api/v1/salud`.
4. QA en staging: `scripts/pruebas.sh` + E2E de APK/EXE apuntando a staging.
5. **Aceptación del propietario** (diseño y flujos). Registrar fecha y responsable.
6. Carga editorial de contenidos reales con fuente y licencia (los demo no existen en producción).
7. Generar QR de check-in por lugar: `php bin/admin.php codigo-checkin <slug> 365` e imprimirlos en sitio.
8. Producción: mismo script con `ENV_FILE=/etc/pasaporte-andino/produccion.env`, ventana de mantenimiento, monitoreo de logs 24 h.
9. Ensayo de rollback documentado (`scripts/rollback.md`).

## Configuración del servidor web (ejemplo Apache, sin tocar el resto del sitio)
```apache
Alias /pasaporte/api /var/www/pasaporte-andino/current/api/public
<Directory /var/www/pasaporte-andino/current/api/public>
    AllowOverride All
    Require all granted
    SetEnv PA_ENV production
    # Resto de variables desde /etc/pasaporte-andino/produccion.env (PassEnv / pool php-fpm)
</Directory>
Alias /pasaporte /var/www/pasaporte-andino/current/web
<Directory /var/www/pasaporte-andino/current/web>
    Require all granted
    Header always set Content-Security-Policy "frame-ancestors 'none'"
    Header always set X-Content-Type-Options nosniff
</Directory>
```
Nginx: `location /pasaporte/api/ { … fastcgi index.php … }` y `location /pasaporte/ { alias …/web/; }`.
`PA_STORAGE_DIR` debe estar fuera del webroot con permisos 750 del usuario de php-fpm.

## Variables de producción (archivo fuera del repositorio, permisos 600)
```
PA_ENV=production
PA_DB_DSN=mysql:host=localhost;dbname=<bd_existente>;charset=utf8mb4
PA_DB_USER=<usuario_pa_minimo>   PA_DB_PASS=<secreto>
PA_SECRET=<64 caracteres aleatorios>
PA_CORS_ORIGINS=https://region.aprep.net,https://localhost,app://pasaporte
PA_PUBLIC_BASE_URL=https://region.aprep.net/pasaporte
PA_STORAGE_DIR=/var/lib/pasaporte-andino/storage
PA_COOKIE_SECURE=1
```
