import { h, innerHeader, langToggle, toast, sheet } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { api } from '../api.js';
import { state, prefs, savePrefs } from '../state.js';
import { navigate } from '../router.js';
import { APP_VERSION, ENV } from '../config.js';
import { TARGET } from '../platform.js';

export default async function settings() {
  const sw = (key, label) => {
    const i = h('input', { type: 'checkbox', role: 'switch', checked: prefs[key] ? true : null, onchange: () => { prefs[key] = i.checked; savePrefs(); } });
    return h('label.check.setting', i, h('span', label));
  };
  const logged = state.session?.autenticado;
  return h('div.page.page-burgundy', innerHeader({ title: t('settings'), iconName: 'settings', backTo: '/inicio' }),
    h('div.pad.stack',
      h('section.card.pad-card.stack', h('h2.title-ink', t('language')), langToggle()),
      h('section.card.pad-card.stack', sw('reduceMotion', t('reduceMotion')), sw('muteGuides', t('muteGuides'))),
      h('section.card.pad-card.stack', h('p', icon('info'), ' ', t('offlineAvailable')), h('a.link', { href: '#/privacidad' }, t('privacy'))),
      logged ? h('button.btn.btn-ghost.block', { type: 'button', onclick: async () => { await state.logout(); navigate('/bienvenida', { replace: true }); } }, icon('logout'), t('logout')) : null,
      state.hasPassport() ? h('button.btn.btn-ghost.block.danger', { type: 'button', onclick: () => deleteSheet() }, icon('trash'), t('deleteAccount')) : null,
      h('p.muted.on-dark.small', `${t('version')} ${APP_VERSION} · ${TARGET} · ${ENV}`),
    ));
}
function deleteSheet() {
  const i = h('input.input', { 'aria-label': 'ELIMINAR', autocomplete: 'off' });
  const err = h('p.field-err', { role: 'alert' });
  sheet(t('deleteAccount'), h('form.stack', {
    onsubmit: async (e) => {
      e.preventDefault();
      try { await api('DELETE', '/cuenta', { json: { confirmar: i.value.trim() } }); await state.logout(); toast('✓'); navigate('/bienvenida', { replace: true }); document.querySelector('.sheet-wrap')?.remove(); }
      catch (x) { err.textContent = x.message; }
    },
  }, h('p', t('deleteConfirm')), i, err, h('button.btn.btn-burgundy.block', { type: 'submit' }, t('deleteAccount'))));
}
