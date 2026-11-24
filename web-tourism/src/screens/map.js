// Mapa: solo muestra ubicaciones registradas; marca las no validadas. Teselas OpenStreetMap (atribución).
import L0 from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { h, innerHeader, emptyState, errorState } from '../ui.js';
import { t, L } from '../i18n.js';
import { api } from '../api.js';
import { navigate, query } from '../router.js';

export default async function map() {
  const header = innerHeader({ title: t('mapTitle'), iconName: 'map', backTo: '/distritos' });
  let places;
  try { places = (await api('GET', '/destinos' + (query().get('t') ? '?territorio=' + encodeURIComponent(query().get('t')) : ''), { publicCache: true })).datos; }
  catch (e) { return h('div.page.page-burgundy', header, errorState(e, () => location.reload())); }
  const pts = places.filter((p) => p.ubicacion);
  if (!pts.length) return h('div.page.page-burgundy', header, h('div.pad', emptyState(t('mapNoPoints'), 'atahualpa'), h('ul.map-list', places.map((p) => h('li', h('a.place-item.card', { href: '#/destino/' + p.slug }, h('b', L(p.nombre)), h('span', t('noLocation'))))))));
  const el = h('div.map-box', { role: 'region', 'aria-label': t('mapTitle') });
  setTimeout(() => {
    const m = L0.map(el, { scrollWheelZoom: false });
    L0.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(m);
    const icon = L0.icon({ iconUrl: './assets/exploracion/marcador-mapa.svg', iconSize: [34, 44], iconAnchor: [17, 43] });
    const b = [];
    pts.forEach((p) => {
      const mk = L0.marker([p.ubicacion.lat, p.ubicacion.lng], { icon, title: L(p.nombre) }).addTo(m);
      mk.on('click', () => navigate('/destino/' + p.slug));
      b.push([p.ubicacion.lat, p.ubicacion.lng]);
    });
    m.fitBounds(b, { padding: [30, 30], maxZoom: 13 });
  }, 50);
  return h('div.page.page-burgundy', header, h('div.pad', el, pts.some((p) => !p.ubicacion.validada) ? h('p.muted.on-dark', t('mapPending')) : null));
}
