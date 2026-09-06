export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function formatClock(ms: number, isCountDown: boolean): string {
  const safe = Math.max(0, ms)

  if (isCountDown && safe > 0 && Math.ceil(safe / 1000) <= 9) {
    return (Math.ceil(safe / 100) / 10).toFixed(1)
  }

  const totalSeconds = isCountDown
    ? Math.max(0, Math.ceil(safe / 1000))
    : Math.floor(safe / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

export function formatCompact(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0 && seconds === 0) return `${minutes}:00`
  if (minutes > 0) return `${minutes}:${pad(seconds)}`
  return `${seconds}s`
}

export function minutesOf(totalSeconds: number) {
  return Math.floor(totalSeconds / 60)
}

export function secondsOf(totalSeconds: number) {
  return totalSeconds % 60
}

export function toTotalSeconds(minutes: number, seconds: number) {
  return Math.max(0, minutes) * 60 + clamp(seconds, 0, 59)
}
