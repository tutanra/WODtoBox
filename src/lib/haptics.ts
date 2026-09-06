import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export async function pulse(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    if (Capacitor.isNativePlatform()) {
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }
      await Haptics.impact({ style: map[style] })
      return
    }
    navigator.vibrate?.(style === 'heavy' ? 50 : 20)
  } catch {
    /* haptics optional */
  }
}
