import { relinkOrphanPlanHistory } from './history'
import { RETIRED_PLAN_TEMPLATE_IDS } from './retiredPlanIds'

const LEGACY_PREFIX = 'wodplanning.'
const PREFIX = 'wodtobox.'

function renamePrefix(storage: Storage) {
  const fromKeys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(LEGACY_PREFIX)) fromKeys.push(key)
  }
  for (const from of fromKeys) {
    const to = PREFIX + from.slice(LEGACY_PREFIX.length)
    if (storage.getItem(to) == null) {
      const value = storage.getItem(from)
      if (value != null) storage.setItem(to, value)
    }
    storage.removeItem(from)
  }
}

function dropRetiredPlanTemplates() {
  const retired = new Set<string>(RETIRED_PLAN_TEMPLATE_IDS)

  const dropById = (key: string, idOf: (item: Record<string, unknown>) => unknown) => {
    const raw = localStorage.getItem(key)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return
      const next = parsed.filter((item) => {
        if (!item || typeof item !== 'object') return false
        const id = idOf(item as Record<string, unknown>)
        return typeof id !== 'string' || !retired.has(id)
      })
      if (next.length !== parsed.length) localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* JSON viejo ilegible: lo deja el lector de la clave */
    }
  }

  dropById('wodtobox.programs', (item) => item.id)
  dropById('wodtobox.sessions', (item) => item.programId)
}

/** Copia `wodplanning.*` a `wodtobox.*`, borra las claves viejas y quita las plantillas PDF retiradas. */
export function migrateLegacyStorage() {
  renamePrefix(localStorage)
  renamePrefix(sessionStorage)
  dropRetiredPlanTemplates()
  relinkOrphanPlanHistory()
}
