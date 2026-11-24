import type { CapacitorConfig } from '@capacitor/cli';

// PA_STAGING=1 solo para el APK de pruebas E2E en emulador (API http://10.0.2.2:8080). El APK de release usa HTTPS.
const staging = process.env.PA_STAGING === '1';

const config: CapacitorConfig = {
  appId: 'net.aprep.region.pasaporteandino',
  appName: 'Pasaporte Andino',
  webDir: '../web-tourism/dist',
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: staging,
    adjustMarginsForEdgeToEdge: 'auto',
  },
  server: {
    androidScheme: staging ? 'http' : 'https',
    cleartext: staging,
    // Sin allowNavigation: cualquier URL externa se abre en el navegador del sistema, nunca dentro de la app.
  },
};
export default config;
