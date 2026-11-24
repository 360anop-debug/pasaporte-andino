// Ejecuta el flujo E2E en Chromium contra la web de staging. Uso: node qa/e2e/web.cjs <url> <outDir> <ancho> <alto>
const { chromium } = require('playwright');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const { run } = require('./flujo.cjs');
const { checkinCode } = require('./staging-env.cjs');
(async () => {
  const [url = 'http://127.0.0.1:8080/pasaporte/', out = 'qa/capturas/web-e2e', w = '393', hgt = '852'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: +w, height: +hgt } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  const log = [];
  let res;
  try {
    res = await run(page, {
      shot: (n) => page.screenshot({ path: `${out}/${n}.png` }),
      checkinCode: (slug) => checkinCode(slug),
      photo: { name: 'foto-prueba.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync('qa/fixtures/foto-prueba.jpg') },
      log: (m) => { log.push(m); console.log(m); },
    });
  } finally {
    fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ plataforma: 'web-chromium', viewport: `${w}x${hgt}`, pasos: res, errores_js: errors, log }, null, 2));
    await b.close();
  }
  if (errors.length) { console.log('ERRORES JS', errors); process.exit(1); }
})().catch((e) => { console.error(e.message); process.exit(1); });
