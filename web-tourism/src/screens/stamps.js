// Pasaporte de sellos (ref. 06 derecha): sellos reales del servidor; bloqueados en gris con candado.
import { h, img, innerHeader, errorState, progressBar, stampEl, guideBubble, textile, fmtDate } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';
import { state } from '../state.js';

export default async function stamps() {
  let s, pr;
  try { [s, pr] = await Promise.all([api('GET', '/pasaporte/sellos'), state.loadProgress()]); }
  catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('myPassport') }), errorState(e, () => location.reload())); }
  return h('div.page.page-burgundy.stamps-page',
    h('div.stamps-top', img('assets/fondos_texturas/fondo-bienvenida.webp', '', 'st-bg'), innerHeader({ title: t('myPassport'), backTo: '/pasaporte' })),
    h('div.stamp-book',
      h('div.sb-rings', { 'aria-hidden': 'true' }),
      h('h2.sb-title', h('span.laurel', '❦'), t('stampsTitle'), h('span.laurel.r', '❦')),
      h('ul.stamp-grid', s.datos.map((x) => h('li', { title: x.obtenido ? `${t('obtainedOn')} ${fmtDate(x.obtenido_at)}` : t('locked') }, stampEl(x, x.obtenido),
        h('span.sr-only', L(x.territorio.nombre) + ': ' + (x.obtenido ? t('achieved') : t('locked')))))),
    ),
    h('section.progress-panel',
      img('assets/monedas/medalla-coleccion.webp', '', 'pp-medal'),
      h('div', h('h2.pp-title', t('myProgress')), progressBar(pr.sellos.obtenidos, pr.sellos.total, t('ofDistricts', pr.sellos.obtenidos, pr.sellos.total)))),
    h('div.llama-note', h('div.ln-card', icon('camera'), h('p', t('keepExploring'))), img('assets/personajes/llama-recompensas.webp', 'Llama', 'ln-llama')),
    textile(),
  );
}
