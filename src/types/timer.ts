export const TIMER_KINDS = [
  'amrap',
  'forTime',
  'emom',
  'tabata',
  'intervals',
  'stopwatch',
] as const

export type TimerKind = (typeof TIMER_KINDS)[number]

export type TimerPhase = 'idle' | 'prepare' | 'work' | 'rest' | 'finished'

export type FinishedReason = 'cap' | 'complete' | 'manual' | null

export interface TimerConfig {
  kind: TimerKind
  prepareSeconds: number
  durationSeconds: number
  intervalSeconds: number
  rounds: number
  workSeconds: number
  restSeconds: number
  /** For Time: true = 0 → cap, false = cap → 0 */
  countUp: boolean
}

export interface TimerSnapshot {
  phase: TimerPhase
  displayMs: number
  remainingMs: number
  isCountDown: boolean
  round: number
  totalRounds: number
  label: string
  sublabel: string
  progress: number
  overallProgress: number
  warning: boolean
  amrapRounds: number
  finishedReason: FinishedReason
}

export function isTimerKind(value: string | undefined): value is TimerKind {
  return TIMER_KINDS.includes(value as TimerKind)
}

export function defaultConfig(kind: TimerKind): TimerConfig {
  const base: TimerConfig = {
    kind,
    prepareSeconds: 10,
    durationSeconds: 12 * 60,
    intervalSeconds: 60,
    rounds: 10,
    workSeconds: 20,
    restSeconds: 10,
    countUp: true,
  }

  if (kind === 'amrap') {
    return { ...base, durationSeconds: 12 * 60 }
  }
  if (kind === 'forTime') {
    return { ...base, durationSeconds: 15 * 60 }
  }
  if (kind === 'emom') {
    return { ...base, intervalSeconds: 60, rounds: 10 }
  }
  if (kind === 'tabata') {
    return { ...base, workSeconds: 20, restSeconds: 10, rounds: 8 }
  }
  if (kind === 'intervals') {
    return { ...base, workSeconds: 40, restSeconds: 20, rounds: 8 }
  }
  return { ...base, prepareSeconds: 0 }
}

export function forTimeCountsUp(config: TimerConfig) {
  return config.kind !== 'forTime' || config.durationSeconds <= 0 || config.countUp !== false
}

export function normalizeTimerConfig(config: TimerConfig): TimerConfig {
  return { ...defaultConfig(config.kind), ...config }
}
