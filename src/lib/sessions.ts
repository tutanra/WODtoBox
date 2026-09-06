import type { SessionLog } from '../types/program'
import { newId } from '../types/program'

const KEY = 'wodplanning.sessions'

function readAll(): SessionLog[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item.id === 'string') as SessionLog[]
  } catch {
    return []
  }
}

function writeAll(sessions: SessionLog[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions))
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
  if (existing && !existing.completedAt) return existing
  const now = Date.now()
  const session: SessionLog = {
    id: newId(),
    programId,
    weekId,
    dayId,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    restSeconds: existing?.restSeconds ?? restSeconds,
    logs: [],
  }
  return saveSession(session)
}

export function sessionProgress(session: SessionLog | null, totalSets: number) {
  if (!session || totalSets === 0) return 0
  const done = session.logs.filter((log) => log.done).length
  return Math.min(1, done / totalSets)
}
