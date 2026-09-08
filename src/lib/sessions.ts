import { isRetiredPlanTemplateId } from './retiredPlanIds'
import { newId, type Program, type SessionLog } from '../types/program'

const KEY = 'wodtobox.sessions'

function readAll(): SessionLog[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && !isRetiredPlanTemplateId((item as SessionLog).programId),
    ) as SessionLog[]
  } catch {
    return []
  }
}

function writeAll(sessions: SessionLog[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions))
}

export function listSessions() {
  return readAll()
}

export function getSession(programId: string, dayId: string) {
  return (
    readAll()
      .filter((session) => session.programId === programId && session.dayId === dayId)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
  )
}

export function saveSession(session: SessionLog) {
  const next: SessionLog = { ...session, updatedAt: Date.now() }
  writeAll([next, ...readAll().filter((item) => item.id !== session.id)])
  return next
}

export function startSession(programId: string, weekId: string, dayId: string, restSeconds = 150) {
  const existing = getSession(programId, dayId)
  if (existing) return existing
  const now = Date.now()
  const session: SessionLog = {
    id: newId(),
    programId,
    weekId,
    dayId,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    restSeconds: restSeconds,
    logs: [],
  }
  return saveSession(session)
}

export function deleteSessionsForProgram(programId: string) {
  writeAll(readAll().filter((session) => session.programId !== programId))
}

export function deleteSessionForDay(programId: string, dayId: string) {
  writeAll(readAll().filter((session) => !(session.programId === programId && session.dayId === dayId)))
}

export function replaceSessions(sessions: unknown[]) {
  writeAll(
    sessions.filter(
      (item) =>
        item &&
        typeof (item as SessionLog).id === 'string' &&
        !isRetiredPlanTemplateId((item as SessionLog).programId),
    ) as SessionLog[],
  )
}

export function sessionProgress(session: SessionLog | null, totalSets: number) {
  if (!session || totalSets === 0) return 0
  const done = session.logs.filter((log) => log.done).length
  return Math.min(1, done / totalSets)
}

export function programOverview(program: Program) {
  const byDay = new Map<string, SessionLog>()
  for (const session of listSessions()) {
    if (session.programId !== program.id) continue
    const prev = byDay.get(session.dayId)
    if (!prev || session.updatedAt > prev.updatedAt) byDay.set(session.dayId, session)
  }

  let dayCount = 0
  let doneDays = 0
  let progressSum = 0
  let next: { weekId: string; dayId: string; label: string } | null = null

  for (const week of program.weeks) {
    for (const day of week.days) {
      dayCount += 1
      const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
      const progress = sessionProgress(byDay.get(day.id) ?? null, totalSets)
      progressSum += progress
      if (progress >= 1) doneDays += 1
      else if (!next) {
        next = { weekId: week.id, dayId: day.id, label: `S${week.number} · ${day.name}` }
      }
    }
  }

  return {
    weekCount: program.weeks.length,
    dayCount,
    doneDays,
    ratio: dayCount === 0 ? 0 : progressSum / dayCount,
    next,
  }
}
