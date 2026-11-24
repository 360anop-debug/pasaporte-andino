// Detalle de lugar: galería, historia, multimedia, biblioteca, ubicación validada, rutas y compartir.
import { h, img, innerHeader, errorState, emptyState, demoBadge, illusBadge, offlineBanner, iconBtn } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getPlace } from './data.js';
import { navigate } from '../router.js';
import { openExternal } from '../platform.js';
import { state } from '../state.js';
import { api } from '../api.js';
import { shareContent } from './share.js';
import { videoPlayer, audioPlayer, credits } from './player.js';

export default async function place({ slug }) {
  let p;
  try { p = await getPlace(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('placeDetail') }), errorState(e, () => location.reload())); }
  const name = L(p.nombre);
  const visited = h('div.visit-state');
  if (state.hasPassport()) {
    api('GET', '/pasaporte/visitas').then((r) => {
      const v = r.datos.find((x) => x.slug === p.slug);
      visited.replaceChildren(v ? h('p.verified', icon('check'), t('visitedVerified')) : h('a.btn.btn-gold.block', { href: '#/checkin' }, icon('qr'), t('checkinHere')));
    }).catch(() => {});
  } else visited.replaceChildren(h('a.btn.btn-gold.block', { href: '#/bienvenida' }, icon('qr'), t('checkinHere')));
  const loc = p.ubicacion;
  const c = p.contenidos;
  return h('div.page.page-burgundy.place',
    innerHeader({ title: name, backTo: '/distrito/' + p.territorio.slug, action: iconBtn('share', t('share'), () => shareContent({ type: 'destino', slug: p.slug, title: name, text: L(p.territorio.nombre) + ' · Cajamarca', image: p.imagen })) }),
    offlineBanner(p),
    h('div.pad.stack',
      h('div.gold-frame.place-hero', h('div', img(p.imagen, name, '', { eager: true }), h('div.img-badges', illusBadge(p.imagen_es_ilustracion), demoBadge(p.es_demo)))),
      h('div.card.place-info',
        h('p.chip-row', h('span.chip', t('cat.' + p.categoria)), ...p.etiquetas.map((e) => h('span.chip.soft', e))),
        h('p', L(p.resumen) || t('emptyHistory')),
        p.fuente ? h('p.credits', h('b', t('source') + ': '), p.fuente) : null),
      visited,
      h('section.card.place-loc', h('h2.title-ink', icon('pin'), t('location')),
        loc ? h('div', h('p', `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`), loc.validada ? null : h('p.muted', t('locationPending')),
          h('button.btn.btn-burgundy.sm', { type: 'button', onclick: () => openExternal(`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`) }, icon('map'), t('openMaps')))
          : h('p.muted', t('noLocation'))),
      c.historia.map((x) => h('article.card.place-block', h('h2.title-ink', L(x.titulo)), h('p', L(x.cuerpo)), credits(x))),
      c.video.map((x) => h('div.gold-frame', videoPlayer(x))),
      c.audio.map((x) => h('div.card.place-block', h('b', L(x.titulo)), audioPlayer(x))),
      c.referencia.length ? h('section.card.place-block', h('h2.title-ink', t('litRefs')), c.referencia.map((r) => h('a.ref-item', { href: '#/lectura/' + r.id }, icon('book'), h('b', L(r.titulo)), icon('chevron')))) : null,
      h('section', h('h2.section-ribbon', icon('hiker'), t('routesWithPlace')),
        p.rutas.length ? h('div.route-list', p.rutas.map((r) => h('a.route-mini.card', { href: '#/ruta/' + r.slug }, img(r.imagen, ''), h('b', L(r.nombre)), icon('chevron')))) : emptyState(t('emptyRoutes'), null)),
      h('button.btn.btn-ghost.block', { type: 'button', onclick: () => shareContent({ type: 'destino', slug: p.slug, title: name, text: L(p.territorio.nombre) + ' · Cajamarca', image: p.imagen }) }, icon('share'), t('share')),
    ),
  );
}
