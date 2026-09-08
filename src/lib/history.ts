import { getProgram, listPrograms } from './programs'
import { deleteSessionsForProgram, getSession, listSessions, saveSession } from './sessions'
import {
  normalizeHistoryEntry,
  type HistoryEntry,
  type HistoryPlanEntry,
  type HistoryPlanExercise,
  type HistoryRmEntry,
  type HistoryWodEntry,
} from '../types/history'
import {
  findDay,
  newId,
  type Program,
  type ProgramDay,
  type ProgramWeek,
  type SessionLog,
} from '../types/program'
import type { TimerSnapshot } from '../types/timer'
import type { RmLift } from '../types/rm'
import type { Wod } from '../types/wod'

const KEY = 'wodtobox.history'
const MIGRATED_KEY = 'wodtobox.history.migratedSessions.v2'

function readStored(): HistoryEntry[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeHistoryEntry)
      .filter((entry): entry is HistoryEntry => entry != null)
  } catch {
    return []
  }
}

function writeAll(entries: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

function sortEntries(entries: HistoryEntry[]) {
  return [...entries].sort((a, b) => b.finishedAt - a.finishedAt)
}

function buildPlanEntry(
  session: SessionLog,
  program: Program,
  week: ProgramWeek,
  day: ProgramDay,
): HistoryPlanEntry {
  const exercises: HistoryPlanExercise[] = day.exercises.map((exercise) => ({
    name: exercise.name,
    cue: exercise.cue,
    sets: exercise.sets.map((set) => {
      const log = session.logs.find((item) => item.setId === set.id)
      return {
        setId: set.id,
        reps: set.reps,
        weightText: set.weightText,
        actualReps: log?.actualReps ?? set.reps,
        done: log?.done === true,
      }
    }),
  }))

  return {
    id: session.id,
    kind: 'plan',
    finishedAt: session.completedAt ?? session.updatedAt,
    programId: program.id,
    weekId: week.id,
    dayId: day.id,
    sessionId: session.id,
    programName: program.name,
    weekTitle: week.title,
    weekNumber: week.number,
    dayName: day.name,
    dayFocus: day.focus,
    exercises,
  }
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase()
}

function findProgramForHistory(programs: Program[], entry: HistoryPlanEntry) {
  const named = programs.filter((program) => normalizeLabel(program.name) === normalizeLabel(entry.programName))
  if (named.length === 1) return named[0]
  if (named.length > 1) return named.sort((a, b) => b.updatedAt - a.updatedAt)[0]
  return programs.find((program) => program.id === entry.programId) ?? null
}

function findWeekForHistory(program: Program, entry: HistoryPlanEntry) {
  return (
    program.weeks.find((week) => week.number === entry.weekNumber) ??
    program.weeks.find((week) => normalizeLabel(week.title) === normalizeLabel(entry.weekTitle)) ??
    null
  )
}

function findDayForHistory(week: ProgramWeek, entry: HistoryPlanEntry) {
  return week.days.find((day) => normalizeLabel(day.name) === normalizeLabel(entry.dayName)) ?? null
}

function relinkPlanEntry(entry: HistoryPlanEntry, program: Program, week: ProgramWeek, day: ProgramDay) {
  const logs: SessionLog['logs'] = []
  const exercises: HistoryPlanExercise[] = day.exercises.map((exercise, exerciseIndex) => {
    const histExercise = entry.exercises[exerciseIndex]
    return {
      name: exercise.name,
      cue: exercise.cue,
      sets: exercise.sets.map((set, setIndex) => {
        const histSet = histExercise?.sets[setIndex]
        const actualReps = histSet?.actualReps ?? set.reps
        const done = histSet?.done === true
        logs.push({ setId: set.id, actualReps, done })
        return {
          setId: set.id,
          reps: set.reps,
          weightText: set.weightText,
          actualReps,
          done,
        }
      }),
    }
  })

  const hasWork = logs.some((log) => log.done)
  if (!hasWork) return entry

  const existing = getSession(program.id, day.id)
  const allDone = logs.length > 0 && logs.every((log) => log.done)
  const session = saveSession({
    id: existing?.id ?? entry.sessionId ?? newId(),
    programId: program.id,
    weekId: week.id,
    dayId: day.id,
    startedAt: existing?.startedAt ?? entry.finishedAt,
    updatedAt: entry.finishedAt,
    completedAt: allDone ? entry.finishedAt : existing?.completedAt ?? null,
    restSeconds: existing?.restSeconds ?? 150,
    logs,
  })

  return {
    ...entry,
    programId: program.id,
    weekId: week.id,
    dayId: day.id,
    sessionId: session.id,
    programName: program.name,
    weekTitle: week.title,
    weekNumber: week.number,
    dayName: day.name,
    dayFocus: day.focus,
    exercises,
  }
}

/** Historial de plan con ids viejos (plantillas PDF) → programas actuales, y marca esas sesiones. */
export function relinkOrphanPlanHistory() {
  const programs = listPrograms()
  if (programs.length === 0) return
  const entries = readStored()
  let changed = false
  const next = entries.map((entry) => {
    if (entry.kind !== 'plan') return entry
    const current = getProgram(entry.programId)
    if (current && findDay(current, entry.dayId)) return entry
    const program = findProgramForHistory(programs, entry)
    if (!program) return entry
    const week = findWeekForHistory(program, entry)
    if (!week) return entry
    const day = findDayForHistory(week, entry)
    if (!day) return entry
    changed = true
    return relinkPlanEntry(entry, program, week, day)
  })
  if (changed) writeAll(sortEntries(next))
}

function backfillFromSessions(entries: HistoryEntry[]) {
  const known = new Set(
    entries.filter((entry): entry is HistoryPlanEntry => entry.kind === 'plan').map((entry) => entry.sessionId),
  )
  const extra: HistoryEntry[] = []

  for (const session of listSessions()) {
    const hasWork = session.logs.some((log) => log.done)
    if (!hasWork || known.has(session.id)) continue
    const program = getProgram(session.programId)
    if (!program) continue
    const found = findDay(program, session.dayId)
    if (!found) continue
    extra.push(buildPlanEntry(session, program, found.week, found.day))
    known.add(session.id)
  }

  if (extra.length === 0) return entries
  const next = sortEntries([...extra, ...entries])
  writeAll(next)
  return next
}

function migrateCompletedSessions() {
  if (localStorage.getItem(MIGRATED_KEY) === '1') return readStored()
  const next = backfillFromSessions(readStored())
  localStorage.setItem(MIGRATED_KEY, '1')
  return next
}

function planEntryHasWork(entry: HistoryPlanEntry) {
  return entry.exercises.some((exercise) => exercise.sets.some((set) => set.done))
}

function deletePlanHistory(sessionId: string) {
  writeAll(
    readStored().filter(
      (entry) => !(entry.kind === 'plan' && (entry.sessionId === sessionId || entry.id === sessionId)),
    ),
  )
}

function pruneEmptyPlanEntries(entries: HistoryEntry[]) {
  const next = entries.filter((entry) => entry.kind !== 'plan' || planEntryHasWork(entry))
  if (next.length !== entries.length) writeAll(next)
  return next
}

export function listHistory() {
  return sortEntries(pruneEmptyPlanEntries(migrateCompletedSessions()))
}

export function getHistoryEntry(id: string) {
  return listHistory().find((entry) => entry.id === id) ?? null
}

export function saveHistoryEntry<T extends HistoryEntry>(entry: T): T {
  const next = sortEntries([entry, ...readStored().filter((item) => item.id !== entry.id)])
  writeAll(next)
  return entry
}

export function deleteHistoryEntry(id: string) {
  writeAll(readStored().filter((entry) => entry.id !== id || entry.kind !== 'wod'))
}

export function replaceHistory(entries: unknown[]) {
  writeAll(
    sortEntries(
      entries.map(normalizeHistoryEntry).filter((entry): entry is HistoryEntry => entry != null),
    ),
  )
}

export function clearHistory() {
  writeAll([])
  localStorage.removeItem(MIGRATED_KEY)
}

export function renameRmHistory(from: string, to: string) {
  const previous = from.trim().toLowerCase()
  const next = to.trim()
  if (!previous || !next || previous === next.toLowerCase()) return
  writeAll(
    readStored().map((entry) =>
      entry.kind === 'rm' && entry.exercise.trim().toLowerCase() === previous
        ? { ...entry, exercise: next }
        : entry,
    ),
  )
}

export function deleteRmHistory(rmId: string) {
  writeAll(
    readStored().filter(
      (entry) => !(entry.kind === 'rm' && (entry.id === rmId || entry.rmId === rmId)),
    ),
  )
}

export function resetPlanProgress(programId: string) {
  deleteSessionsForProgram(programId)
}

export function recordWodFinish(runId: string, wod: Wod, snapshot: TimerSnapshot): HistoryWodEntry {
  const existing = readStored().find((entry) => entry.id === runId)
  if (existing?.kind === 'wod') return existing

  const entry: HistoryWodEntry = {
    id: runId,
    kind: 'wod',
    finishedAt: Date.now(),
    wodId: wod.id,
    name: wod.name,
    timerKind: wod.kind,
    timer: wod.timer,
    blocks: wod.blocks,
    result: {
      displayMs: snapshot.displayMs,
      amrapRounds: snapshot.amrapRounds,
      finishedReason: snapshot.finishedReason,
      label: snapshot.label,
      sublabel: snapshot.sublabel,
    },
  }
  return saveHistoryEntry(entry)
}

export function recordPlanSession(
  session: SessionLog,
  program: Program,
  week: ProgramWeek,
  day: ProgramDay,
): HistoryPlanEntry | null {
  const latest = getProgram(program.id) ?? program
  const found = findDay(latest, day.id)
  const next = buildPlanEntry(session, latest, found?.week ?? week, found?.day ?? day)
  const done = next.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
    0,
  )
  const existing = readStored().find(
    (entry) => entry.kind === 'plan' && entry.sessionId === session.id,
  )
  if (done === 0) {
    if (existing) deletePlanHistory(session.id)
    return null
  }
  return saveHistoryEntry({ ...next, finishedAt: Date.now() })
}

export function recordRmLift(lift: RmLift): HistoryRmEntry {
  return saveHistoryEntry({
    id: lift.id,
    kind: 'rm',
    finishedAt: lift.liftedAt,
    rmId: lift.id,
    exercise: lift.exercise,
    reps: lift.reps,
    weightText: lift.weightText,
  })
}
