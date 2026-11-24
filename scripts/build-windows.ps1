# Compila el instalador NSIS de Windows con configuración de producción. Ejecutar en Windows 10/11 (PowerShell 7).
# Requisitos: Node 22. Firma de código opcional: define CSC_LINK y CSC_KEY_PASSWORD (certificado del propietario).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location "$root/web-tourism"; npm ci; npm test; npm run build:prod; Pop-Location
Remove-Item -Recurse -Force "$root/windows/web" -ErrorAction SilentlyContinue
Copy-Item -Recurse "$root/web-tourism/dist" "$root/windows/web"
Push-Location "$root/windows"; npm ci; npx electron-builder --win nsis --x64 --publish never; Pop-Location
New-Item -ItemType Directory -Force "$root/instaladores" | Out-Null
Copy-Item "$root/windows/dist-installer/PasaporteAndino-Setup.exe" "$root/instaladores/PasaporteAndino-Setup.exe" -Force
Get-FileHash "$root/instaladores/PasaporteAndino-Setup.exe" -Algorithm SHA256
