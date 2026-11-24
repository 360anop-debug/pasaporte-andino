// Elimina del build de producción los medios técnicos de prueba (demo-media/), que nunca deben distribuirse.
import { rmSync, existsSync } from 'node:fs';
const p = new URL('../dist/demo-media', import.meta.url);
if (existsSync(p)) rmSync(p, { recursive: true });
console.log('demo-media excluido del build de producción');
