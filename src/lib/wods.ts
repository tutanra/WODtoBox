import { buildHeroWod, HERO_SEED_REVISION, HERO_WODS, isHeroWodId } from '../data/heroWods'
import { normalizeWod, type Wod } from '../types/wod'

const KEY = 'wodplanning.wods'

function readStored(): Wod[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeWod).filter((wod): wod is Wod => wod != null)
  } catch {
    return []
  }
}

function readAll(): Wod[] {
  let wods = readStored()
  let changed = false
  for (const hero of HERO_WODS) {
    const existing = wods.find((wod) => wod.id === hero.id)
    if (!existing || existing.seedRevision !== HERO_SEED_REVISION) {
      wods = [...wods.filter((wod) => wod.id !== hero.id), hero.build()]
      changed = true
    }
  }
  if (changed) writeAll(wods)
  return wods
}

function writeAll(wods: Wod[]) {
  localStorage.setItem(KEY, JSON.stringify(wods))
}

function sortUserWods(wods: Wod[]) {
  return [...wods].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function listWods() {
  return sortUserWods(readAll().filter((wod) => !wod.seeded && !isHeroWodId(wod.id)))
}

export function listHeroWods() {
  const stored = readAll()
  return HERO_WODS.map((hero) => stored.find((wod) => wod.id === hero.id) ?? hero.build())
}

export function getWod(id: string) {
  return readAll().find((wod) => wod.id === id) ?? buildHeroWod(id)
}

export function saveWod(wod: Wod) {
  const seeded = wod.seeded || isHeroWodId(wod.id)
  const next: Wod = { ...wod, seeded, updatedAt: Date.now() }
  writeAll([next, ...readAll().filter((item) => item.id !== wod.id)])
  return next
}

export function deleteWod(id: string) {
  if (isHeroWodId(id)) return
  writeAll(readAll().filter((wod) => wod.id !== id))
}

export function restoreHeroWod(id: string) {
  const fresh = buildHeroWod(id)
  if (!fresh) return null
  return saveWod(fresh)
}

export function dumpWods() {
  return readAll()
}

export function replaceWods(wods: Wod[]) {
  writeAll(wods)
}
