// Panel lateral de escritorio (Windows/web ancho): resumen del pasaporte, progreso y accesos.
import { h, img, progressBar, fmtNum, stampEl, guideBubble } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { state } from '../state.js';
import { api } from '../api.js';

export async function buildAside(el) {
  if (!el || getComputedStyle(el).display === 'none') return;
  if (!state.hasPassport()) {
    el.replaceChildren(h('div.aside-card', img('assets/pasaporte/portada-pasaporte.webp', '', 'aside-cover'), h('p', t('registerSub')), h('a.btn.btn-gold.block', { href: '#/bienvenida' }, t('createPassport'))), guideBubble('atahualpa', t('guideAtahualpaHome')));
    return;
  }
  try {
    const [p, pr, s] = await Promise.all([state.loadPassport(), state.loadProgress(), api('GET', '/pasaporte/sellos')]);
    el.replaceChildren(
      h('a.aside-card.aside-id', { href: '#/pasaporte' }, img('assets/pasaporte/portada-pasaporte.webp', '', 'aside-mini'), h('div', h('small', t('myPassport')), h('b', p.nombres), h('code', p.codigo))),
      h('div.aside-card', h('h3', icon('coins'), t('coins')), h('p.aside-big', fmtNum(pr.monedas.total)), h('p.small', t('coinsInfo'))),
      h('div.aside-card', h('h3', icon('medal'), t('myProgress')), progressBar(pr.sellos.obtenidos, pr.sellos.total, `${pr.sellos.obtenidos}/${pr.sellos.total}`),
        h('div.aside-stamps', s.datos.slice(0, 6).map((x) => stampEl(x, x.obtenido)))),
      h('a.btn.btn-burgundy.block', { href: '#/checkin' }, icon('qr'), t('checkinTitle')),
    );
  } catch { el.replaceChildren(); }
}
