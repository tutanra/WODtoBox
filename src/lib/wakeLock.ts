let sentinel: WakeLockSentinel | null = null

export async function requestWakeLock() {
  try {
    if (!('wakeLock' in navigator)) return
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => {
      sentinel = null
    })
  } catch {
    /* wake lock optional */
  }
}

export async function releaseWakeLock() {
  try {
    await sentinel?.release()
  } catch {
    /* ignore */
  } finally {
    sentinel = null
  }
}

export function bindWakeLockOnVisible() {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void requestWakeLock()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}
