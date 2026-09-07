export interface RmLift {
  id: string
  exercise: string
  reps: number
  weightKg: number | null
  weightText: string
  liftedAt: number
}

export function newRmLift(): RmLift {
  return {
    id: crypto.randomUUID(),
    exercise: '',
    reps: 1,
    weightKg: null,
    weightText: '',
    liftedAt: Date.now(),
  }
}

export const RM_MAX_REPS = 50

export function parseWeightKg(text: string): number | null {
  const match = text.replace(',', '.').match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const value = Number(match[0])
  return Number.isFinite(value) ? value : null
}

/** 1RM Epley. Con 1 rep el peso ya es el máximo. */
export function estimated1RmKg(lift: Pick<RmLift, 'reps' | 'weightKg'>): number | null {
  if (lift.weightKg == null || !Number.isFinite(lift.weightKg) || lift.weightKg <= 0) return null
  if (lift.reps <= 1) return lift.weightKg
  return lift.weightKg * (1 + lift.reps / 30)
}

export function formatKgValue(kg: number) {
  const rounded = Math.round(kg * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatEstimated1Rm(lift: Pick<RmLift, 'reps' | 'weightKg'>) {
  const rm = estimated1RmKg(lift)
  if (rm == null || lift.reps <= 1) return null
  return `(1@${formatKgValue(rm)}kg est.)`
}

export interface RmTrendPoint {
  id: string
  at: number
  kg: number
}

/** 1RM en el tiempo (Epley si reps ≠ 1). Sin kilos no entra. */
export function rmTrendPoints(lifts: RmLift[]): RmTrendPoint[] {
  return lifts
    .map((lift) => {
      const kg = estimated1RmKg(lift)
      if (kg == null) return null
      return { id: lift.id, at: lift.liftedAt, kg }
    })
    .filter((point): point is RmTrendPoint => point != null)
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
}

export function formatRmLoad(lift: Pick<RmLift, 'weightText'>) {
  const text = lift.weightText.trim()
  if (!text) return '—'
  return /kg|lb|%|pesad|libre/i.test(text) ? text : `${text} kg`
}

export function formatRmLine(lift: RmLift) {
  const load = `${lift.reps} @ ${formatRmLoad(lift)}`
  const epley = formatEstimated1Rm(lift)
  return epley ? `${load} ${epley}` : load
}

export function normalizeRmLift(value: unknown): RmLift | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string') return null
  const weightText = typeof raw.weightText === 'string' ? raw.weightText : typeof raw.weight === 'string' ? raw.weight : ''
  const weightKg =
    typeof raw.weightKg === 'number' && Number.isFinite(raw.weightKg) ? raw.weightKg : parseWeightKg(weightText)
  const reps = typeof raw.reps === 'number' && raw.reps > 0 ? Math.round(raw.reps) : 1
  return {
    id: raw.id,
    exercise: typeof raw.exercise === 'string' ? raw.exercise : '',
    reps: Math.min(RM_MAX_REPS, Math.max(1, reps)),
    weightKg,
    weightText,
    liftedAt: typeof raw.liftedAt === 'number' ? raw.liftedAt : Date.now(),
  }
}

export function compareRm(a: RmLift, b: RmLift) {
  const ea = estimated1RmKg(a) ?? a.weightKg ?? 0
  const eb = estimated1RmKg(b) ?? b.weightKg ?? 0
  if (ea !== eb) return ea - eb
  const wa = a.weightKg ?? 0
  const wb = b.weightKg ?? 0
  if (wa !== wb) return wa - wb
  return a.reps - b.reps
}

export function bestsByExercise(lifts: RmLift[]) {
  const map = new Map<string, RmLift>()
  for (const lift of lifts) {
    const key = lift.exercise.trim().toLowerCase() || lift.id
    const current = map.get(key)
    if (!current || compareRm(lift, current) > 0) map.set(key, lift)
  }
  return [...map.values()].sort((a, b) => a.exercise.localeCompare(b.exercise, 'es'))
}

export function groupRmsByExercise(lifts: RmLift[]) {
  const map = new Map<string, RmLift[]>()
  for (const lift of lifts) {
    const key = lift.exercise.trim().toLowerCase() || lift.id
    const list = map.get(key) ?? []
    list.push(lift)
    map.set(key, list)
  }
  return [...map.values()]
    .map((group) => {
      const best = group.reduce((current, lift) => (compareRm(lift, current) > 0 ? lift : current))
      return {
        name: best.exercise.trim() || 'Ejercicio',
        best,
        lifts: [...group].sort((a, b) => b.liftedAt - a.liftedAt),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
