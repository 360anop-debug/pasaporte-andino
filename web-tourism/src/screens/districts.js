// Catálogo de distritos (ref. 03 derecha): búsqueda, filtro, orden, ver todos, ver en mapa.
import { h, img, innerHeader, headerAction, offlineBanner, errorState, emptyState, loading, illusBadge, demoBadge, textile } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getTerritories } from './data.js';
import { navigate, query } from '../router.js';

export function districtCard(d) {
  return h('a.district-card', { href: '#/distrito/' + encodeURIComponent(d.slug), 'data-testid': 'district-card' },
    h('div.dc-img', d.imagen ? img(d.imagen, L(d.nombre)) : h('div.dc-noimg', icon('mountain'))),
    h('div.img-badges', illusBadge(d.imagen && d.imagen_es_ilustracion), demoBadge(d.es_demo)),
    h('div.dc-label',
      h('span.dc-name', icon('pin', 'dc-pin'), L(d.nombre)),
      h('span.dc-places', icon('image'), t('places', d.num_lugares))),
  );
}

export default async function districts() {
  const q0 = query();
  const search = h('input.search-input', { type: 'search', placeholder: t('searchDistrict'), 'aria-label': t('searchDistrict'), value: q0.get('q') || '' });
  const filter = h('select.filter-select', { 'aria-label': t('all') },
    h('option', { value: '' }, t('all')), h('option', { value: 'provincia' }, t('provinces')), h('option', { value: 'distrito' }, t('districts')),
    h('option', { value: 'orden:nombre' }, t('sortName')), h('option', { value: 'orden:lugares' }, t('sortPlaces')));
  filter.value = q0.get('f') || '';
  const grid = h('div.district-grid', loading());
  const more = h('div.more-wrap');
  let expanded = q0.get('todos') === '1';
  let timer;

  async function load() {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('q', search.value.trim());
    const f = filter.value;
    if (f.startsWith('orden:')) params.set('orden', f.slice(6)); else if (f) params.set('tipo', f);
    grid.setAttribute('aria-busy', 'true');
    try {
      const r = await getTerritories(params.toString() ? '?' + params : '');
      const list = r.datos;
      grid.replaceChildren(offlineBanner(r) || '', ...(list.length ? (expanded ? list : list.slice(0, 8)).map(districtCard) : [emptyState(t('noResults'), 'atahualpa')]));
      more.replaceChildren(list.length > 8
        ? h('button.btn.btn-burgundy.view-all', { type: 'button', onclick: () => { expanded = !expanded; load(); } }, expanded ? t('showLess') : t('viewAll', list.length), icon('chevrons'))
        : '');
    } catch (e) {
      grid.replaceChildren(errorState(e, load));
      more.replaceChildren();
    }
    grid.removeAttribute('aria-busy');
    const qs = new URLSearchParams({ ...(search.value ? { q: search.value } : {}), ...(filter.value ? { f: filter.value } : {}) });
    history.replaceState(null, '', '#/distritos' + (qs.toString() ? '?' + qs : ''));
  }
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 250); });
  filter.addEventListener('change', load);
  load();

  return h('div.page.page-burgundy.districts',
    innerHeader({ title: t('districtsTitle'), sub: t('districtsSub'), action: headerAction('map', t('viewMap'), () => navigate('/mapa')) }),
    h('div.search-row', h('label.search-box', icon('search'), search), h('label.filter-box', icon('filter'), filter)),
    grid,
    more,
    h('div.districts-foot', textile(), img('assets/rutas/ruta-natural.webp', '', 'df-img')),
  );
}
