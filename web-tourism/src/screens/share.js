// Compartir información PÚBLICA (nunca foto privada, QR personal ni nombre completo).
import { h, sheet, toast, asset } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { API_BASE } from '../config.js';
import { shareNative, copyText, openExternal, saveBlob, TARGET } from '../platform.js';

export function shareUrl(type, slug) { return `${API_BASE}/compartir/${type}/${encodeURIComponent(slug)}`; }

async function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
/** Tarjeta 1080x1350 para publicar manualmente en Instagram (composición exportable). */
export async function makeCard(title, subtitle, image) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 1350);
  grad.addColorStop(0, '#86123a'); grad.addColorStop(1, '#3d0414');
  g.fillStyle = grad; g.fillRect(0, 0, 1080, 1350);
  try {
    const im = await loadImg(asset(image));
    const w = 960, hgt = 760, r = Math.max(w / im.width, hgt / im.height);
    g.save(); g.beginPath(); g.roundRect(60, 200, w, hgt, 40); g.clip();
    g.drawImage(im, 60 + (w - im.width * r) / 2, 200 + (hgt - im.height * r) / 2, im.width * r, im.height * r); g.restore();
    g.lineWidth = 10; g.strokeStyle = '#e0a52e'; g.beginPath(); g.roundRect(60, 200, w, hgt, 40); g.stroke();
  } catch { /* sin imagen */ }
  try { const logo = await loadImg(asset('assets/marca/logo-pasaporte-andino.webp')); g.drawImage(logo, 340, 20, 400, 400 * logo.height / logo.width); } catch { /* */ }
  g.textAlign = 'center'; g.fillStyle = '#ffe08a'; g.font = '800 76px Alegreya, Georgia, serif';
  g.fillText(title.slice(0, 26), 540, 1080);
  g.fillStyle = '#fff3dc'; g.font = '600 38px Nunito, sans-serif';
  g.fillText(subtitle.slice(0, 48), 540, 1150);
  g.fillStyle = '#f5c542'; g.font = '700 32px Nunito, sans-serif'; g.fillText('#PasaporteAndino · Cajamarca', 540, 1260);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

export async function shareContent({ type, slug, title, text, image }) {
  const url = shareUrl(type, slug);
  const r = await shareNative({ title, text, url });
  if (r !== 'menu') return;
  const enc = encodeURIComponent;
  sheet(t('shareTitle'), h('div.share-sheet',
    h('p.muted', t('shareNoPrivate')),
    h('div.share-grid',
      h('button.share-opt', { type: 'button', onclick: async () => { try { await copyText(url); toast(t('linkCopied')); } catch { toast(url); } } }, icon('copy'), t('copyLink')),
      h('button.share-opt', { type: 'button', onclick: () => openExternal('https://www.facebook.com/sharer/sharer.php?u=' + enc(url)) }, icon('share'), t('openFacebook')),
      h('button.share-opt', { type: 'button', onclick: () => openExternal('https://wa.me/?text=' + enc(title + ' ' + url)) }, icon('share'), t('openWhatsApp')),
      h('button.share-opt', { type: 'button', onclick: () => openExternal('https://twitter.com/intent/tweet?text=' + enc(title) + '&url=' + enc(url)) }, icon('share'), t('openX')),
      h('button.share-opt.wide', { type: 'button', onclick: async () => { const b = await makeCard(title, text, image); await saveBlob(b, `pasaporte-andino-${slug}.png`); } }, icon('download'), t('downloadCard')),
    ),
    TARGET === 'windows' ? h('p.muted.small', url) : null,
  ));
}
