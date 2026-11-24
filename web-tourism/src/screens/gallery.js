import { h, img, innerHeader, errorState, emptyState, sheet, illusBadge, demoBadge } from '../ui.js';
import { t, L } from '../i18n.js';
import { getTerritory } from './data.js';
import { credits } from './player.js';

export default async function gallery({ slug }) {
  let d;
  try { d = await getTerritory(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('gallery') }), errorState(e, () => location.reload())); }
  const g = d.contenidos.galeria;
  return h('div.page.page-burgundy',
    innerHeader({ title: L(d.nombre) + ' - ' + t('gallery'), iconName: 'image', backTo: '/distrito/' + encodeURIComponent(slug) + '/contenidos' }),
    h('div.pad', g.length ? h('div.gallery-grid', g.map((x) => h('button.gg-item', { type: 'button', onclick: () => sheet(L(x.titulo), h('div.stack', img(x.media_url, L(x.titulo), 'gg-full'), credits(x))) },
      img(x.media_url, L(x.titulo)), h('div.img-badges', illusBadge(x.es_ilustracion), demoBadge(x.es_demo)), h('span', L(x.titulo))))) : emptyState(t('emptyGallery'), null)),
  );
}
