// Configuración de build (sin secretos). Los valores vienen de .env.<modo>.
export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://region.aprep.net/pasaporte/api/v1').replace(/\/$/, '');
export const PUBLIC_BASE = (import.meta.env.VITE_PUBLIC_BASE || 'https://region.aprep.net/pasaporte').replace(/\/$/, '');
export const ENV = import.meta.env.VITE_ENV || 'production';
export const APP_VERSION = '1.0.0';
