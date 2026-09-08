export interface ProgramSet {
  id: string
  reps: number
  weightKg: number | null
  weightText: string
}

export interface ProgramExercise {
  id: string
  name: string
  cue: string
  sets: ProgramSet[]
}

export interface ProgramDay {
  id: string
  name: string
  focus: string
  exercises: ProgramExercise[]
}

export interface ProgramWeek {
  id: string
  number: number
  title: string
  phase: string
  goal: string
  days: ProgramDay[]
}

export interface ProgramTarget {
  movement: string
  start: string
  goal: string
  ratio: string
}

export interface Program {
  id: string
  name: string
  subtitle: string
  notes: string
  seeded: boolean
  targets: ProgramTarget[]
  weeks: ProgramWeek[]
  createdAt: number
  updatedAt: number
}

export interface SetLog {
  setId: string
  actualReps: number
  done: boolean
}

export interface SessionLog {
  id: string
  programId: string
  weekId: string
  dayId: string
  startedAt: number
  updatedAt: number
  completedAt: number | null
  restSeconds: number
  logs: SetLog[]
}

export function newId() {
  return crypto.randomUUID()
}

export function emptySet(): ProgramSet {
  return { id: newId(), reps: 3, weightKg: null, weightText: '' }
}

export function emptyExercise(): ProgramExercise {
  return {
    id: newId(),
    name: '',
    cue: '',
    sets: [emptySet(), emptySet(), emptySet()],
  }
}

export function emptyDay(name = 'Día 1'): ProgramDay {
  return {
    id: newId(),
    name,
    focus: '',
    exercises: [emptyExercise()],
  }
}

export const MAX_DAYS_PER_WEEK = 7

export function nextDayName(days: ProgramDay[]) {
  const used = new Set(days.map((day) => day.name.trim().toLowerCase()))
  for (let index = 1; index <= MAX_DAYS_PER_WEEK; index += 1) {
    const name = `Día ${index}`
    if (!used.has(name.toLowerCase())) return name
  }
  return `Día ${days.length + 1}`
}

export function emptyWeek(number: number): ProgramWeek {
  return {
    id: newId(),
    number,
    title: `Semana ${number}`,
    phase: '',
    goal: '',
    days: [emptyDay('Día 1')],
  }
}

export function cloneWeek(week: ProgramWeek, number: number): ProgramWeek {
  return {
    ...week,
    id: newId(),
    number,
    title: week.title,
    days: week.days.map((day) => ({
      ...day,
      id: newId(),
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        id: newId(),
        sets: exercise.sets.map((set) => ({ ...set, id: newId() })),
      })),
    })),
  }
}

export function renumberWeeks(weeks: ProgramWeek[]) {
  return weeks.map((week, index) => {
    const number = index + 1
    const autoTitle = week.title.trim() === `Semana ${week.number}` || week.title.trim() === ''
    return { ...week, number, title: autoTitle ? `Semana ${number}` : week.title }
  })
}

export function emptyTarget(): ProgramTarget {
  return { movement: '', start: '', goal: '', ratio: '' }
}

export function emptyProgram(): Program {
  const now = Date.now()
  return {
    id: newId(),
    name: '',
    subtitle: '',
    notes: '',
    seeded: false,
    targets: [],
    weeks: [emptyWeek(1)],
    createdAt: now,
    updatedAt: now,
  }
}

export function formatSet(set: ProgramSet) {
  const weight = set.weightText.trim()
  const kg = weight ? `${weight}${/kg|pesad|libre/i.test(weight) ? '' : ' kg'}` : '—'
  return `${set.reps} @ ${kg}`
}

export function formatScheme(sets: ProgramSet[]) {
  if (sets.length === 0) return 'Sin series'
  const groups: { reps: number; weight: string; count: number }[] = []
  for (const set of sets) {
    const weight = set.weightText.trim()
    const last = groups[groups.length - 1]
    if (last && last.reps === set.reps && last.weight === weight) {
      last.count += 1
    } else {
      groups.push({ reps: set.reps, weight, count: 1 })
    }
  }
  return groups
    .map((group) => {
      const load = group.weight ? `${group.weight}${/kg|pesad|libre/i.test(group.weight) ? '' : ' kg'}` : 'peso libre'
      return `${group.count} × ${group.reps} @ ${load}`
    })
    .join('  +  ')
}

export function findDay(program: Program, dayId: string) {
  for (const week of program.weeks) {
    const day = week.days.find((item) => item.id === dayId)
    if (day) return { week, day }
  }
  return null
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asFiniteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSet(value: unknown): ProgramSet | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const reps = asFiniteNumber(raw.reps, 0)
  if (reps < 1) return null
  const weightKg =
    typeof raw.weightKg === 'number' && Number.isFinite(raw.weightKg) ? raw.weightKg : null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    reps,
    weightKg,
    weightText: asString(raw.weightText, weightKg != null ? String(weightKg) : ''),
  }
}

function normalizeExercise(value: unknown): ProgramExercise | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.sets)) return null
  const sets = raw.sets.map(normalizeSet).filter((set): set is ProgramSet => set != null)
  if (sets.length === 0) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    name: asString(raw.name),
    cue: asString(raw.cue),
    sets,
  }
}

function normalizeDay(value: unknown): ProgramDay | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.exercises)) return null
  const exercises = raw.exercises
    .map(normalizeExercise)
    .filter((exercise): exercise is ProgramExercise => exercise != null)
  if (exercises.length === 0) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    name: asString(raw.name, 'Día'),
    focus: asString(raw.focus),
    exercises,
  }
}

function normalizeWeek(value: unknown): ProgramWeek | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.days)) return null
  const days = raw.days.map(normalizeDay).filter((day): day is ProgramDay => day != null)
  if (days.length === 0) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    number: asFiniteNumber(raw.number, 1),
    title: asString(raw.title),
    phase: asString(raw.phase),
    goal: asString(raw.goal),
    days,
  }
}

function normalizeTarget(value: unknown): ProgramTarget | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const movement = asString(raw.movement)
  const start = asString(raw.start)
  const goal = asString(raw.goal)
  const ratio = asString(raw.ratio)
  if (!movement && !start && !goal && !ratio) return null
  return { movement, start, goal, ratio }
}

export function normalizeProgram(value: unknown): Program | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id === '') return null
  if (!Array.isArray(raw.weeks)) return null
  const weeks = raw.weeks.map(normalizeWeek).filter((week): week is ProgramWeek => week != null)
  if (weeks.length === 0) return null
  return {
    id: raw.id,
    name: asString(raw.name),
    subtitle: asString(raw.subtitle),
    notes: asString(raw.notes),
    seeded: raw.seeded === true,
    targets: Array.isArray(raw.targets)
      ? raw.targets.map(normalizeTarget).filter((target): target is ProgramTarget => target != null)
      : [],
    weeks,
    createdAt: asFiniteNumber(raw.createdAt, Date.now()),
    updatedAt: asFiniteNumber(raw.updatedAt, Date.now()),
  }
}
