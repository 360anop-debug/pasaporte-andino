import { test } from 'node:test';
import assert from 'node:assert/strict';
// Paridad de claves ES/EN (sin DOM): se evalúa el módulo con un localStorage mínimo.
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.document = { documentElement: {} };
const { keys, t, setLang } = await import('../../src/i18n.js');
test('ES y EN tienen exactamente las mismas claves', () => {
  assert.deepEqual(keys('es').sort(), keys('en').sort());
});
test('funciones de pluralización', () => {
  assert.equal(t('places', 1), '1 lugar');
  setLang('en');
  assert.equal(t('places', 3), '3 places');
  assert.equal(t('cat.mirador'), 'Viewpoint');
});
