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

export function emptyWeek(number: number): ProgramWeek {
  return {
    id: newId(),
    number,
    title: `Semana ${number}`,
    phase: '',
    goal: '',
    days: [emptyDay('Día 1'), emptyDay('Día 2')],
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
