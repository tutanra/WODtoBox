import type { FinishedReason, TimerConfig, TimerPhase, TimerSnapshot } from '../types/timer'
import { forTimeCountsUp } from '../types/timer'

const idleBase = (config: TimerConfig, extra: EngineExtra): TimerSnapshot => {
  const displayMs = idleDisplay(config)
  const isCountDown = config.kind !== 'stopwatch' && (config.kind !== 'forTime' || !forTimeCountsUp(config))
  return {
    phase: 'idle',
    displayMs,
    remainingMs: isCountDown ? displayMs : 0,
    isCountDown,
    round: 0,
    totalRounds: totalRounds(config),
    label: labels[config.kind],
    sublabel: 'Listo',
    progress: 0,
    overallProgress: 0,
    warning: false,
    amrapRounds: extra.amrapRounds,
    finishedReason: null,
  }
}

const labels: Record<TimerConfig['kind'], string> = {
  amrap: 'AMRAP',
  forTime: 'FOR TIME',
  emom: 'EMOM',
  tabata: 'TABATA',
  intervals: 'INTERVALOS',
  stopwatch: 'CRONÓMETRO',
}

export interface EngineExtra {
  amrapRounds: number
  manualFinishMs: number | null
  started: boolean
}

export function totalRounds(config: TimerConfig) {
  if (config.kind === 'emom' || config.kind === 'tabata' || config.kind === 'intervals') {
    return config.rounds
  }
  return 0
}

export function programmedDurationMs(config: TimerConfig) {
  if (config.kind === 'amrap' || config.kind === 'forTime') {
    return config.durationSeconds * 1000
  }
  if (config.kind === 'emom') {
    return config.rounds * config.intervalSeconds * 1000
  }
  if (config.kind === 'tabata' || config.kind === 'intervals') {
    const work = config.workSeconds * 1000
    const rest = config.restSeconds * 1000
    if (config.rounds <= 0) return 0
    return config.rounds * work + Math.max(0, config.rounds - 1) * rest
  }
  return 0
}

function idleDisplay(config: TimerConfig) {
  if (config.kind === 'amrap') return config.durationSeconds * 1000
  if (config.kind === 'forTime') return forTimeCountsUp(config) ? 0 : config.durationSeconds * 1000
  if (config.kind === 'emom') return config.intervalSeconds * 1000
  if (config.kind === 'tabata' || config.kind === 'intervals') return config.workSeconds * 1000
  return 0
}

function finished(
  config: TimerConfig,
  displayMs: number,
  extra: EngineExtra,
  reason: Exclude<FinishedReason, null>,
  overallProgress = 1,
): TimerSnapshot {
  return {
    phase: 'finished',
    displayMs,
    remainingMs: 0,
    isCountDown: false,
    round: extra.amrapRounds,
    totalRounds: totalRounds(config),
    label: reason === 'cap' ? 'TIME CAP' : 'TERMINADO',
    sublabel: reason === 'manual' ? 'Marcado' : reason === 'cap' ? 'Tope alcanzado' : 'Completado',
    progress: 1,
    overallProgress,
    warning: false,
    amrapRounds: extra.amrapRounds,
    finishedReason: reason,
  }
}

function snapshot(
  partial: Omit<TimerSnapshot, 'amrapRounds' | 'finishedReason' | 'remainingMs'> & {
    extra: EngineExtra
    remainingMs?: number
  },
): TimerSnapshot {
  const { extra, remainingMs, ...rest } = partial
  return {
    ...rest,
    remainingMs: remainingMs ?? (rest.isCountDown ? rest.displayMs : 0),
    amrapRounds: extra.amrapRounds,
    finishedReason: null,
  }
}

export function computeSnapshot(
  config: TimerConfig,
  elapsedMs: number,
  extra: EngineExtra,
): TimerSnapshot {
  if (!extra.started) return idleBase(config, extra)

  const prepareMs = Math.max(0, config.prepareSeconds) * 1000
  if (prepareMs > 0 && elapsedMs < prepareMs) {
    const remaining = prepareMs - elapsedMs
    return snapshot({
      extra,
      phase: 'prepare',
      displayMs: remaining,
      isCountDown: true,
      round: 0,
      totalRounds: totalRounds(config),
      label: 'PREPARA',
      sublabel: remaining <= 3000 ? '3 · 2 · 1' : 'Cuenta atrás',
      progress: 1 - remaining / prepareMs,
      overallProgress: 0,
      warning: remaining <= 3000,
    })
  }

  const t = Math.max(0, elapsedMs - prepareMs)
  const programmed = programmedDurationMs(config)

  if (extra.manualFinishMs != null) {
    return finished(config, extra.manualFinishMs, extra, 'manual', programmed ? Math.min(1, extra.manualFinishMs / programmed) : 1)
  }

  if (config.kind === 'stopwatch') {
    return snapshot({
      extra,
      phase: 'work',
      displayMs: t,
      isCountDown: false,
      round: 0,
      totalRounds: 0,
      label: 'CRONÓMETRO',
      sublabel: 'En marcha',
      progress: 0,
      overallProgress: 0,
      warning: false,
    })
  }

  if (config.kind === 'amrap') {
    const total = Math.max(1, config.durationSeconds) * 1000
    const remaining = total - t
    if (remaining <= 0) return finished(config, total, extra, 'complete')
    return snapshot({
      extra,
      phase: 'work',
      displayMs: remaining,
      isCountDown: true,
      round: extra.amrapRounds,
      totalRounds: 0,
      label: 'AMRAP',
      sublabel: extra.amrapRounds === 1 ? '1 ronda' : `${extra.amrapRounds} rondas`,
      progress: 1 - remaining / total,
      overallProgress: t / total,
      warning: remaining <= 10000,
    })
  }

  if (config.kind === 'forTime') {
    const cap = config.durationSeconds * 1000
    if (cap > 0 && t >= cap) return finished(config, cap, extra, 'cap')
    const remaining = cap > 0 ? Math.max(0, cap - t) : 0
    const countUp = forTimeCountsUp(config)
    return snapshot({
      extra,
      phase: 'work',
      displayMs: countUp ? t : remaining,
      remainingMs: remaining,
      isCountDown: !countUp,
      round: 0,
      totalRounds: 0,
      label: 'FOR TIME',
      sublabel: cap > 0 ? `Cap ${formatCap(cap)}` : 'Sin tope',
      progress: cap > 0 ? t / cap : 0,
      overallProgress: cap > 0 ? t / cap : 0,
      warning: remaining > 0 && remaining <= 10000,
    })
  }

  if (config.kind === 'emom') {
    const interval = Math.max(1, config.intervalSeconds) * 1000
    const rounds = Math.max(1, config.rounds)
    const total = interval * rounds
    if (t >= total) return finished(config, total, extra, 'complete')
    const round = Math.floor(t / interval) + 1
    const remaining = interval - (t % interval)
    return snapshot({
      extra,
      phase: 'work',
      displayMs: remaining,
      isCountDown: true,
      round,
      totalRounds: rounds,
      label: 'EMOM',
      sublabel: `Ronda ${round} / ${rounds}`,
      progress: 1 - remaining / interval,
      overallProgress: t / total,
      warning: remaining <= 10000,
    })
  }

  return intervalSnapshot(config, t, extra)
}

function formatCap(ms: number) {
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, '0')}`
}

function intervalSnapshot(config: TimerConfig, t: number, extra: EngineExtra): TimerSnapshot {
  const rounds = Math.max(1, config.rounds)
  const workMs = Math.max(1, config.workSeconds) * 1000
  const restMs = Math.max(0, config.restSeconds) * 1000
  const total = programmedDurationMs(config)

  let cursor = t
  for (let round = 1; round <= rounds; round += 1) {
    if (cursor < workMs) {
      const remaining = workMs - cursor
      return snapshot({
        extra,
        phase: 'work',
        displayMs: remaining,
        isCountDown: true,
        round,
        totalRounds: rounds,
        label: 'WORK',
        sublabel: `Ronda ${round} / ${rounds}`,
        progress: 1 - remaining / workMs,
        overallProgress: total ? t / total : 0,
        warning: remaining <= 10000,
      })
    }
    cursor -= workMs
    const hasRest = round < rounds && restMs > 0
    if (hasRest) {
      if (cursor < restMs) {
        const remaining = restMs - cursor
        return snapshot({
          extra,
          phase: 'rest' as TimerPhase,
          displayMs: remaining,
          isCountDown: true,
          round,
          totalRounds: rounds,
          label: 'REST',
          sublabel: `Ronda ${round} / ${rounds}`,
          progress: 1 - remaining / restMs,
          overallProgress: total ? t / total : 0,
          warning: remaining <= 2000,
        })
      }
      cursor -= restMs
    }
  }

  return finished(config, total, extra, 'complete')
}
