import { formatClock } from '../lib/format'
import { summarizeTimer } from '../lib/summarize'
import { formatRmLine, parseWeightKg } from './rm'
import { type FinishedReason, type TimerConfig, type TimerKind } from './timer'
import { normalizeWod, type WodItem } from './wod'

export type HistoryKind = 'wod' | 'plan' | 'rm'

export interface HistoryWodResult {
  displayMs: number
  amrapRounds: number
  finishedReason: FinishedReason
  label: string
  sublabel: string
}

export interface HistoryWodEntry {
  id: string
  kind: 'wod'
  finishedAt: number
  wodId: string
  name: string
  timerKind: TimerKind
  timer: TimerConfig
  blocks: WodItem[]
  result: HistoryWodResult
}

export interface HistoryPlanSet {
  setId: string
  reps: number
  weightText: string
  actualReps: number
  done: boolean
}

export interface HistoryPlanExercise {
  name: string
  cue: string
  sets: HistoryPlanSet[]
}

export interface HistoryPlanEntry {
  id: string
  kind: 'plan'
  finishedAt: number
  programId: string
  weekId: string
  dayId: string
  sessionId: string
  programName: string
  weekTitle: string
  weekNumber: number
  dayName: string
  dayFocus: string
  exercises: HistoryPlanExercise[]
}

export interface HistoryRmEntry {
  id: string
  kind: 'rm'
  finishedAt: number
  rmId: string
  exercise: string
  reps: number
  weightText: string
}

export type HistoryEntry = HistoryWodEntry | HistoryPlanEntry | HistoryRmEntry

function asFinishedReason(value: unknown): FinishedReason {
  if (value === 'cap' || value === 'complete' || value === 'manual') return value
  return null
}

function normalizeWodResult(raw: unknown, timer: TimerConfig): HistoryWodResult {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const displayMs = typeof record.displayMs === 'number' ? Math.max(0, record.displayMs) : 0
  const amrapRounds = typeof record.amrapRounds === 'number' ? Math.max(0, record.amrapRounds) : 0
  return {
    displayMs,
    amrapRounds,
    finishedReason: asFinishedReason(record.finishedReason),
    label: typeof record.label === 'string' ? record.label : timer.kind === 'amrap' ? 'AMRAP' : 'TERMINADO',
    sublabel: typeof record.sublabel === 'string' ? record.sublabel : 'Completado',
  }
}

function normalizePlanSet(raw: unknown): HistoryPlanSet | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  if (typeof item.setId !== 'string') return null
  return {
    setId: item.setId,
    reps: typeof item.reps === 'number' ? item.reps : 0,
    weightText: typeof item.weightText === 'string' ? item.weightText : '',
    actualReps: typeof item.actualReps === 'number' ? item.actualReps : 0,
    done: item.done === true,
  }
}

function normalizePlanExercise(raw: unknown): HistoryPlanExercise | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const sets = Array.isArray(item.sets)
    ? item.sets.map(normalizePlanSet).filter((set): set is HistoryPlanSet => set != null)
    : []
  return {
    name: typeof item.name === 'string' ? item.name : '',
    cue: typeof item.cue === 'string' ? item.cue : '',
    sets,
  }
}

export function normalizeHistoryEntry(value: unknown): HistoryEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || typeof raw.finishedAt !== 'number') return null

  if (raw.kind === 'wod') {
    const wod = normalizeWod({
      id: typeof raw.wodId === 'string' ? raw.wodId : raw.id,
      name: typeof raw.name === 'string' ? raw.name : '',
      kind: raw.timerKind,
      timer: raw.timer,
      blocks: raw.blocks,
      createdAt: raw.finishedAt,
      updatedAt: raw.finishedAt,
    })
    if (!wod) return null
    return {
      id: raw.id,
      kind: 'wod',
      finishedAt: raw.finishedAt,
      wodId: wod.id,
      name: wod.name,
      timerKind: wod.kind,
      timer: wod.timer,
      blocks: wod.blocks,
      result: normalizeWodResult(raw.result, wod.timer),
    }
  }

  if (raw.kind === 'plan') {
    if (typeof raw.sessionId !== 'string' || typeof raw.programId !== 'string') return null
    if (typeof raw.weekId !== 'string' || typeof raw.dayId !== 'string') return null
    const exercises = Array.isArray(raw.exercises)
      ? raw.exercises
          .map(normalizePlanExercise)
          .filter((exercise): exercise is HistoryPlanExercise => exercise != null)
      : []
    return {
      id: raw.id,
      kind: 'plan',
      finishedAt: raw.finishedAt,
      programId: raw.programId,
      weekId: raw.weekId,
      dayId: raw.dayId,
      sessionId: raw.sessionId,
      programName: typeof raw.programName === 'string' ? raw.programName : '',
      weekTitle: typeof raw.weekTitle === 'string' ? raw.weekTitle : '',
      weekNumber: typeof raw.weekNumber === 'number' ? raw.weekNumber : 0,
      dayName: typeof raw.dayName === 'string' ? raw.dayName : '',
      dayFocus: typeof raw.dayFocus === 'string' ? raw.dayFocus : '',
      exercises,
    }
  }

  if (raw.kind === 'rm') {
    const exercise = typeof raw.exercise === 'string' ? raw.exercise : ''
    if (!exercise && typeof raw.name !== 'string') return null
    return {
      id: raw.id,
      kind: 'rm',
      finishedAt: raw.finishedAt,
      rmId: typeof raw.rmId === 'string' ? raw.rmId : raw.id,
      exercise: exercise || (typeof raw.name === 'string' ? raw.name : ''),
      reps: typeof raw.reps === 'number' && raw.reps > 0 ? Math.round(raw.reps) : 1,
      weightText: typeof raw.weightText === 'string' ? raw.weightText : '',
    }
  }

  return null
}

export function historyTitle(entry: HistoryEntry) {
  if (entry.kind === 'wod') return entry.name.trim() || 'WOD'
  if (entry.kind === 'rm') return entry.exercise.trim() || 'RM'
  return entry.programName.trim() || entry.dayName.trim() || 'Plan'
}

export function historySubtitle(entry: HistoryEntry) {
  if (entry.kind === 'wod') return summarizeTimer(entry.timer)
  if (entry.kind === 'rm') return `${entry.reps} ${entry.reps === 1 ? 'rep' : 'reps'}`
  const week = entry.weekTitle.trim() || (entry.weekNumber > 0 ? `Semana ${entry.weekNumber}` : '')
  const day = entry.dayName.trim()
  return [week, day].filter(Boolean).join(' · ') || 'Día de plan'
}

function formatSetLoad(weightText: string) {
  const text = weightText.trim()
  if (!text) return ''
  return /kg|lb|%|pesad|libre/i.test(text) ? text : `${text} kg`
}

export function planLiftSummary(entry: HistoryPlanEntry) {
  const parts: string[] = []
  for (const exercise of entry.exercises) {
    const done = exercise.sets.filter((set) => set.done)
    if (done.length === 0) continue
    const name = exercise.name.trim() || 'Ejercicio'
    const lines = [...new Set(done.map((set) => {
      const load = formatSetLoad(set.weightText)
      return load ? `${set.actualReps} @ ${load}` : `${set.actualReps} reps`
    }))]
    parts.push(`${name} ${lines.join(', ')}`)
  }
  return parts.join('\n')
}

export function historyResultLabel(entry: HistoryEntry) {
  if (entry.kind === 'plan') {
    const lifts = planLiftSummary(entry)
    if (lifts) return lifts
    const total = entry.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
    const done = entry.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
      0,
    )
    return `${done}/${total} series`
  }

  if (entry.kind === 'rm') {
    return formatRmLine({
      id: entry.id,
      exercise: entry.exercise,
      reps: entry.reps,
      weightText: entry.weightText,
      weightKg: parseWeightKg(entry.weightText),
      liftedAt: entry.finishedAt,
    })
  }

  if (entry.timerKind === 'amrap') {
    const rounds = entry.result.amrapRounds
    return rounds === 1 ? '1 ronda' : `${rounds} rondas`
  }
  if (entry.timerKind === 'forTime' || entry.timerKind === 'stopwatch') {
    const clock = formatClock(entry.result.displayMs, false)
    return entry.result.finishedReason === 'cap' ? `${clock} · cap` : clock
  }
  if (entry.timerKind === 'emom' || entry.timerKind === 'tabata' || entry.timerKind === 'intervals') {
    return entry.result.sublabel || 'Completado'
  }
  return entry.result.sublabel || 'Completado'
}

export function isHistoryKind(value: string | undefined): value is HistoryKind {
  return value === 'wod' || value === 'plan' || value === 'rm'
}
