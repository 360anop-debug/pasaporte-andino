// Capturas automáticas de todas las pantallas + recorrido funcional real contra el backend de staging.
// Uso: node qa/scripts/capturas.mjs <baseUrl> <outDir> [ancho]x[alto] ...
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const base = process.argv[2] || 'http://127.0.0.1:8080/pasaporte/';
const out = process.argv[3] || 'qa/capturas';
const sizes = (process.argv.slice(4).length ? process.argv.slice(4) : ['393x852']).map((s) => s.split('x').map(Number));
const { checkinCode } = createRequire(import.meta.url)('../e2e/staging-env.cjs');
const code = (slug) => checkinCode(slug, 30, 1000);
const SCREENS = [
  ['01-inicio', '#/inicio'], ['02-distritos', '#/distritos'], ['03-distrito-portada', '#/distrito/cajamarca'], ['04-distrito-contenidos', '#/distrito/cajamarca/contenidos'],
  ['05-historia', '#/distrito/cajamarca/historia'], ['06-videos', '#/distrito/cajamarca/videos'], ['07-audios', '#/distrito/cajamarca/audios'],
  ['08-referencias', '#/distrito/cajamarca/referencias'], ['09-lector', null], ['10-rutas', '#/rutas'], ['11-ruta-detalle', '#/ruta/ruta-historica'],
  ['12-destino', '#/destino/cumbemayo'], ['13-mi-pasaporte', '#/pasaporte'], ['14-sellos', '#/pasaporte/sellos'], ['15-album', '#/album'],
  ['16-monedas', '#/monedas'], ['17-coleccion', '#/monedas/coleccion'], ['18-retos', '#/retos'], ['19-checkin', '#/checkin'], ['20-ajustes', '#/ajustes'],
  ['21-distrito-sin-contenido', '#/distrito/san-pablo'], ['22-mapa', '#/mapa'], ['23-privacidad', '#/privacidad'],
];
const report = { base, sizes: [], errores_consola: [] };
const browser = await chromium.launch();
for (const [w, hgt] of sizes) {
  const dir = `${out}/${w}x${hgt}`;
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, locale: 'es-PE' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.errores_consola.push(`${w}x${hgt} ${page.url()} ${m.text()}`); });
  page.on('pageerror', (e) => report.errores_consola.push(`${w}x${hgt} PAGEERROR ${e.message}`));
  const shot = async (name) => { await page.waitForTimeout(700); await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove())); await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true }); };
  await page.goto(base + '#/bienvenida');
  await page.waitForSelector('#nombres');
  await shot('00a-registro');
  await page.fill('#nombres', 'Rosa Elena');
  await page.fill('#apellidos', 'Huamán Quispe');
  await page.selectOption('#nacionalidad', 'PE');
  await page.setInputFiles('#foto', 'qa/fixtures/foto-prueba.jpg');
  await page.check('#consent');
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-testid=passport-code]');
  await page.waitForTimeout(800);
  await shot('00b-bienvenido-pasaporte');
  // Actividad real verificada por el servidor (QR firmados de staging)
  for (const slug of ['plaza-de-armas-cajamarca', 'complejo-banos-del-inca', 'plaza-de-celendin']) {
    await page.goto(base + '#/checkin/' + encodeURIComponent(code(slug)));
    await page.waitForSelector('.checkin-ok', { timeout: 10000 });
  }
  await shot('19b-checkin-ok');
  await page.goto(base + '#/album');
  await page.click('.add-photo');
  await page.setInputFiles('#album-file', 'qa/fixtures/foto-prueba.jpg');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.polaroid');
  for (const [name, hash] of SCREENS) {
    if (name === '09-lector') {
      await page.goto(base + '#/distrito/cajamarca/referencias');
      await page.click('.ref-item');
      await page.waitForSelector('.reader-body');
      await shot(name);
      continue;
    }
    await page.goto(base + hash);
    await page.waitForFunction(() => !document.querySelector('.screen > .state.loading'), null, { timeout: 15000 });
    await shot(name);
  }
  // Inglés
  await page.goto(base + '#/inicio');
  await page.locator('button.lang-pill[lang=en]:visible').first().click();
  await shot('24-inicio-en');
  await page.goto(base + '#/monedas');
  await page.waitForSelector('[data-testid=coin-total]');
  await shot('25-monedas-en');
  await page.locator('button.lang-pill[lang=es]:visible').first().click().catch(() => {});
  report.sizes.push(`${w}x${hgt}`);
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/reporte-capturas.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ sizes: report.sizes, errores: report.errores_consola.length }, null, 1));
if (report.errores_consola.length) console.log(report.errores_consola.slice(0, 20).join('\n'));
