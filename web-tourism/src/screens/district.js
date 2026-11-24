// Portada de distrito (ref. 04 izquierda)
import { h, img, homeTopbar, brandBlock, errorState, offlineBanner, illusBadge, demoBadge, textile } from '../ui.js';
import { t, L, getLang } from '../i18n.js';
import { icon } from '../icons.js';
import { getTerritory } from './data.js';
import { navigate } from '../router.js';

export default async function district({ slug }) {
  let d;
  try { d = await getTerritory(slug); } catch (e) { return h('div.page.page-burgundy', homeTopbar(), errorState(e, () => location.reload())); }
  const name = L(d.nombre);
  const other = getLang() === 'es' ? 'en' : 'es';
  const card = (href, ic, es, en) => h('a.feature-card', { href }, icon(ic), h('span', h('b', getLang() === 'es' ? es : en), h('i', getLang() === 'es' ? en : es)));
  const base = '#/distrito/' + encodeURIComponent(slug);
  return h('div.page.page-burgundy.district',
    h('div.district-hero',
      d.imagen ? img(d.imagen, name, 'dh-bg', { eager: true }) : img('assets/exploracion/tarjeta-cajamarca.webp', '', 'dh-bg dh-generic', { eager: true }),
      h('div.img-badges.dh-badges', illusBadge(true), demoBadge(d.es_demo)),
      homeTopbar(),
      h('div.dh-brand', brandBlock(t('region'), 'small')),
      img('assets/personajes/atahualpa-delia.webp', 'Atahualpa y Delia', 'dh-chars', { eager: true }),
      h('p.speech', h('b', t('welcomeDistrict', name)), getLang() === 'es' ? h('i', `Welcome to ${d.nombre.en} District!`) : null),
    ),
    offlineBanner(d),
    h('section.district-title',
      h('div.dt-ribbon',
        h('h1.gold-title.dt-name', h('span.dt-of', t('districtOf')), ' ', name),
        h('p.dt-sub', t('hcx')), h('p.dt-sub.en', getLang() === 'es' ? 'History, culture and experiences' : 'Historia, cultura y experiencias'),
      ),
    ),
    h('div.pad',
      h('div.desc-card.card', icon('church', 'desc-ic'),
        d.resumen.es
          ? h('div', h('p', L(d.resumen)), d.resumen[other] && d.resumen[other] !== L(d.resumen) ? h('p.alt', d.resumen[other]) : null, demoBadge(d.es_demo))
          : h('p', t('emptyHistory'))),
      h('div.feature-grid',
        card(base + '/historia', 'book', 'Historia', 'History'),
        card(base + '/videos', 'video', 'Videos del lugar', 'Site Videos'),
        card(base + '/audios', 'headphones', 'Audio leyendas', 'Legends Audio'),
        card(base + '/referencias', 'books', 'Referencias literarias', 'Literary References'),
      ),
      h('button.btn.btn-burgundy.block.cta-explore', { type: 'button', onclick: () => navigate('/distrito/' + encodeURIComponent(slug) + '/contenidos') },
        icon('compass'), h('span', h('b', t('exploreDistrict')), h('i', getLang() === 'es' ? 'Explore this district' : 'Explorar este distrito')), icon('chevrons', 'chev')),
    ),
    textile('mt'),
  );
}
