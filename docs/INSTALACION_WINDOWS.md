# Instalación — Windows 10/11 (x64)

1. Ejecutar `instaladores/PasaporteAndino-Setup.exe` (verificar antes su SHA-256).
2. **SmartScreen**: el instalador no está firmado con certificado de código (no se entregó certificado). Windows mostrará
   «Windows protegió su PC» → «Más información» → «Ejecutar de todas formas». Para eliminar el aviso, firmar con el
   certificado del propietario (`CSC_LINK`, `CSC_KEY_PASSWORD`) en `scripts/build-windows.ps1`.
3. El asistente permite elegir carpeta; instala por usuario (sin privilegios de administrador) en
   `%LOCALAPPDATA%\Programs\pasaporte-andino-desktop`, con accesos en Escritorio y Menú Inicio.
4. Desinstalar: Configuración → Aplicaciones → «Pasaporte Andino», o `Uninstall Pasaporte Andino.exe`.
   Se eliminan también la sesión cifrada y la caché (`%APPDATA%\Pasaporte Andino`).

Instalación silenciosa (TI): `PasaporteAndino-Setup.exe /S` · desinstalación: `"Uninstall Pasaporte Andino.exe" /S`.

## Datos técnicos
Electron 45.4.1 · contextIsolation + sandbox · sin permisos de cámara/micrófono/ubicación · token cifrado con DPAPI (`safeStorage`) ·
ventana mínima 900×620, recuerda tamaño/posición · enlaces externos en el navegador predeterminado · compartir: copiar enlace,
Facebook/WhatsApp/X en el navegador y descarga de tarjeta PNG para Instagram.
