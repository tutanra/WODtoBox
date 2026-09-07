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

export function parseWeightKg(text: string): number | null {
  const match = text.replace(',', '.').match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const value = Number(match[0])
  return Number.isFinite(value) ? value : null
}

export function formatRmLoad(lift: Pick<RmLift, 'weightText'>) {
  const text = lift.weightText.trim()
  if (!text) return '—'
  return /kg|lb|%|pesad|libre/i.test(text) ? text : `${text} kg`
}

export function formatRmLine(lift: RmLift) {
  return `${lift.reps} @ ${formatRmLoad(lift)}`
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
    reps: Math.max(1, reps),
    weightKg,
    weightText,
    liftedAt: typeof raw.liftedAt === 'number' ? raw.liftedAt : Date.now(),
  }
}

export function compareRm(a: RmLift, b: RmLift) {
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
