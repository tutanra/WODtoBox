import { getProgram } from './programs'
import { deleteSessionsForProgram, listSessions } from './sessions'
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
  type Program,
  type ProgramDay,
  type ProgramWeek,
  type SessionLog,
} from '../types/program'
import type { TimerSnapshot } from '../types/timer'
import type { RmLift } from '../types/rm'
import type { Wod } from '../types/wod'

const KEY = 'wodplanning.history'
const MIGRATED_KEY = 'wodplanning.history.migratedSessions.v2'

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

export function listHistory() {
  return sortEntries(migrateCompletedSessions())
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
  if (done === 0 && !existing) return null
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
