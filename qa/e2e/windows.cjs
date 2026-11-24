// E2E de la app Windows INSTALADA (Electron) contra el backend real de staging en el runner.
// Uso: node qa/e2e/windows.cjs <exePath> <outDir>
const { _electron } = require('playwright');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { run, go } = require('./flujo.cjs');
const [exe, out = 'qa/capturas/windows'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const log = [];
const L = (m) => { log.push(`[${new Date().toISOString()}] ${m}`); console.log(m); };
const code = (slug) => execSync(`php backend-integration/bin/admin.php codigo-checkin ${slug} 1 100`, { env: process.env }).toString().split(/\r?\n/)[0].trim();
const photo = { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync('qa/fixtures/foto-prueba.jpg') };

async function launch(args = []) {
  const app = await _electron.launch({ executablePath: exe, args, timeout: 60000 });
  const page = await app.firstWindow();
  await page.waitForFunction(() => window.__paReady === true, null, { timeout: 60000 });
  return { app, page };
}
(async () => {
  const extra = [];
  const check = async (name, fn) => { try { await fn(); extra.push({ paso: name, ok: true }); L('OK   ' + name); } catch (e) { extra.push({ paso: name, ok: false, error: e.message }); L('FAIL ' + name + ': ' + e.message); } };
  let { app, page } = await launch();
  const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
  const setSize = (w, h) => app.evaluate(({ BrowserWindow }, [w, h]) => { const b = BrowserWindow.getAllWindows()[0]; b.unmaximize(); b.setSize(w, h); }, [w, h]);
  await setSize(1366, 768);
  await page.waitForTimeout(800);
  const res = await run(page, { shot, checkinCode: code, photo, log: L });

  await check('escritorio: navegación lateral y panel de resumen (1366x768)', async () => {
    await go(page, '#/inicio');
    assert.ok(await page.isVisible('.side-nav'));
    assert.ok(await page.isVisible('.side-panel .aside-id'));
    assert.ok(!(await page.isVisible('.bottom-nav')));
    await shot('30-escritorio-1366x768');
  });
  for (const [w, h] of [[1920, 1080], [1024, 700], [900, 620]]) {
    await check(`ventana redimensionada ${w}x${h} sin desbordes`, async () => {
      await setSize(w, h);
      await page.waitForTimeout(800);
      await go(page, '#/distritos');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(sw <= 1, 'desborde horizontal ' + sw);
      await shot(`31-distritos-${w}x${h}`);
    });
  }
  await check('maximizar y restaurar', async () => {
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].maximize());
    await page.waitForTimeout(1000);
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMaximized()), true);
    await go(page, '#/monedas');
    await shot('32-maximizada-monedas');
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].unmaximize());
    await page.waitForTimeout(800);
  });
  await check('enlaces externos no navegan dentro de la app', async () => {
    const before = page.url();
    await page.evaluate(() => { const a = document.createElement('a'); a.href = 'https://example.org/'; a.click(); });
    await page.waitForTimeout(1000);
    assert.equal(page.url(), before);
  });
  await app.close();
  await check('sesión persistente cifrada (safeStorage) tras reiniciar', async () => {
    ({ app, page } = await launch());
    await go(page, '#/pasaporte');
    await page.waitForSelector('[data-testid=passport-code]', { timeout: 30000 });
    const ls = await page.evaluate(() => Object.keys(localStorage).join(','));
    assert.ok(!/token|session/i.test(ls));
    await app.close();
  });
  for (const scale of ['1.25', '1.5']) {
    await check(`DPI ${Number(scale) * 100}%`, async () => {
      ({ app, page } = await launch([`--force-device-scale-factor=${scale}`]));
      await app.evaluate(({ BrowserWindow }) => { const b = BrowserWindow.getAllWindows()[0]; b.setSize(1366, 768); });
      await go(page, '#/pasaporte/sellos');
      const dpr = await page.evaluate(() => window.devicePixelRatio);
      assert.equal(dpr, Number(scale));
      await page.screenshot({ path: `${out}/33-dpi-${scale}.png` });
      await app.close();
    });
  }
  await check('sin red: estado honesto y caché pública', async () => {
    ({ app, page } = await launch());
    await go(page, '#/distritos');
    await app.evaluate(({ session }) => session.defaultSession.enableNetworkEmulation({ offline: true }));
    await go(page, '#/inicio');
    await go(page, '#/distritos');
    await page.waitForSelector('.offline-banner', { timeout: 15000 });
    await page.screenshot({ path: `${out}/34-sin-red.png` });
    await go(page, '#/monedas');
    await page.waitForSelector('.state.error', { timeout: 15000 });
    await page.screenshot({ path: `${out}/35-sin-red-privado.png` });
    await app.close();
  });
  fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ plataforma: 'windows-instalado', exe, flujo: res, extra, log }, null, 2));
  if (extra.some((x) => !x.ok)) process.exit(1);
})().catch((e) => { L('ERROR ' + e.stack); fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ error: e.message, log }, null, 2)); process.exit(1); });
