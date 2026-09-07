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

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatHistoryDay(ts: number) {
  const date = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(date, today)) return 'Hoy'
  if (sameDay(date, yesterday)) return 'Ayer'
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

export function formatHistoryTime(ts: number) {
  return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(ts)
}

export function historyDayKey(ts: number) {
  const date = new Date(ts)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function toDateInputValue(ts: number) {
  const date = new Date(ts)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateInputValue(value: string, previousTs = Date.now()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return previousTs
  const next = new Date(previousTs)
  next.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return next.getTime()
}
