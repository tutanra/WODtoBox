export interface SyncMeta {
  lastSyncAt: number | null
  lastDirection: 'up' | 'down' | null
  driveFileId: string | null
  driveDataAt: number | null
  driveFolderId: string | null
  driveFolderName: string | null
  email: string | null
}

const KEY = 'wodtobox.sync'

/** Client ID OAuth de tipo Aplicación web. El de Android no se usa en código. */
export const GOOGLE_WEB_CLIENT_ID =
  '573815267654-36ifill6trq7cbs0flvn3j3t87g8m67c.apps.googleusercontent.com'

const empty: SyncMeta = {
  lastSyncAt: null,
  lastDirection: null,
  driveFileId: null,
  driveDataAt: null,
  driveFolderId: null,
  driveFolderName: null,
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
      driveFolderId: typeof parsed.driveFolderId === 'string' ? parsed.driveFolderId : null,
      driveFolderName: typeof parsed.driveFolderName === 'string' ? parsed.driveFolderName : null,
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

export function clearSyncProgress() {
  return writeSyncMeta({
    lastSyncAt: null,
    lastDirection: null,
    driveFileId: null,
    driveDataAt: null,
    driveFolderId: null,
    driveFolderName: null,
  })
}

export function getGoogleClientId() {
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim()
  return GOOGLE_WEB_CLIENT_ID
}
