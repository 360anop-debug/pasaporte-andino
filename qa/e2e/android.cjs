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
// Vigilante: nunca bloquear el pipeline por un cuelgue de la WebView/adb.
setTimeout(() => { console.log('ERROR vigilante: E2E Android superó 25 min'); try { fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ error: 'timeout 25 min', log }, null, 2)); } catch {} process.exit(2); }, 25 * 60 * 1000).unref();
const log = [];
const L = (m) => { log.push(`[${new Date().toISOString()}] ${m}`); console.log(m); };
const code = (slug) => execSync(`bash -c 'set -a; . scripts/staging.env.sh; php backend-integration/bin/admin.php codigo-checkin ${slug} 1 100'`).toString().split('\n')[0].trim();

(async () => {
  const [device] = await _android.devices();
  assert.ok(device, 'sin dispositivo adb');
  L(`dispositivo: ${device.model()} ${device.serial()}`);
  const sh = async (c) => (await device.shell(c)).toString();
  const nativeShot = (n) => device.screenshot({ path: `${out}/${n}.png` });
  let shot = nativeShot; // se sustituye por la captura de la WebView cuando la página está adjunta
  const extra = [];
  const check = async (name, fn) => { try { await fn(); extra.push({ paso: name, ok: true }); L('OK   ' + name); } catch (e) { extra.push({ paso: name, ok: false, error: e.message }); L('FAIL ' + name + ': ' + e.message); } };

  // La WebView sustituye su página inicial (about:blank) por la app al arrancar: se re-adquiere hasta que la app está lista.
  async function appPage() {
    const t0 = Date.now();
    let last;
    while (Date.now() - t0 < 120000) {
      try {
        if (!(await sh(`pidof ${PKG}`)).trim()) { L('[adjuntar] app no está en ejecución: se relanza'); await sh(`am start -W -n ${PKG}/.MainActivity`); }
        const wv = await device.webView({ pkg: PKG }, { timeout: 30000 });
        const p = await wv.page();
        await p.waitForFunction(() => window.__paReady === true || window.__paIncompatible === true, null, { timeout: 15000 });
        return p;
      } catch (e) { last = e; await new Promise((r) => setTimeout(r, 2000)); }
    }
    throw last;
  }
  // Envoltorio resiliente: si el destino de la WebView se reemplaza (p. ej. recreación de la actividad o del
  // renderer), se vuelve a adjuntar y se reintenta la operación una vez. Se registra cada evento para diagnóstico.
  function resilient() {
    let cur = null;
    const attach = async () => {
      cur = await appPage();
      const pid = (await sh(`pidof ${PKG}`)).trim();
      L(`adjuntado a WebView ${cur.url()} (pid app ${pid})`);
      cur.on('close', () => L('[evento] página de la WebView cerrada'));
      cur.on('crash', () => L('[evento] renderer de la WebView caído'));
      cur.on('pageerror', (e) => L('[pageerror] ' + e.message));
      cur.on('console', (m) => { if (m.type() === 'error') L('[consola] ' + m.text()); });
      return cur;
    };
    const sync = new Set(['locator', 'keyboard', 'url']);
    return { attach, page: new Proxy({}, {
      get(_, prop) {
        if (sync.has(prop)) { const v = cur[prop]; return typeof v === 'function' ? v.bind(cur) : v; }
        return async (...args) => {
          for (let i = 0; ; i++) {
            try {
              if (!cur || cur.isClosed()) await attach();
              return await cur[prop](...args);
            } catch (e) {
              if (i >= 2 || !/closed|Target/i.test(String(e.message))) throw e;
              L(`[reintento ${i + 1}] ${prop}: ${e.message.split('\n')[0]}`);
              cur = null;
            }
          }
        };
      },
    }) };
  }
  await sh(`am start -W -n ${PKG}/.MainActivity`);
  const r = resilient();
  await r.attach();
  const page = r.page;
  if (await page.evaluate(() => window.__paIncompatible === true)) {
    const ver = (await sh('dumpsys package com.android.webview | grep -m1 versionName || dumpsys package com.google.android.webview | grep -m1 versionName')).trim();
    L('Motor web antiguo detectado (' + ver + '): la app muestra el aviso de actualización de Android System WebView.');
    await nativeShot('00-aviso-webview-antiguo');
    fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ plataforma: 'android-emulador', dispositivo: device.model(), webview: ver, resultado: 'MOTOR_WEB_ANTIGUO_AVISO_MOSTRADO', log }, null, 2));
    await device.close();
    process.exit(0);
  }
  shot = async (n) => { try { await page.screenshot({ path: `${out}/${n}.png` }); } catch { await nativeShot(n); } };
  const PARTE = process.env.PA_E2E_PARTE || 'todo'; // flujo | nativo | todo
  L('parte del E2E: ' + PARTE);
  const res = await run(page, { soloRegistro: PARTE === 'nativo', shot: (n) => shot(n), checkinCode: code, photo: { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync('qa/fixtures/foto-prueba.jpg') }, log: L });

  if (PARTE === 'flujo') {
    fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ plataforma: 'android-emulador', parte: PARTE, dispositivo: device.model(), flujo: res, log }, null, 2));
    await device.close();
    process.exit(res.every((x) => x.ok) ? 0 : 1);
  }
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
    await nativeShot('20-selector-fotos');
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
    await nativeShot('21-compartir-nativo');
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
    await nativeShot('22-horizontal');
    await sh('settings put system user_rotation 0');
    await page.waitForTimeout(1500);
  });
  await check('sesión persistente tras cierre forzado (almacenamiento seguro)', async () => {
    await sh(`am force-stop ${PKG}`);
    await sh(`am start -W -n ${PKG}/.MainActivity`);
    const p2 = await appPage();
    await p2.evaluate(() => { location.hash = '#/pasaporte'; });
    await p2.waitForSelector('[data-testid=passport-code]', { timeout: 30000 });
    const ls = await p2.evaluate(() => Object.keys(localStorage).join(','));
    assert.ok(!/token|session/i.test(ls), 'token en localStorage: ' + ls);
    await nativeShot('23-sesion-persistente');
  });
  fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ plataforma: 'android-emulador', parte: PARTE, dispositivo: device.model(), flujo: res, extra, log }, null, 2));
  await device.close();
  if (extra.some((x) => !x.ok)) process.exit(1);
})().catch((e) => { L('ERROR ' + e.stack); fs.writeFileSync(`${out}/resultado.json`, JSON.stringify({ error: e.message, log }, null, 2)); process.exit(1); });
