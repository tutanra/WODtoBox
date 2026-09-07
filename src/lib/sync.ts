export interface SyncMeta {
  lastSyncAt: number | null
  lastDirection: 'up' | 'down' | null
  driveFileId: string | null
  driveDataAt: number | null
  email: string | null
}

const KEY = 'wodplanning.sync'
const CLIENT_KEY = 'wodplanning.googleClientId'

const empty: SyncMeta = {
  lastSyncAt: null,
  lastDirection: null,
  driveFileId: null,
  driveDataAt: null,
  email: null,
}

export function readSyncMeta(): SyncMeta {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { ...empty }
  try {
    const parsed = JSON.parse(raw) as Partial<SyncMeta>
    return {
      lastSyncAt: typeof parsed.lastSyncAt === 'number' ? parsed.lastSyncAt : null,
      lastDirection: parsed.lastDirection === 'up' || parsed.lastDirection === 'down' ? parsed.lastDirection : null,
      driveFileId: typeof parsed.driveFileId === 'string' ? parsed.driveFileId : null,
      driveDataAt: typeof parsed.driveDataAt === 'number' ? parsed.driveDataAt : null,
      email: typeof parsed.email === 'string' ? parsed.email : null,
    }
  } catch {
    return { ...empty }
  }
}

export function writeSyncMeta(patch: Partial<SyncMeta>) {
  const next = { ...readSyncMeta(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function getGoogleClientId() {
  const stored = localStorage.getItem(CLIENT_KEY)?.trim()
  if (stored) return stored
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID
  return typeof fromEnv === 'string' ? fromEnv.trim() : ''
}

export function saveGoogleClientId(id: string) {
  const value = id.trim()
  if (value) localStorage.setItem(CLIENT_KEY, value)
  else localStorage.removeItem(CLIENT_KEY)
  return value
}
