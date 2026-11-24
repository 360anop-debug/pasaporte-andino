// Carga de datos públicos con caché local (sin conexión → última copia).
import { api } from '../api.js';
export const getTerritories = (q = '') => api('GET', '/territorios' + q, { publicCache: true });
export const getTerritory = (slug) => api('GET', '/territorios/' + encodeURIComponent(slug), { publicCache: true });
export const getPlace = (slug) => api('GET', '/destinos/' + encodeURIComponent(slug), { publicCache: true });
export const getRoutes = () => api('GET', '/rutas', { publicCache: true });
export const getRoute = (slug) => api('GET', '/rutas/' + encodeURIComponent(slug), { publicCache: true });
export const getRules = () => api('GET', '/reglas', { publicCache: true });
