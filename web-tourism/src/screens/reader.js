// Lector de la Biblioteca Viva: tamaño de letra, capítulos, reanudación (servidor), marcar como leída (validado por servidor).
import { h, innerHeader, errorState, loading, toast, demoBadge } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api, sendEvent } from '../api.js';
import { state, prefs, savePrefs } from '../state.js';
import { credits } from './player.js';

export default async function reader({ id }) {
  const header = innerHeader({ title: t('reader'), iconName: 'book', backTo: '/distritos' });
  let c;
  try { c = await api('GET', '/contenidos/' + encodeURIComponent(id), { publicCache: true }); } catch (e) { return h('div.page.page-burgundy', header, errorState(e, () => location.reload())); }
  let book = null;
  let bookErr = null;
  if (c.biblioteca_ref) {
    try { book = await api('GET', '/biblioteca/' + encodeURIComponent(c.biblioteca_ref.replace(':', '-')), { publicCache: true }); } catch (e) { bookErr = e; }
  }
  const chapters = book ? book.capitulos : [{ orden: 1, titulo: L(c.titulo), cuerpo: L(c.cuerpo) || '' }];
  let idx = 0;
  if (state.hasPassport()) {
    try { const p = await api('GET', `/lecturas/${c.id}/progreso`); idx = Math.min(chapters.length - 1, (p.capitulo || 1) - 1); if (idx > 0) toast(t('resumeAt', idx + 1)); } catch { /* */ }
  }
  let size = Number(prefs.readerSize || 19);
  const body = h('article.reader-body', { style: { fontSize: size + 'px' } });
  const pos = h('span.reader-pos');
  const prev = h('button.btn.btn-ghost.sm', { type: 'button' }, icon('back'), t('prevChapter'));
  const next = h('button.btn.btn-burgundy.sm', { type: 'button' }, t('nextChapter'), icon('chevron'));
  const done = h('button.btn.btn-gold.block', { type: 'button', hidden: true }, icon('check'), t('markRead'));
  function show() {
    const ch = chapters[idx];
    body.replaceChildren(h('h2', ch.titulo), ...String(ch.cuerpo).split(/\n{2,}/).map((p) => h('p', p)));
    pos.textContent = `${t('chapter')} ${idx + 1} / ${chapters.length}`;
    prev.disabled = idx === 0;
    next.hidden = idx >= chapters.length - 1;
    done.hidden = !(idx >= chapters.length - 1 && state.hasPassport());
    window.scrollTo(0, 0);
    if (state.hasPassport()) api('PUT', `/lecturas/${c.id}/progreso`, { json: { capitulo: idx + 1, posicion: 0 } }).catch(() => {});
  }
  prev.onclick = () => { if (idx > 0) { idx--; show(); } };
  next.onclick = () => { if (idx < chapters.length - 1) { idx++; show(); } };
  done.onclick = async () => {
    done.disabled = true;
    try {
      const r = await sendEvent({ tipo: 'lectura_completada', contenido_id: c.id });
      toast(r.estado === 'pendiente' ? t('eventPending') : t('readDone') + (r.monedas ? ` · +${r.monedas} ${t('coinsUnit')}` : ''));
    } catch (e) { toast(e.code === 'LECTURA_INCOMPLETA' ? t('readingTooShort') : e.message, 'error'); done.disabled = false; }
  };
  const sizer = (delta) => { size = Math.min(30, Math.max(15, size + delta)); body.style.fontSize = size + 'px'; prefs.readerSize = size; savePrefs(); };
  if (bookErr) {
    return h('div.page.page-burgundy', header, h('div.pad', h('div.state.empty', icon('book'), h('h2', L(c.titulo)),
      h('p', bookErr.code === 'BIBLIOTECA_CE360_NO_CONFIGURADA' ? t('libraryNotConnected') : bookErr.message), credits(c))));
  }
  show();
  return h('div.page.page-burgundy.reader',
    header,
    h('div.reader-sheet.parch-plain',
      h('div.reader-meta', h('h1', book?.titulo || L(c.titulo)), h('p', [book?.autor || c.autor, book?.fuente || c.fuente].filter(Boolean).join(' · ')), book?.licencia ? h('p.lic', t('license') + ': ' + book.licencia) : null, demoBadge(c.es_demo || book?.es_demo)),
      h('div.reader-tools', h('span', icon('text'), t('textSize')), h('button.btn.btn-ghost.sm', { type: 'button', 'aria-label': 'A-', onclick: () => sizer(-2) }, 'A−'), h('button.btn.btn-ghost.sm', { type: 'button', 'aria-label': 'A+', onclick: () => sizer(2) }, 'A+')),
      body,
      h('div.reader-nav', prev, pos, next),
      done,
    ),
  );
}
