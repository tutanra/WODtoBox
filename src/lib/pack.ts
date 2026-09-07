import { listHistory, replaceHistory } from './history'
import { listPrograms, replacePrograms } from './programs'
import { listRms, replaceRms } from './rms'
import { listSessions, replaceSessions } from './sessions'
import { dumpWods, replaceWods } from './wods'
import { normalizeWod } from '../types/wod'
import { PACK_FORMAT, type WodPlanningPack } from '../types/pack'

function stampOf(value: unknown): number {
  if (!value || typeof value !== 'object') return 0
  const record = value as Record<string, unknown>
  const keys = ['updatedAt', 'finishedAt', 'liftedAt', 'createdAt', 'startedAt']
  return Math.max(0, ...keys.map((key) => (typeof record[key] === 'number' ? record[key] : 0)))
}

export function maxDataAt(items: unknown[]): number {
  return items.reduce<number>((max, item) => Math.max(max, stampOf(item)), 0)
}

export function buildPack(): WodPlanningPack {
  const wods = dumpWods()
  const programs = listPrograms()
  const sessions = listSessions()
  const history = listHistory()
  const rms = listRms()
  return {
    format: PACK_FORMAT,
    schemaVersion: 1,
    exportedAt: Date.now(),
    dataAt: maxDataAt([...wods, ...programs, ...sessions, ...history, ...rms]),
    wods,
    programs,
    sessions,
    history,
    rms,
  }
}

export function localDataAt() {
  return buildPack().dataAt
}

export function parsePack(value: unknown): WodPlanningPack | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.format !== PACK_FORMAT) return null
  if (raw.schemaVersion !== 1) return null
  const wods = Array.isArray(raw.wods) ? raw.wods : []
  const programs = Array.isArray(raw.programs) ? raw.programs : []
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : []
  const history = Array.isArray(raw.history) ? raw.history : []
  const rms = Array.isArray(raw.rms) ? raw.rms : []
  const exportedAt = typeof raw.exportedAt === 'number' ? raw.exportedAt : 0
  const dataAt =
    typeof raw.dataAt === 'number' ? raw.dataAt : maxDataAt([...wods, ...programs, ...sessions, ...history, ...rms])
  return {
    format: PACK_FORMAT,
    schemaVersion: 1,
    exportedAt,
    dataAt,
    wods,
    programs,
    sessions,
    history,
    rms,
  }
}

export function applyPack(pack: WodPlanningPack) {
  replaceWods(pack.wods.map(normalizeWod).filter((wod) => wod != null))
  replacePrograms(pack.programs)
  replaceSessions(pack.sessions)
  replaceHistory(pack.history)
  replaceRms(pack.rms)
}
