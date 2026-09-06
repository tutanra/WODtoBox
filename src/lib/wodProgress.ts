import type { TimerSnapshot } from '../types/timer'
import { flattenRests, flattenWork, type Wod } from '../types/wod'

export function activeBlockId(wod: Wod, snapshot: TimerSnapshot): string | null {
  if (snapshot.phase === 'idle' || snapshot.phase === 'prepare' || snapshot.phase === 'finished') {
    return null
  }

  const work = flattenWork(wod.blocks)
  const rest = flattenRests(wod.blocks)
  const round = Math.max(1, snapshot.round || 1)

  if (snapshot.phase === 'rest') {
    if (rest.length === 0) return null
    return rest[(round - 1) % rest.length].id
  }

  if (wod.kind === 'amrap' || wod.kind === 'forTime' || wod.kind === 'stopwatch') {
    return null
  }

  if (work.length === 0) return null
  return work[(round - 1) % work.length].id
}
