
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.connectra.chat',
  appName: 'Connectra',
  webDir: 'dist',
  server: {
    url: 'http://192.168.43.253:3000',
    cleartext: true
  }
};

export default config;



