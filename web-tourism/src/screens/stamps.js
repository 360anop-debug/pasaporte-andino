// Pasaporte de sellos (ref. 06 derecha): sellos reales del servidor; bloqueados en gris con candado.
import { h, img, innerHeader, errorState, progressBar, stampEl, guideBubble, textile, fmtDate } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';
import { state } from '../state.js';

// Ornamentos dorados del libro de sellos (ref. 06): esquinas escalonadas andinas y ramas de laurel. SVG estáticos.
const CORNER = '<svg viewBox="0 0 60 60"><defs><linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0ad"/><stop offset=".5" stop-color="#d99a2b"/><stop offset="1" stop-color="#8a5410"/></linearGradient></defs><g fill="none" stroke="url(#gc)" stroke-width="3" stroke-linecap="round"><path d="M4 56V4h52"/><path d="M12 48V12h36"/><path d="M12 24h8v-8h8V12M24 12v8h-8"/><path d="M4 30c8 0 10 6 18 6M30 4c0 8 6 10 6 18"/></g><rect x="18" y="18" width="8" height="8" transform="rotate(45 22 22)" fill="url(#gc)"/></svg>';
const LAUREL = '<svg viewBox="0 0 40 60"><g fill="#b7802b"><path d="M30 58C16 48 10 32 14 6" fill="none" stroke="#8a5410" stroke-width="2.4"/><ellipse cx="9" cy="14" rx="7" ry="3.4" transform="rotate(60 9 14)"/><ellipse cx="20" cy="12" rx="7" ry="3.4" transform="rotate(-50 20 12)"/><ellipse cx="8" cy="27" rx="7" ry="3.4" transform="rotate(50 8 27)"/><ellipse cx="20" cy="25" rx="7" ry="3.4" transform="rotate(-40 20 25)"/><ellipse cx="11" cy="40" rx="7" ry="3.4" transform="rotate(35 11 40)"/><ellipse cx="24" cy="38" rx="7" ry="3.4" transform="rotate(-30 24 38)"/></g></svg>';

export default async function stamps() {
  let s, pr;
  try { [s, pr] = await Promise.all([api('GET', '/pasaporte/sellos'), state.loadProgress()]); }
  catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('myPassport') }), errorState(e, () => location.reload())); }
  return h('div.page.page-burgundy.stamps-page',
    h('div.stamps-top', img('assets/fondos_texturas/fondo-bienvenida.webp', '', 'st-bg'), innerHeader({ title: t('myPassport'), backTo: '/pasaporte' })),
    h('div.stamp-book',
      h('div.sb-rings', { 'aria-hidden': 'true' }),
      ['tl', 'tr', 'bl', 'br'].map((c) => h('span.sb-corner.' + c, { 'aria-hidden': 'true', html: CORNER })),
      h('h2.sb-title', h('span.laurel', { 'aria-hidden': 'true', html: LAUREL }), h('span', t('stampsTitle')), h('span.laurel.r', { 'aria-hidden': 'true', html: LAUREL })),
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
