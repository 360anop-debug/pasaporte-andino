// Contenidos del distrito (ref. 04 derecha): historia, videos, audio, referencias, galería, lugares relacionados.
import { h, img, innerHeader, headerAction, errorState, emptyState, offlineBanner, demoBadge, illusBadge, fmtDuration } from '../ui.js';
import { t, L, getLang } from '../i18n.js';
import { icon } from '../icons.js';
import { getTerritory } from './data.js';
import { navigate } from '../router.js';
import { audioPlayer } from './player.js';

export default async function districtContents({ slug }) {
  let d;
  try { d = await getTerritory(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('districtsTitle'), backTo: '/distritos' }), errorState(e, () => location.reload())); }
  const c = d.contenidos;
  const base = '/distrito/' + encodeURIComponent(slug);
  const name = L(d.nombre);
  const ribbon = (ic, es, en, id) => h('h2.section-ribbon', { id }, icon(ic), getLang() === 'es' ? es : en, h('em', ' / ' + (getLang() === 'es' ? en : es)));
  const sections = {};
  const tabs = [['historia', 'book', 'Historia', 'History'], ['videos', 'video', 'Videos', 'Videos'], ['audio', 'headphones', 'Audio', 'Audio'], ['referencias', 'books', 'Referencias', 'References']];
  const tabBar = h('div.tabs.content-tabs', { role: 'tablist' }, tabs.map(([k, ic, es, en], i) => h('button.tab', {
    type: 'button', role: 'tab', 'aria-selected': String(i === 0), 'aria-controls': 'sec-' + k,
    onclick: (e) => { tabBar.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', 'false')); e.currentTarget.setAttribute('aria-selected', 'true'); sections[k].scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  }, icon(ic), h('span', getLang() === 'es' ? es : en, i === 0 ? h('small', getLang() === 'es' ? en : es) : null))));

  const hist = c.historia[0];
  sections.historia = h('section.cblock', { id: 'sec-historia' }, ribbon('book', 'Historia', 'History'),
    hist ? h('a.hist-card', { href: '#' + base + '/historia' },
      h('div.hc-img', img(hist.poster_url || d.imagen, '', ''), h('div.img-badges', illusBadge(hist.es_ilustracion), demoBadge(hist.es_demo))),
      h('div.hc-quote', h('p', L(hist.cuerpo)), getLang() === 'es' && hist.cuerpo.en ? h('p.alt', hist.cuerpo.en) : null))
      : emptyState(t('emptyHistory'), 'atahualpa'));

  sections.videos = h('section.cblock', { id: 'sec-videos' }, ribbon('video', 'Videos del lugar', 'Site Videos'),
    c.video.length ? h('div.thumb-row', c.video.slice(0, 3).map((v) => h('a.vthumb', { href: '#' + base + '/videos?v=' + v.id },
      h('div.vt-img', img(v.poster_url, ''), h('span.vt-play', icon('play')), v.duracion_seg ? h('span.vt-dur', fmtDuration(v.duracion_seg)) : null, h('div.img-badges', demoBadge(v.es_demo))),
      h('span.vt-title', L(v.titulo))))) : emptyState(t('emptyVideos'), null));

  const audios = [...c.audio, ...c.leyenda.filter((x) => x.media_url)];
  sections.audio = h('section.cblock', { id: 'sec-audio' }, ribbon('headphones', 'Audio leyendas', 'Legends Audio'),
    audios.length ? h('div.audio-row', audios.slice(0, 2).map((a) => h('div.audio-card', img(a.poster_url || 'assets/cultura/portada-leyendas.webp', '', 'ac-img'),
      h('div.ac-body', h('b', L(a.titulo), ' ', demoBadge(a.es_demo)), audioPlayer(a, { compact: true }))))) : emptyState(t('emptyAudios'), null));

  sections.referencias = h('section.cblock', { id: 'sec-referencias' }, ribbon('books', 'Referencias literarias', 'Literary References'),
    c.referencia.length ? h('div.ref-row', c.referencia.slice(0, 2).map((r) => h('a.ref-card', { href: '#/lectura/' + r.id },
      img(r.poster_url || 'assets/cultura/biblioteca-cultural.webp', '', 'ref-cover'),
      h('div', h('b', L(r.titulo)), r.autor ? h('i', r.autor) : null, r.cuerpo.es ? h('q', L(r.cuerpo)) : null, demoBadge(r.es_demo))))) : emptyState(t('emptyRefs'), 'delia'));

  const gal = c.galeria;
  const galleryBlock = h('section.cblock', ribbon('image', 'Galería', 'Gallery'),
    h('div.gallery-row',
      gal.length ? h('div.g-thumbs', gal.slice(0, 4).map((g) => h('a.g-thumb', { href: '#' + base + '/galeria', 'aria-label': L(g.titulo) }, img(g.media_url, L(g.titulo))))) : h('p.muted', t('emptyGallery')),
      h('button.btn.btn-burgundy.related', { type: 'button', onclick: () => document.getElementById('sec-lugares').scrollIntoView({ behavior: 'smooth' }) }, icon('pin'), h('span', t('relatedPlaces')), icon('chevrons'))));

  const places = h('section.cblock', { id: 'sec-lugares' }, ribbon('pin', 'Lugares para visitar', 'Places to visit'),
    d.destinos.length ? h('div.place-list', d.destinos.map((p) => h('a.place-item.card', { href: '#/destino/' + encodeURIComponent(p.slug) },
      img(p.imagen, '', 'pi-img'), h('div', h('b', L(p.nombre)), h('span', t('cat.' + p.categoria)), demoBadge(p.es_demo)), icon('chevron')))) : emptyState(t('emptyPlaces'), 'atahualpa'));

  return h('div.page.page-burgundy.dcontents',
    innerHeader({ title: t('districtOf') + ' ' + name, sub: getLang() === 'es' ? 'Historia, cultura y experiencias' : 'History, culture and experiences', sub2: getLang() === 'es' ? 'History, culture and experiences' : null, backTo: base, action: headerAction('map', t('viewMap'), () => navigate('/mapa?t=' + encodeURIComponent(slug))) }),
    offlineBanner(d),
    h('div.pad', tabBar),
    h('div.content-panel', sections.historia, sections.videos, sections.audio, sections.referencias, galleryBlock, places),
  );
}
