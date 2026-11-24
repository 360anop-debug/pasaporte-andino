// Rutas Turísticas (ref. 05, 7ª)
import { h, img, innerHeader, errorState, emptyState, offlineBanner, demoBadge } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getRoutes } from './data.js';

const THEME_ICON = { historica: 'camera', natural: 'mountain', bienestar: 'wave', cultural: 'mask' };
export default async function routes() {
  let r;
  const header = innerHeader({ title: t('routesTitle'), iconName: 'pin', sub: t('routesSub'), backTo: '/inicio' });
  try { r = await getRoutes(); } catch (e) { return h('div.page.page-burgundy', header, errorState(e, () => location.reload())); }
  return h('div.page.page-burgundy.routes', header, offlineBanner(r),
    h('div.pad.route-cards', r.datos.length ? r.datos.map((x) => h('a.route-card', { href: '#/ruta/' + x.slug, 'data-testid': 'route-card' },
      h('div.rc-img', img(x.imagen, '')),
      h('div.rc-body',
        h('h2', icon(THEME_ICON[x.tema] || 'hiker'), L(x.nombre)),
        h('p', L(x.resumen)),
        h('p.rc-meta', h('span', icon('pin'), t('places', x.num_lugares)), h('span', icon('clock'), L(x.duracion) || '—'), demoBadge(x.es_demo))),
      icon('chevron', 'rc-chev'))) : emptyState(t('emptyRoutes'), 'atahualpa')));
}
