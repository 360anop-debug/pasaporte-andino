// Check-in presencial: QR oficial del lugar (cámara del sistema o texto). El servidor valida firma/expiración.
import jsQR from 'jsqr';
import { h, img, innerHeader, toast, stampEl } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api, newIdemKey } from '../api.js';
import { navigate } from '../router.js';

async function decodeFile(f) {
  const bmp = await createImageBitmap(f);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  const g = c.getContext('2d');
  g.drawImage(bmp, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height);
  return jsQR(d.data, d.width, d.height)?.data || null;
}

export default async function checkin({ code } = {}) {
  const input = h('input.input', { id: 'code', placeholder: t('codePlaceholder'), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: code || '' });
  const out = h('div.checkin-result', { role: 'status' });
  const btn = h('button.btn.btn-burgundy.block', { type: 'submit' }, icon('check'), t('verify'));
  const cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'sr-only', id: 'qrcam' });
  const idem = newIdemKey(); // misma clave en reintentos del mismo intento → idempotente
  cam.addEventListener('change', async () => {
    const f = cam.files?.[0];
    if (!f) return;
    try { const v = await decodeFile(f); if (v) { input.value = v; submit(); } else toast(t('qrNotFound'), 'error'); } catch { toast(t('qrNotFound'), 'error'); }
  });
  async function submit(e) {
    e?.preventDefault();
    if (!input.value.trim()) { input.focus(); return; }
    btn.disabled = true;
    out.replaceChildren();
    try {
      const r = await api('POST', '/checkin', { json: { codigo: input.value.trim() }, idem });
      const place = (await api('GET', '/destinos', { publicCache: true })).datos.find((d) => d.id === r.destino_id);
      out.replaceChildren(h('div.card.pad-card.checkin-ok',
        h('h2.title-ink', icon('check'), ' ', r.visita === 'registrado' ? t('checkinOk') : t('alreadyVisited')),
        place ? h('p', h('b', L(place.nombre)), ' · ', L(place.territorio.nombre)) : null,
        r.monedas ? h('p.coins-earned', img('assets/monedas/moneda-base.webp', '', 'li-coin'), '+' + r.monedas + ' ' + t('coinsUnit')) : null,
        r.sello_nuevo ? h('p.new-stamp', icon('medal'), t('newStamp')) : null,
        r.rutas_completadas?.length ? h('p.new-stamp', icon('trophy'), t('routeDone')) : null,
        h('a.btn.btn-gold.block', { href: '#/pasaporte/sellos' }, t('viewStampPassport'))));
      localStorage.setItem('pa-news-latest', String(Date.now()));
    } catch (x) {
      out.replaceChildren(h('div.state.error', icon('info'), h('p', x.message)));
    }
    btn.disabled = false;
  }
  if (code) setTimeout(submit, 50);
  return h('div.page.page-burgundy',
    innerHeader({ title: t('checkinTitle'), iconName: 'qr', sub: t('checkinSub'), backTo: '/pasaporte' }),
    h('div.pad.stack',
      h('form.card.pad-card.stack', { onsubmit: submit },
        h('label.btn.btn-gold.block', { for: 'qrcam', role: 'button', tabindex: '0' }, icon('camera'), t('scanPhoto')), cam,
        h('p.center.muted', t('orType')), input, btn),
      out,
      h('p.muted.on-dark.small', t('stampRule')),
    ));
}
