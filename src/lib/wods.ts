import { normalizeWod, type Wod } from '../types/wod'

const KEY = 'wodplanning.wods'

function readAll(): Wod[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeWod)
      .filter((wod): wod is Wod => wod != null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function writeAll(wods: Wod[]) {
  localStorage.setItem(KEY, JSON.stringify(wods))
}

export function listWods() {
  return readAll()
}

export function getWod(id: string) {
  return readAll().find((wod) => wod.id === id) ?? null
}

export function saveWod(wod: Wod) {
  const next: Wod = { ...wod, updatedAt: Date.now() }
  const current = readAll().filter((item) => item.id !== wod.id)
  writeAll([next, ...current])
  return next
}

export function deleteWod(id: string) {
  writeAll(readAll().filter((wod) => wod.id !== id))
}
