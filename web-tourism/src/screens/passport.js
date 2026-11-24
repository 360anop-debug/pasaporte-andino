// Mi Pasaporte: portada + identidad + QR + logros, sellos, monedas, visitas y álbum. Botón claro para volver.
import { h, img, innerHeader, errorState, progressBar, stampEl, fmtNum, fmtDate, toast, sheet } from '../ui.js';
import { t, L } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { passportCard } from './passportCard.js';
import { saveBlob } from '../platform.js';

export default async function passport() {
  let p, pr, stamps, visits;
  try { [p, pr, stamps, visits] = await Promise.all([state.loadPassport(true), state.loadProgress(), api('GET', '/pasaporte/sellos'), api('GET', '/pasaporte/visitas')]); }
  catch (e) { return h('div.page.page-burgundy', innerHeader({ title: t('myPassport') }), errorState(e, () => location.reload())); }
  const stat = (ic, label, val, href) => h('a.p-stat.card', { href }, icon(ic), h('span', label), h('b', val));
  const account = p.cuenta.invitado
    ? h('div.card.account-card', h('p', h('b', t('guestAccount'))), h('p.small', t('guestSave')), h('button.btn.btn-burgundy.sm', { type: 'button', onclick: () => secureAccount() }, icon('lock'), t('secureAccount')))
    : h('div.card.account-card', h('p', icon('check'), ' ', h('b', t('registeredAs')), ' · ', p.cuenta.email));
  return h('div.page.page-burgundy.passport-page',
    innerHeader({ title: t('myPassport'), backTo: '/inicio' }),
    h('div.pad.stack',
      h('div.passport-cover', img('assets/pasaporte/portada-pasaporte.webp', t('passportTitle'), 'cover-img', { eager: true }), h('div.cover-text', h('span.caps', 'PASAPORTE ANDINO'), h('small', 'ANDEAN PASSPORT'))),
      passportCard(p),
      h('p.qr-hint', icon('info'), t('qrHint')),
      h('div.p-stats',
        stat('medal', t('stampsEarned'), `${pr.sellos.obtenidos} / ${pr.sellos.total}`, '#/pasaporte/sellos'),
        stat('coins', t('coins'), fmtNum(pr.monedas.total), '#/monedas'),
        stat('pin', t('visits'), String(pr.lugares_visitados), '#/pasaporte'),
        stat('image', t('photosUploaded'), String(pr.fotos), '#/album'),
      ),
      h('section.card.pad-card', h('h2.title-ink', t('myProgress')), progressBar(pr.sellos.obtenidos, pr.sellos.total, t('ofDistricts', pr.sellos.obtenidos, pr.sellos.total)),
        h('div.mini-stamps', stamps.datos.slice(0, 6).map((s) => stampEl(s, s.obtenido))),
        h('a.btn.btn-burgundy.block', { href: '#/pasaporte/sellos' }, icon('book'), t('viewStampPassport'), icon('chevrons', 'chev'))),
      h('section.card.pad-card', h('h2.title-ink', t('visits')),
        visits.datos.length ? h('ul.visit-list', visits.datos.map((v) => h('li', h('a', { href: '#/destino/' + v.slug }, img(v.imagen, '', 'vl-img'), h('span', h('b', L({ es: v.nombre_es, en: v.nombre_en })), h('small', L({ es: v.territorio_es, en: v.territorio_en }) + ' · ' + fmtDate(v.creado_at))), icon('check', 'ok'))))) : h('p.muted', t('noVisits')),
        h('a.btn.btn-gold.block', { href: '#/checkin' }, icon('qr'), t('checkinTitle'))),
      account,
      h('button.btn.btn-ghost.block', { type: 'button', onclick: async () => { const d = await api('GET', '/pasaporte/exportar'); await saveBlob(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), 'mis-datos-pasaporte-andino.json'); } }, icon('download'), t('exportData')),
      h('button.btn.btn-ghost.block', { type: 'button', onclick: () => navigate('/ajustes') }, icon('settings'), t('settings')),
    ));
}

function secureAccount() {
  const email = h('input.input', { type: 'email', autocomplete: 'email', 'aria-label': t('email'), placeholder: t('email') });
  const pass = h('input.input', { type: 'password', autocomplete: 'new-password', minlength: '10', 'aria-label': t('password'), placeholder: t('password') + ' (≥10)' });
  const err = h('p.field-err', { role: 'alert' });
  const s = sheet(t('secureAccount'), h('form.stack', {
    onsubmit: async (e) => {
      e.preventDefault();
      try { await api('POST', '/auth/registro', { json: { email: email.value, password: pass.value } }); s.close(); toast(t('registeredAs')); navigate('/pasaporte', { replace: true }); }
      catch (x) { err.textContent = x.message; }
    },
  }, h('p', t('guestSave')), email, pass, err, h('button.btn.btn-burgundy.block', { type: 'submit' }, t('save'))));
}
