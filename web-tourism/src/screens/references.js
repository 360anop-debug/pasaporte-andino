// Referencias literarias (ref. 05, 6ª): enlazadas a la Biblioteca Viva por ID (adaptador).
import { h, img, innerHeader, errorState, emptyState, offlineBanner, demoBadge, guideBubble } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getTerritory } from './data.js';

export default async function references({ slug }) {
  let d;
  try { d = await getTerritory(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('litRefs') }), errorState(e, () => location.reload())); }
  const refs = d.contenidos.referencia;
  return h('div.page.page-burgundy.refs',
    innerHeader({ title: t('litRefs'), iconName: 'book', backTo: '/distrito/' + encodeURIComponent(slug) }),
    offlineBanner(d),
    h('div.refs-sheet.parchment',
      refs.length ? h('ul.ref-list', refs.map((r) => h('li', h('a.ref-item', { href: '#/lectura/' + r.id },
        h('span.ref-book', icon('book')), h('span', h('b', L(r.titulo)), h('i', r.autor || r.fuente || ''), demoBadge(r.es_demo)), icon('chevron')))))
        : emptyState(t('emptyRefs'), 'delia'),
      guideBubble('delia', t('guideDeliaRead')),
      img('assets/cultura/biblioteca-cultural.webp', '', 'refs-art'),
    ),
  );
}
