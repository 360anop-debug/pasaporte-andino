// Pasaporte Andino — proceso principal de Electron (Windows).
// Seguridad: contextIsolation, sandbox, sin nodeIntegration; solo se carga el bundle local vía app://pasaporte;
// toda URL externa se abre en el navegador del sistema; el token de sesión se cifra con safeStorage (DPAPI).
const { app, BrowserWindow, protocol, net, shell, ipcMain, safeStorage, clipboard, dialog, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const SCHEME = 'app';
const HOST = 'pasaporte';
protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

const webRoot = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, '..', 'web');
const userFile = (n) => path.join(app.getPath('userData'), n);
let win;

function loadBounds() {
  try { return JSON.parse(fs.readFileSync(userFile('ventana.json'), 'utf8')); } catch { return { width: 1366, height: 860 }; }
}
function saveBounds() {
  if (!win || win.isDestroyed()) return;
  try { fs.writeFileSync(userFile('ventana.json'), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() })); } catch { /* */ }
}

function createWindow() {
  const b = loadBounds();
  win = new BrowserWindow({
    width: b.width, height: b.height, x: b.x, y: b.y, minWidth: 900, minHeight: 620, show: false,
    title: 'Pasaporte Andino', backgroundColor: '#3d0414', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, webviewTag: false, spellcheck: false },
  });
  if (b.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', saveBounds);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`${SCHEME}://${HOST}/`)) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); }
  });
  win.loadURL(`${SCHEME}://${HOST}/index.html`);
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  const root = path.resolve(webRoot);
  protocol.handle(SCHEME, async (req) => {
    const u = new URL(req.url);
    if (u.host !== HOST) return new Response('No encontrado', { status: 404 });
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return new Response('No encontrado', { status: 404 });
    const res = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(res.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(res.body, { status: res.status, headers });
  });
  // Permisos: no se concede ninguno por defecto (cámara/micrófono/geolocalización/notificaciones).
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  createWindow();
});
app.on('window-all-closed', () => app.quit());

// ---------- IPC acotado ----------
const SESSION_FILE = () => userFile('sesion.bin');
ipcMain.handle('pa:secure:get', () => {
  try {
    if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(SESSION_FILE())) return null;
    return safeStorage.decryptString(fs.readFileSync(SESSION_FILE()));
  } catch { return null; }
});
ipcMain.handle('pa:secure:set', (_e, v) => {
  if (typeof v !== 'string' || v.length > 200) return false;
  if (!safeStorage.isEncryptionAvailable()) return false; // nunca se guarda el token sin cifrar
  fs.writeFileSync(SESSION_FILE(), safeStorage.encryptString(v), { mode: 0o600 });
  return true;
});
ipcMain.handle('pa:secure:clear', () => { try { fs.rmSync(SESSION_FILE(), { force: true }); } catch { /* */ } return true; });
ipcMain.handle('pa:openExternal', (_e, url) => {
  if (typeof url === 'string' && /^https:\/\//.test(url) && url.length < 2048) shell.openExternal(url);
});
ipcMain.handle('pa:copyText', (_e, t) => { if (typeof t === 'string' && t.length < 4096) clipboard.writeText(t); });
ipcMain.handle('pa:saveFile', async (_e, name, bytes) => {
  if (typeof name !== 'string' || !/^[\w.-]{1,80}$/.test(name) || !(bytes instanceof Uint8Array) || bytes.length > 20e6) return false;
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('downloads'), name) });
  if (r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, Buffer.from(bytes));
  return true;
});
ipcMain.handle('pa:windowInfo', () => (win ? { bounds: win.getBounds(), maximized: win.isMaximized(), scale: require('electron').screen.getPrimaryDisplay().scaleFactor } : null));
