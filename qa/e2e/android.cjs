// E2E en emulador Android: APK de staging (WebView depurable) contra backend real en el host (10.0.2.2:8080).
// Uso: node qa/e2e/android.cjs <outDir>
const { _android } = require('playwright');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { run, go } = require('./flujo.cjs');
const PKG = 'net.aprep.region.pasaporteandino';
const out = process.argv[2] || 'qa/capturas/android';
fs.mkdirSync(out, { recursive: true });
const log = [];
const L = (m) => { log.push(`[${new Date().toISOString()}] ${m}`); console.log(m); };
const code = (slug) => execSync(`bash -c 'set -a; . scripts/staging.env.sh; php backend-integration/bin/admin.php codigo-checkin ${slug} 1 100'`).toString().split('\n')[0].trim();

(async () => {
  const [device] = await _android.devices();
  assert.ok(device, 'sin dispositivo adb');
  L(`dispositivo: ${device.model()} ${device.serial()}`);
  const sh = async (c) => (await device.shell(c)).toString();
  const shot = (n) => device.screenshot({ path: `${out}/${n}.png` });
  const extra = [];
  const check = async (name, fn) => { try { await fn(); extra.push({ paso: name, ok: true }); L('OK   ' + name); } catch (e) { extra.push({ paso: name, ok: false, error: e.message }); L('FAIL ' + name + ': ' + e.message); } };

  await sh(`am start -W -n ${PKG}/.MainActivity`);
  const webview = await device.webView({ pkg: PKG }, { timeout: 60000 });
  const page = await webview.page();
  const res = await run(page, { shot, checkinCode: code, photo: { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync('qa/fixtures/foto-prueba.jpg') }, log: L });

  await check('botón Atrás de Android vuelve al contexto anterior', async () => {
    await go(page, '#/distritos');
    await go(page, '#/distrito/cajamarca');
    await sh('input keyevent 4');
    await page.waitForFunction(() => location.hash.startsWith('#/distritos'), null, { timeout: 10000 });
  });
  await check('selector de fotos del sistema (sin permisos de cámara declarados)', async () => {
    await go(page, '#/album');
    await page.click('.add-photo');
    await page.click('label.upload-drop');
    await page.waitForTimeout(3000);
    const top = await sh('dumpsys activity activities | grep -E "topResumedActivity|mResumedActivity" | head -3');
    L('actividad al abrir selector: ' + top.trim());
    await shot('20-selector-fotos');
    assert.ok(!top.includes(PKG + '/.MainActivity') || /documentsui|photopicker|chooser|gallery/i.test(top), 'no se abrió el selector');
    await sh('input keyevent 4');
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape').catch(() => {});
  });
  await check('compartir abre la hoja nativa de Android', async () => {
    await go(page, '#/destino/cumbemayo');
    await page.click('.inner-header .icon-btn[aria-label="Compartir"]');
    await page.waitForTimeout(2500);
    const top = await sh('dumpsys activity activities | grep -E "topResumedActivity|mResumedActivity" | head -3');
    L('actividad al compartir: ' + top.trim());
    await shot('21-compartir-nativo');
    assert.match(top, /Chooser|chooser|ResolverActivity|intentresolver/i);
    await sh('input keyevent 4');
    await page.waitForTimeout(1500);
  });
  await check('retorno desde otra app conserva estado y sesión', async () => {
    await go(page, '#/monedas');
    await sh('input keyevent 3');
    await page.waitForTimeout(2000);
    await sh(`am start -W -n ${PKG}/.MainActivity`);
    await page.waitForTimeout(2500);
    const hash = await page.evaluate(() => location.hash);
    assert.ok(hash.startsWith('#/monedas'), 'hash=' + hash);
  });
  await check('orientación horizontal', async () => {
    await sh('settings put system accelerometer_rotation 0; settings put system user_rotation 1');
    await page.waitForTimeout(2500);
    await shot('22-horizontal');
    await sh('settings put system user_rotation 0');
    await page.waitForTimeout(1500);
  });
  await check('sesión persistente tras cierre forzado (almacenamiento seguro)', async () => {
    await sh(`am force-stop ${PKG}`);
    await sh(`am start -W -n ${PKG}/.MainActivity`);
    const wv2 = await device.webView({ pkg: PKG }, { timeout: 60000 });
    const p2 = await wv2.page();
    await p2.waitForFunction(() => window.__paReady === true, null, { timeout: 60000 });
    await p2.evaluate(() => { location.hash = '#/pasaporte'; });
    await p2.waitForSelector('[data-testid=passport-code]', { timeout: 30000 });
    const ls = await p2.evaluate(() => Object.keys(localStorage).join(','));
    assert.ok(!/token|session/i.test(ls), 'token en localStorage: ' + ls);
    await shot('23-sesion-persistente');
  });
  fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ plataforma: 'android-emulador', dispositivo: device.model(), flujo: res, extra, log }, null, 2));
  await device.close();
  if (extra.some((x) => !x.ok)) process.exit(1);
})().catch((e) => { L('ERROR ' + e.stack); fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ error: e.message, log }, null, 2)); process.exit(1); });
