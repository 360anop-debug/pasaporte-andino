# Instalación — Android

## Para probar
1. Copiar `instaladores/PasaporteAndino-Android.apk` al teléfono (Android 6.0 / API 23 o superior).
2. Permitir «Instalar apps desconocidas» para el gestor de archivos usado.
3. Abrir el APK → Instalar. Verificar antes el SHA-256 publicado en `MANIFEST_SHA256.json`.

> El APK entregado está firmado con un **certificado de PRUEBA efímero** generado en CI (no es la firma del propietario).
> Sirve para instalar y validar; **no** debe publicarse en Google Play. Una instalación con firma de prueba debe
> desinstalarse antes de instalar la versión firmada por el propietario.

## Datos técnicos
- **Requisito de motor web:** Android System WebView (o Chrome) **88 o superior**. En equipos con WebView más antigua la app muestra un aviso para actualizarla desde Google Play (verificado en emulador API 30 con WebView de fábrica).
- Paquete: `net.aprep.region.pasaporteandino` · nombre «Pasaporte Andino» · versión 1.0.0 (code 1) · minSdk 23 · targetSdk 35.
- Permisos: solo `INTERNET`. Las fotos se eligen con el selector del sistema (sin permiso de almacenamiento ni de cámara).
- Copias de seguridad desactivadas para el almacenamiento seguro (`allowBackup=false`, reglas de extracción).
- Navegación: solo el bundle local; enlaces externos se abren en el navegador.

## Compilar
```bash
export PA_KEYSTORE_PATH=/ruta/segura/propietario.jks PA_KEYSTORE_PASSWORD=… PA_KEY_ALIAS=… PA_KEY_PASSWORD=…
scripts/build-android.sh
```
Genera también el AAB (`bundleRelease`) para Google Play. El keystore y sus contraseñas nunca se incluyen en el repositorio ni en el ZIP.

## Publicación en Google Play (pendiente del propietario)
Cuenta de desarrollador, firma de app de Play, ficha, política de privacidad pública (URL), clasificación de contenido y formulario de seguridad de datos (datos recogidos: nombre, nacionalidad, fotos opcionales; sin venta ni compartición con terceros).
