// Mi Álbum Fotográfico (ref. 06 izquierda): fotos privadas reales del viajero, contadores reales.
import { h, img, homeTopbar, brandBlock, errorState, emptyState, sheet, toast, textile } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api, authImage, forgetImage } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';

export default async function album() {
  let photos, pr;
  try { [photos, pr] = await Promise.all([api('GET', '/album'), state.loadProgress()]); }
  catch (e) { return h('div.page.page-burgundy', homeTopbar(), errorState(e, () => location.reload())); }
  const stat = (ic, label, val) => h('div.album-stat', icon(ic), h('span', label), h('b', val));
  const grid = h('div.polaroid-grid', photos.datos.length ? photos.datos.map(polaroid) : [emptyState(t('emptyAlbum'), 'llama')]);
  return h('div.page.album-page',
    h('div.album-hero', img('assets/rutas/ruta-natural.webp', '', 'ah-bg', { eager: true }), homeTopbar(), h('div.album-brand', brandBlock(null, 'small')),
      img('assets/personajes/atahualpa-delia.webp', 'Atahualpa y Delia', 'album-chars', { eager: true })),
    h('section.album-sheet',
      h('h1.album-title', icon('camera', 'at-ic'), h('span', t('albumTitle'))),
      h('p.album-sub', t('albumSub')),
      h('div.album-stats', stat('medal', t('stampsEarned'), `${pr.sellos.obtenidos} / ${pr.sellos.total}`), stat('image', t('photosUploaded'), String(pr.fotos)), stat('trophy', t('districtsVisited'), String(pr.territorios_visitados))),
      h('button.btn.btn-gold.block.add-photo', { type: 'button', onclick: () => uploadSheet() }, icon('plus'), t('addAlbumPhoto')),
      h('p.private-note', icon('lock'), t('privateNote')),
      grid,
      h('button.btn.btn-burgundy.block.cta-stamps', { type: 'button', onclick: () => navigate('/pasaporte/sellos') }, img('assets/album/portada-album.webp', '', 'cta-book'), h('span', t('viewStampPassport')), icon('chevrons', 'chev')),
    ),
    textile(),
  );
}

function polaroid(p) {
  const im = h('div.pol-img', h('span.skeleton'));
  authImage(`/album/${p.id}/archivo?tam=mini`).then((u) => im.replaceChildren(h('img', { src: u, alt: p.titulo || L(p.destino?.nombre) || '' }))).catch(() => im.replaceChildren(icon('image')));
  return h('button.polaroid', { type: 'button', onclick: () => viewPhoto(p), 'aria-label': p.titulo || L(p.destino?.nombre) || t('album') },
    h('span.pol-pin', { 'aria-hidden': 'true' }), im,
    h('span.pol-cap', p.titulo || L(p.destino?.nombre) || '—'),
    p.verificado ? h('span.pol-check', { title: t('verifiedPlace') }, icon('check')) : null);
}

function viewPhoto(p) {
  const big = h('div.photo-big', h('span.spinner'));
  authImage(`/album/${p.id}/archivo`).then((u) => big.replaceChildren(h('img', { src: u, alt: p.titulo || '' }))).catch(() => big.replaceChildren(icon('image')));
  const s = sheet(p.titulo || L(p.destino?.nombre) || t('album'), h('div.stack', big,
    p.destino ? h('p', icon('pin'), ' ', L(p.destino.nombre), p.verificado ? h('span.verified.inline', icon('check'), t('verifiedPlace')) : null) : null,
    h('p.muted', icon('lock'), ' ', t('privateNote')),
    h('button.btn.btn-ghost.block', { type: 'button', onclick: async () => {
      if (!confirm(t('confirmDelete'))) return;
      try { await api('DELETE', '/album/' + p.id); forgetImage('/album/' + p.id); s.close(); navigate('/album', { replace: true }); toast('✓'); } catch (e) { toast(e.message, 'error'); }
    } }, icon('trash'), t('deletePhoto'))));
}

async function uploadSheet() {
  let places = [];
  try { places = (await api('GET', '/destinos', { publicCache: true })).datos; } catch { /* */ }
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', id: 'album-file', class: 'sr-only' });
  const prev = h('div.upload-prev', icon('camera'));
  const place = h('select.select', { 'aria-label': t('photoPlace') }, h('option', { value: '' }, t('photoPlace')), places.map((p) => h('option', { value: p.slug }, L(p.nombre))));
  const title = h('input.input', { maxlength: '120', placeholder: t('photoTitle'), 'aria-label': t('photoTitle') });
  const err = h('p.field-err', { role: 'alert' });
  const btn = h('button.btn.btn-burgundy.block', { type: 'submit', disabled: true }, icon('download'), t('upload'));
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    err.textContent = '';
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { err.textContent = '≤ 8 MB'; btn.disabled = true; return; }
    prev.replaceChildren(h('img', { src: URL.createObjectURL(f), alt: '' }));
    btn.disabled = false;
  });
  const s = sheet(t('addAlbumPhoto'), h('form.stack', {
    onsubmit: async (e) => {
      e.preventDefault();
      const f = file.files?.[0];
      if (!f) return;
      btn.disabled = true; btn.lastChild.textContent = t('uploading');
      const fd = new FormData();
      fd.append('foto', f);
      if (place.value) fd.append('destino', place.value);
      if (title.value.trim()) fd.append('titulo', title.value.trim());
      try { await api('POST', '/album', { form: fd }); s.close(); toast('✓ ' + t('album')); navigate('/album', { replace: true }); }
      catch (x) { err.textContent = x.message; btn.disabled = false; btn.lastChild.textContent = t('upload'); }
    },
  }, h('label.upload-drop', { for: 'album-file' }, prev, h('span.btn.btn-gold.sm', icon('camera'), t('addPhoto'))), file, place, title, h('p.muted', icon('lock'), ' ', t('privateNote')), err, btn));
}
