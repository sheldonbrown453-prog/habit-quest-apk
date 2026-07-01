import type { CapacitorConfig } from '@capacitor/cli';
import path from 'path';

const config: CapacitorConfig = {
  appId: 'com.habitquest.app',
  appName: 'HabitQuest',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
