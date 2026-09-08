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

/** Copia `wodplanning.*` a `wodtobox.*` y borra las claves viejas. */
export function migrateLegacyStorage() {
  renamePrefix(localStorage)
  renamePrefix(sessionStorage)
}
