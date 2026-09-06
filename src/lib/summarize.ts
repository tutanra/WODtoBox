import { formatCompact } from './format'
import type { TimerConfig } from '../types/timer'

export function summarizeTimer(config: TimerConfig) {
  if (config.kind === 'amrap') return `AMRAP ${formatCompact(config.durationSeconds)}`
  if (config.kind === 'forTime') {
    return config.durationSeconds > 0
      ? `For time · cap ${formatCompact(config.durationSeconds)} · ${config.countUp === false ? 'hacia abajo' : 'hacia arriba'}`
      : 'For time · sin cap'
  }
  if (config.kind === 'emom') {
    return `EMOM ${formatCompact(config.intervalSeconds)} × ${config.rounds}`
  }
  if (config.kind === 'tabata' || config.kind === 'intervals') {
    return `${config.workSeconds}s / ${config.restSeconds}s × ${config.rounds}`
  }
  return 'Cronómetro libre'
}
