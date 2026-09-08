import { clearHistory, listHistory, replaceHistory } from './history'
import { listPrograms, replacePrograms } from './programs'
import { listRms, replaceRms } from './rms'
import { clearRunSession } from './runSession'
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

/** Plantilla PDF / WOD Hero recién reinsertada: no cuenta como cambio del usuario. */
function isUntouchedSeed(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.seeded !== true) return false
  const created = typeof record.createdAt === 'number' ? record.createdAt : 0
  const updated = typeof record.updatedAt === 'number' ? record.updatedAt : 0
  return Math.abs(updated - created) <= 2000
}

export function maxDataAt(items: unknown[]): number {
  return items.reduce<number>((max, item) => {
    if (isUntouchedSeed(item)) return max
    return Math.max(max, stampOf(item))
  }, 0)
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
  const dataAt = maxDataAt([...wods, ...programs, ...sessions, ...history, ...rms])
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

export const PACK_FILE_NAME = 'wodplanning.pack.json'

/** Descarga el pack local como `.json` (mismo formato que Drive). */
export function downloadPackFile() {
  const pack = buildPack()
  const blob = new Blob([`${JSON.stringify(pack, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = PACK_FILE_NAME
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Lee un fichero elegido por el usuario y valida `format: wodplanning.pack`. */
export async function readPackFromFile(file: File): Promise<WodPlanningPack | null> {
  let text: string
  try {
    text = await file.text()
  } catch {
    return null
  }
  try {
    return parsePack(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

export function purgeLocalData() {
  replaceWods([])
  replacePrograms([])
  replaceSessions([])
  clearHistory()
  replaceRms([])
  clearRunSession()
  listPrograms()
  dumpWods()
}
