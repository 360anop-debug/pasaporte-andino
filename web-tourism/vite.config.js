import { defineConfig, loadEnv } from 'vite';

// CSP estricta: solo el propio bundle, la API configurada y teselas de OpenStreetMap para el mapa.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const api = new URL(env.VITE_API_BASE || 'https://region.aprep.net/pasaporte/api/v1');
  const csp = [
    "default-src 'self'",
    `connect-src 'self' ${api.origin}`,
    `img-src 'self' data: blob: ${api.origin} https://tile.openstreetmap.org`,
    `media-src 'self' blob: ${api.origin}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
  return {
    base: './',
    build: { outDir: 'dist', assetsInlineLimit: 0, sourcemap: false, target: 'es2020', chunkSizeWarningLimit: 900 },
    plugins: [{ name: 'pa-csp', transformIndexHtml: (html) => html.replace('%PA_CSP%', csp) }],
    server: { port: 5173, strictPort: true },
  };
});
