// Carga el entorno de staging sin depender de bash (funciona en Windows, macOS y Linux) y genera códigos
// QR de check-in firmados con la CLI de administración del backend.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');

/** Lee `export CLAVE=valor` de scripts/staging.env.local (si existe) o scripts/staging.env.sh. */
function stagingEnv() {
  const local = path.join(ROOT, 'scripts', 'staging.env.local');
  const file = fs.existsSync(local) ? local : path.join(ROOT, 'scripts', 'staging.env.sh');
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const body = line.replace(/^\s*export\s+/, '');
    if (/^\s*#/.test(line) || !body.includes('=')) continue;
    // admite varias asignaciones por línea: A=1 B="x y" C=z
    const re = /([A-Z0-9_]+)=("([^"]*)"|'([^']*)'|(\S*))/g;
    let m;
    while ((m = re.exec(body))) env[m[1]] = m[3] ?? m[4] ?? m[5] ?? '';
  }
  return { ...env, ...process.env.PA_DB_DSN ? process.env : {} };
}

const ENV = { ...process.env, ...stagingEnv() };

/** Código QR firmado de check-in para un lugar (staging). */
function checkinCode(slug, dias = 1, usos = 100) {
  const out = execFileSync('php', [path.join(ROOT, 'backend-integration', 'bin', 'admin.php'), 'codigo-checkin', slug, String(dias), String(usos)], { env: ENV, cwd: ROOT });
  return out.toString().split(/\r?\n/)[0].trim();
}

module.exports = { ENV, checkinCode, ROOT };
