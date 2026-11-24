import { h, img, brandBlock, langToggle, textile } from '../ui.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { api, setToken } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';

export default async function login() {
  const email = h('input.input', { type: 'email', id: 'email', autocomplete: 'email', required: true, maxlength: '190' });
  const pass = h('input.input', { type: 'password', id: 'password', autocomplete: 'current-password', required: true });
  const err = h('div.field-err.form-err', { role: 'alert' });
  const btn = h('button.btn.btn-burgundy.block', { type: 'submit' }, h('span', t('enter')), icon('chevrons', 'chev'));
  const form = h('form.register-card.parchment', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      if (!email.value || !pass.value) { err.textContent = t('required'); return; }
      btn.disabled = true;
      try {
        const r = await api('POST', '/auth/login', { json: { email: email.value, password: pass.value } });
        if (r.token) await setToken(r.token);
        await state.loadSession();
        state.passport = null;
        navigate(r.tiene_pasaporte ? sessionStorage.getItem('pa-after-register') || '/inicio' : '/bienvenida', { replace: true });
      } catch (x) { err.textContent = x.message; btn.disabled = false; }
    },
  },
    h('h2.register-title', icon('user'), t('loginTitle')),
    h('div.field', icon('globe'), h('div', h('label', { for: 'email' }, t('email')), email)),
    h('div.field', icon('lock'), h('div', h('label', { for: 'password' }, t('password')), pass)),
    err, btn,
    h('p.register-alt', t('noAccount'), h('br'), h('a.link', { href: '#/bienvenida' }, t('createOne'))),
  );
  return h('div.page.welcome',
    h('div.welcome-hero.short', img('assets/fondos_texturas/fondo-bienvenida.webp', '', 'welcome-bg', { eager: true }), h('div.welcome-top', langToggle()),
      h('div.welcome-brand', brandBlock(t('region')))),
    form, textile('welcome-band'));
}
