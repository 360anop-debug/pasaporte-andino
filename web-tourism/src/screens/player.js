// Reproductores de audio/video con controles propios accesibles. Al terminar, se envía el evento al servidor
// (solo con pasaporte); el servidor decide si otorga monedas (deduplicado por contenido).
import { h, img, fmtDuration, toast, asset } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { sendEvent } from '../api.js';
import { state } from '../state.js';

let activeMedia = null;
function exclusive(m) { if (activeMedia && activeMedia !== m) activeMedia.pause(); activeMedia = m; }

async function reportEnded(type, content) {
  if (!state.hasPassport()) return;
  try {
    const r = await sendEvent({ tipo: type, contenido_id: content.id });
    if (r.estado === 'pendiente') toast(t('eventPending'));
    else if (r.monedas > 0) toast(`+${r.monedas} ${t('coinsUnit')}`);
  } catch { /* validación del servidor: sin recompensa */ }
}

export function videoPlayer(c, { big = true } = {}) {
  const v = h('video', { preload: 'metadata', playsinline: true, poster: asset(c.poster_url), src: asset(c.media_url), 'aria-label': L(c.titulo) });
  if (c.subtitulos_url) v.append(h('track', { kind: 'subtitles', src: asset(c.subtitulos_url), srclang: 'es', label: 'Español', default: true }));
  const playBtn = h('button.big-play', { type: 'button', 'aria-label': t('play') }, icon('play'));
  const time = h('span.vp-time', '0:00 / ' + fmtDuration(c.duracion_seg));
  const bar = h('input.vp-bar', { type: 'range', min: '0', max: '1000', value: '0', 'aria-label': t('duration') });
  const small = h('button.vp-btn', { type: 'button', 'aria-label': t('play') }, icon('play'));
  const fs = h('button.vp-btn', { type: 'button', 'aria-label': t('fullscreen'), onclick: () => (v.requestFullscreen?.() || v.webkitEnterFullscreen?.()) }, icon('fullscreen'));
  const err = h('p.vp-err', { hidden: true, role: 'alert' }, t('mediaUnavailable'));
  const toggle = () => { if (v.paused) { exclusive(v); v.play().catch(() => { err.hidden = false; }); } else v.pause(); };
  playBtn.onclick = toggle; small.onclick = toggle; v.onclick = toggle;
  const sync = () => {
    const playing = !v.paused;
    playBtn.hidden = playing;
    small.replaceChildren(icon(playing ? 'pause' : 'play'));
    small.setAttribute('aria-label', playing ? t('pause') : t('play'));
  };
  v.addEventListener('play', sync); v.addEventListener('pause', sync);
  v.addEventListener('timeupdate', () => { if (v.duration) { bar.value = String(Math.round((v.currentTime / v.duration) * 1000)); time.textContent = fmtDuration(v.currentTime) + ' / ' + fmtDuration(v.duration); } });
  bar.addEventListener('input', () => { if (v.duration) v.currentTime = (Number(bar.value) / 1000) * v.duration; });
  v.addEventListener('ended', () => reportEnded('video_visto', c));
  v.addEventListener('error', () => { err.hidden = false; playBtn.hidden = true; });
  return h('div.video-player' + (big ? '.big' : ''), h('div.vp-frame', v, playBtn), h('div.vp-controls', small, time, bar, fs), err);
}

export function audioPlayer(c, { compact = false } = {}) {
  const a = h('audio', { preload: 'metadata', src: asset(c.media_url) });
  const btn = h('button.ap-play', { type: 'button', 'aria-label': t('play') + ': ' + L(c.titulo) }, icon('play'));
  const bars = h('div.ap-wave', { 'aria-hidden': 'true' }, Array.from({ length: compact ? 18 : 30 }, (_, i) => h('i', { style: { height: 20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70) + '%' } })));
  const cur = h('span.ap-cur', '0:00');
  const dur = h('span.ap-dur', fmtDuration(c.duracion_seg));
  const seek = h('input.ap-seek', { type: 'range', min: '0', max: '1000', value: '0', 'aria-label': t('duration') });
  const err = h('p.vp-err', { hidden: true, role: 'alert' }, t('mediaUnavailable'));
  btn.onclick = () => { if (a.paused) { exclusive(a); a.play().catch(() => { err.hidden = false; }); } else a.pause(); };
  const sync = () => { btn.replaceChildren(icon(a.paused ? 'play' : 'pause')); btn.setAttribute('aria-label', (a.paused ? t('play') : t('pause')) + ': ' + L(c.titulo)); bars.classList.toggle('on', !a.paused); };
  a.addEventListener('play', sync); a.addEventListener('pause', sync);
  a.addEventListener('loadedmetadata', () => { dur.textContent = fmtDuration(a.duration); });
  a.addEventListener('timeupdate', () => {
    cur.textContent = fmtDuration(a.currentTime);
    if (a.duration) {
      const p = a.currentTime / a.duration;
      seek.value = String(Math.round(p * 1000));
      [...bars.children].forEach((b, i) => b.classList.toggle('done', i / bars.children.length < p));
    }
  });
  seek.addEventListener('input', () => { if (a.duration) a.currentTime = (Number(seek.value) / 1000) * a.duration; });
  a.addEventListener('ended', () => reportEnded('audio_escuchado', c));
  a.addEventListener('error', () => { err.hidden = false; btn.disabled = true; });
  return h('div.audio-player' + (compact ? '.compact' : ''), a, btn, h('div.ap-mid', bars, seek), h('div.ap-times', compact ? null : cur, dur), err);
}

export function credits(c) {
  const parts = [];
  if (c.autor) parts.push(h('span', h('b', t('author') + ': '), c.autor));
  if (c.fuente) parts.push(h('span', h('b', t('source') + ': '), c.fuente));
  if (c.licencia) parts.push(h('span', h('b', t('license') + ': '), c.licencia));
  if (c.credito) parts.push(h('span', h('b', t('credit') + ': '), c.credito));
  return parts.length ? h('p.credits', parts) : null;
}
