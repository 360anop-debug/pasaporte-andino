import { h, img, innerHeader, errorState, emptyState, progressBar, demoBadge, iconBtn } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getRoute } from './data.js';
import { state } from '../state.js';
import { api } from '../api.js';
import { shareContent } from './share.js';

export default async function routeDetail({ slug }) {
  let r;
  try { r = await getRoute(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('tileRoutes'), backTo: '/rutas' }), errorState(e, () => location.reload())); }
  let visited = new Set();
  if (state.hasPassport()) { try { visited = new Set((await api('GET', '/pasaporte/visitas')).datos.map((v) => v.slug)); } catch { /* */ } }
  const done = r.destinos.filter((d) => visited.has(d.slug)).length;
  return h('div.page.page-burgundy.route-detail',
    innerHeader({ title: L(r.nombre), backTo: '/rutas', action: iconBtn('share', t('share'), () => shareContent({ type: 'ruta', slug: r.slug, title: L(r.nombre), text: L(r.resumen), image: r.imagen })) }),
    h('div.pad.stack',
      h('div.gold-frame', h('div', img(r.imagen, L(r.nombre), '', { eager: true }))),
      h('div.card.pad-card', h('p', L(r.resumen)), h('p.rc-meta', icon('clock'), L(r.duracion) || '—', ' ', demoBadge(r.es_demo)),
        state.hasPassport() && r.destinos.length ? progressBar(done, r.destinos.length, t('routeProgress', done, r.destinos.length)) : null,
        done && done === r.destinos.length ? h('p.verified', icon('trophy'), t('routeDone')) : null),
      h('h2.section-ribbon', icon('pin'), t('stops')),
      r.destinos.length ? h('ol.stop-list', r.destinos.map((d, i) => h('li', h('a.stop.card', { href: '#/destino/' + d.slug },
        h('span.stop-n', String(i + 1)), img(d.imagen, '', 'stop-img'), h('div', h('b', L(d.nombre)), h('span', L(d.territorio.nombre))),
        visited.has(d.slug) ? h('span.stop-ok', { 'aria-label': t('visitedVerified') }, icon('check')) : icon('chevron'))))) : emptyState(t('emptyPlaces'), null),
    ));
}
