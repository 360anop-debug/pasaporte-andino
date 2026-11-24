// Videos (ref. 05, 4ª) y Audios (ref. 05, 5ª) del distrito.
import { h, img, innerHeader, errorState, emptyState, offlineBanner, demoBadge, fmtDuration } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { getTerritory } from './data.js';
import { query, navigate } from '../router.js';
import { videoPlayer, audioPlayer, credits } from './player.js';

export default async function media({ slug }, meta) {
  const isVideo = meta.kind === 'video';
  let d;
  try { d = await getTerritory(slug); } catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t(isVideo ? 'videos' : 'audios') }), errorState(e, () => location.reload())); }
  const name = L(d.nombre);
  const list = isVideo ? d.contenidos.video : [...d.contenidos.audio, ...d.contenidos.leyenda.filter((x) => x.media_url)];
  const header = innerHeader({ title: name + ' - ' + t(isVideo ? 'videos' : 'audios'), iconName: isVideo ? 'video' : 'headphones', backTo: '/distrito/' + encodeURIComponent(slug) });
  if (!list.length) return h('div.page.page-burgundy', header, h('div.pad', emptyState(t(isVideo ? 'emptyVideos' : 'emptyAudios'), isVideo ? 'atahualpa' : 'delia')));
  const sel = list.find((x) => String(x.id) === query().get('v')) || list[0];
  const others = list.filter((x) => x !== sel);
  const pick = (x) => navigate('/distrito/' + encodeURIComponent(slug) + '/' + (isVideo ? 'videos' : 'audios') + '?v=' + x.id, { replace: true });
  const main = isVideo
    ? h('div.media-main', h('div.gold-frame', videoPlayer(sel)), h('h2.media-title', L(sel.titulo), ' ', demoBadge(sel.es_demo)), h('p.media-desc', L(sel.cuerpo)), credits(sel))
    : h('div.media-main.audio-main',
      h('div.audio-hero.gold-frame', h('div', img(sel.poster_url || 'assets/cultura/portada-leyendas.webp', '', 'ah-img'), h('h2.ah-title', L(sel.titulo)), audioPlayer(sel))),
      h('p.media-desc', L(sel.cuerpo), ' ', demoBadge(sel.es_demo)), credits(sel));
  const listEl = others.length ? h('section',
    isVideo ? null : h('h3.more-title', t('moreAudios')),
    h('div' + (isVideo ? '.video-list' : '.audio-list'), others.map((x) => isVideo
      ? h('button.vlist-item.card', { type: 'button', onclick: () => pick(x) }, h('div.vl-img', img(x.poster_url, ''), h('span.vt-dur', fmtDuration(x.duracion_seg))), h('div', h('b', L(x.titulo)), h('span', L(x.cuerpo)?.slice(0, 60))))
      : h('button.alist-item', { type: 'button', onclick: () => pick(x) }, icon('headphones'), h('b', L(x.titulo)), h('span', fmtDuration(x.duracion_seg)))))) : null;
  return h('div.page.page-burgundy.media-page', header, offlineBanner(d), h('div.pad.stack', main, listEl));
}
