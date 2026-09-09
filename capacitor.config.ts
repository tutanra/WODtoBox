import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.wodtobox.app',
  appName: 'WODtoBox',
  webDir: 'dist',
  android: {
    backgroundColor: '#070708',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070708',
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
}

export default config
