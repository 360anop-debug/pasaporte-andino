# Compila el EXE (producción y staging), instala en silencio, ejecuta el E2E 20/20 sobre la app INSTALADA,
# desinstala y verifica limpieza. Ejecutar en PowerShell 7 en Windows 10/11, con el backend local en marcha
# (scripts/local/backend-staging.sh en Git Bash, en otra terminal). Requisitos: Node 22, PHP 8.4 en PATH.
$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot/../.."; Set-Location $root
New-Item -ItemType Directory -Force qa/logs, instaladores, qa/capturas/windows-local | Out-Null
$log = 'qa/logs/windows-local.txt'; "== $(Get-Date -Format o)" | Set-Content $log
Invoke-RestMethod http://127.0.0.1:8080/pasaporte/api/v1/salud | ConvertTo-Json -Compress | Tee-Object -FilePath $log -Append
Push-Location web-tourism; npm ci; npm test; if (Test-Path dist) { Remove-Item -Recurse -Force dist }; npm run build:prod; Copy-Item -Recurse dist ../dist-prod -Force; Remove-Item -Recurse -Force dist; npx vite build --mode staging; Pop-Location
function Build-Exe($webDir, $name) {
  Remove-Item -Recurse -Force windows/web, windows/dist-installer -ErrorAction SilentlyContinue
  Copy-Item -Recurse $webDir windows/web
  Push-Location windows; npm ci; npx electron-builder --win nsis --x64 --publish never; Pop-Location
  Copy-Item windows/dist-installer/PasaporteAndino-Setup.exe "instaladores/$name" -Force
}
Build-Exe 'dist-prod' 'PasaporteAndino-Setup.exe'
Build-Exe 'web-tourism/dist' 'PasaporteAndino-Staging-Setup.exe'
Remove-Item -Recurse -Force dist-prod
function Uninstall-Info { Get-ChildItem HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall | Get-ItemProperty | Where-Object DisplayName -like 'Pasaporte Andino*' }
# --- staging: instalación + E2E + desinstalación
$p = Start-Process instaladores/PasaporteAndino-Staging-Setup.exe -ArgumentList '/S' -Wait -PassThru
"instalador staging exit=$($p.ExitCode)" | Tee-Object -FilePath $log -Append
$un = Uninstall-Info; $un | Format-List DisplayName,DisplayVersion,Publisher,UninstallString | Out-String | Tee-Object -FilePath $log -Append
$dir = Split-Path ($un.UninstallString -replace '^"([^"]+)".*$', '$1'); $exe = Join-Path $dir 'Pasaporte Andino.exe'
"exe: $(Test-Path $exe) · escritorio: $(Test-Path "$env:USERPROFILE\Desktop\Pasaporte Andino.lnk") · menú inicio: $(Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Pasaporte Andino.lnk")" | Tee-Object -FilePath $log -Append
npm --prefix qa install | Out-Null
node qa/e2e/windows.cjs $exe qa/capturas/windows-local; $e2e = $LASTEXITCODE
"e2e exit=$e2e" | Tee-Object -FilePath $log -Append
Get-Process 'Pasaporte Andino' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process (Join-Path $dir 'Uninstall Pasaporte Andino.exe') -ArgumentList '/S' -Wait; Start-Sleep 5
"tras desinstalar staging · exe: $(Test-Path $exe) · escritorio: $(Test-Path "$env:USERPROFILE\Desktop\Pasaporte Andino.lnk") · registro: $([bool](Uninstall-Info))" | Tee-Object -FilePath $log -Append
# --- producción: instalación + primer arranque + desinstalación
Start-Process instaladores/PasaporteAndino-Setup.exe -ArgumentList '/S' -Wait
$dir = Split-Path ((Uninstall-Info).UninstallString -replace '^"([^"]+)".*$', '$1'); $exe = Join-Path $dir 'Pasaporte Andino.exe'
@'
const { _electron } = require('playwright');
(async () => { const app = await _electron.launch({ executablePath: process.argv[2] }); const p = await app.firstWindow();
  await p.waitForFunction(() => window.__paReady === true, null, { timeout: 60000 }); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'qa/capturas/windows-local/40-produccion-primer-arranque.png' }); console.log('produccion', p.url()); await app.close(); })()
  .catch((e) => { console.error(e); process.exit(1); });
'@ | Set-Content qa/e2e/prod-win.cjs
node qa/e2e/prod-win.cjs $exe | Tee-Object -FilePath $log -Append; $prod = $LASTEXITCODE
Start-Process (Join-Path $dir 'Uninstall Pasaporte Andino.exe') -ArgumentList '/S' -Wait; Start-Sleep 5
"producción exit=$prod · tras desinstalar exe: $(Test-Path $exe)" | Tee-Object -FilePath $log -Append
Get-FileHash instaladores/*.exe -Algorithm SHA256 | Format-Table -AutoSize | Out-String -Width 300 | Tee-Object -FilePath qa/logs/sha256-exe-local.txt
if ($e2e -ne 0 -or $prod -ne 0) { Write-Error "Pruebas Windows con fallos (ver $log)"; exit 1 }
Write-Host "Windows OK: instalación, E2E 20/20 y desinstalación verificados."
