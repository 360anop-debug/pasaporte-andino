// Flujo E2E compartido (Android WebView y Windows/Electron instalado) contra el backend real de staging.
// No usa datos de las referencias: crea un viajero nuevo, verifica visitas con QR firmados y comprueba
// que sellos/monedas/álbum provienen del servidor.
const assert = require('node:assert/strict');

async function waitReady(page) {
  await page.waitForFunction(() => window.__paReady === true, null, { timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('.screen > .state.loading'), null, { timeout: 30000 }).catch(() => {});
}
async function go(page, hash) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForTimeout(400);
  await page.waitForFunction(() => !document.querySelector('.screen > .state.loading'), null, { timeout: 30000 });
  await page.waitForTimeout(500);
}

/**
 * @param page Página Playwright
 * @param {{shot:(n:string)=>Promise<void>, checkinCode:(slug:string)=>string, photo:string, log:(m:string)=>void}} h
 */
async function run(page, h) {
  const results = [];
  const step = async (name, fn) => {
    const t0 = Date.now();
    try { await fn(); results.push({ paso: name, ok: true, ms: Date.now() - t0 }); h.log(`OK   ${name}`); }
    catch (e) {
      const ctx = await page.evaluate(() => ({ hash: location.hash, errores: [...document.querySelectorAll('.field-err, .form-err, .state.error, .toast')].map((x) => x.textContent.trim()).filter(Boolean) })).catch(() => ({}));
      results.push({ paso: name, ok: false, error: String(e.message || e).slice(0, 400), contexto: ctx }); h.log(`FAIL ${name}: ${e.message} · contexto ${JSON.stringify(ctx)}`); await h.shot('FALLO-' + name.replace(/\W+/g, '_')).catch(() => {}); throw e; }
  };
  await step('arranque y bienvenida', async () => {
    await waitReady(page);
    await go(page, '#/bienvenida');
    await page.waitForSelector('#nombres');
    await h.shot('01-registro');
  });
  await step('validación cliente (sin consentimiento)', async () => {
    await page.fill('#nombres', 'Lucía');
    await page.fill('#apellidos', 'Chávez Rojas');
    await page.click('form button[type=submit]');
    assert.ok((await page.textContent('.form-err')).length > 0);
  });
  await step('registro con foto opcional', async () => {
    if (h.photo) await page.setInputFiles('#foto', h.photo);
    await page.check('#consent');
    await page.click('form button[type=submit]');
    await page.waitForSelector('[data-testid=passport-code]', { timeout: 30000 });
    const code = await page.textContent('[data-testid=passport-code]');
    assert.match(code, /^PA-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    await page.waitForSelector('.pc-qr svg');
    await h.shot('02-pasaporte-creado');
  });
  if (h.soloRegistro) return results;
  await step('inicio y Mi Pasaporte desde la barra', async () => {
    await go(page, '#/inicio');
    await h.shot('03-inicio');
    assert.equal(await page.textContent('[data-testid=home-coins]'), '0');
    await go(page, '#/distritos');
    await page.click('a.nav-item[href="#/pasaporte"], a.side-item[href="#/pasaporte"] >> visible=true');
    await page.waitForSelector('.passport-card');
    assert.ok((await page.evaluate(() => location.hash)).startsWith('#/pasaporte'));
    await h.shot('04-mi-pasaporte');
  });
  await step('catálogo, búsqueda y filtro', async () => {
    await go(page, '#/distritos');
    await page.waitForSelector('[data-testid=district-card]');
    await h.shot('05-distritos');
    await page.fill('.search-input', 'Celend');
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=district-card]').length === 1);
    await page.fill('.search-input', '');
    await page.selectOption('.filter-select', 'distrito');
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=district-card]').length === 1);
  });
  await step('distrito, historia, video y audio', async () => {
    await go(page, '#/distrito/cajamarca');
    await h.shot('06-distrito');
    await go(page, '#/distrito/cajamarca/contenidos');
    await h.shot('07-contenidos');
    await go(page, '#/distrito/cajamarca/historia');
    await page.click('.pill-tabs .tab:nth-child(2)');
    await page.waitForSelector('.timeline li');
    await go(page, '#/distrito/cajamarca/videos');
    await page.click('.big-play');
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.currentTime > 0.5; }, null, { timeout: 20000 });
    await page.click('.vp-controls .vp-btn');
    assert.equal(await page.evaluate(() => document.querySelector('video').paused), true);
    await h.shot('08-video');
    await go(page, '#/distrito/cajamarca/audios');
    await page.click('.audio-hero .ap-play');
    await page.waitForFunction(() => document.querySelector('audio').currentTime > 0.3, null, { timeout: 20000 });
    await page.click('.audio-hero .ap-play');
  });
  await step('lector de Biblioteca (progreso servidor)', async () => {
    await go(page, '#/distrito/cajamarca/referencias');
    await page.click('.ref-item');
    await page.waitForSelector('.reader-body');
    await page.click('.reader-nav .btn-burgundy');
    await page.click('.reader-nav .btn-burgundy');
    await page.waitForSelector('.reader-sheet .btn-gold:not([hidden])');
    await h.shot('09-lector');
  });
  await step('check-in QR firmado → sello y monedas del servidor', async () => {
    for (const slug of ['plaza-de-armas-cajamarca', 'complejo-banos-del-inca']) {
      await go(page, '#/checkin/' + encodeURIComponent(h.checkinCode(slug)));
      await page.waitForSelector('.checkin-ok', { timeout: 30000 });
    }
    await h.shot('10-checkin');
    await go(page, '#/monedas');
    const total = await page.textContent('[data-testid=coin-total]');
    assert.equal(total.replace(/\D/g, ''), '400'); // 100+100 visitas + 200 ruta de bienestar
    await h.shot('11-monedas');
    await go(page, '#/pasaporte/sellos');
    assert.equal(await page.locator('.stamp-grid .stamp.got').count(), 2);
    await h.shot('12-sellos');
    await go(page, '#/monedas/coleccion');
    assert.equal(await page.locator('.coin-grid .coin.got').count(), 2);
    await h.shot('13-coleccion');
  });
  await step('álbum: subir foto privada', async () => {
    await go(page, '#/album');
    await page.click('.add-photo');
    await page.setInputFiles('#album-file', h.photo);
    await page.click('.sheet button[type=submit]');
    await page.waitForSelector('.polaroid .pol-img img', { timeout: 30000 });
    await h.shot('14-album');
  });
  await step('rutas, idioma EN y retorno a ES', async () => {
    await go(page, '#/rutas');
    await page.waitForSelector('[data-testid=route-card]');
    await h.shot('15-rutas');
    await go(page, '#/inicio');
    await page.locator('button.lang-pill[lang=en]:visible').first().click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    await h.shot('16-inicio-en');
    await page.locator('button.lang-pill[lang=es]:visible').first().click();
  });
  return results;
}
module.exports = { run, waitReady, go };
