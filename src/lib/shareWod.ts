import { normalizeWod, type Wod } from '../types/wod'
import { WOD_SHARE_FORMAT } from '../types/pack'
import { shareFilename, shareOrDownloadFile } from './shareFile'

export interface WodtoboxWodFile {
  format: typeof WOD_SHARE_FORMAT
  schemaVersion: 1
  exportedAt: number
  wod: Wod
}

export function buildWodShare(wod: Wod): WodtoboxWodFile {
  return {
    format: WOD_SHARE_FORMAT,
    schemaVersion: 1,
    exportedAt: Date.now(),
    wod,
  }
}

export function parseWodShare(value: unknown): WodtoboxWodFile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.format !== WOD_SHARE_FORMAT || raw.schemaVersion !== 1) return null
  const wod = normalizeWod(raw.wod)
  if (!wod) return null
  return {
    format: WOD_SHARE_FORMAT,
    schemaVersion: 1,
    exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : 0,
    wod,
  }
}

export function parseWodShareText(text: string): WodtoboxWodFile | null {
  try {
    return parseWodShare(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

export function copyImportedWod(wod: Wod): Wod {
  const now = Date.now()
  return {
    ...wod,
    id: crypto.randomUUID(),
    seeded: false,
    seedRevision: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export async function exportWodFile(wod: Wod) {
  const json = `${JSON.stringify(buildWodShare(wod), null, 2)}\n`
  const file = new File([json], shareFilename(wod.name), { type: 'application/json' })
  await shareOrDownloadFile(file)
}
