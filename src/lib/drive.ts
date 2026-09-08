import { PACK_FILENAME, LEGACY_PACK_FILENAME, buildPack, parsePack } from './pack'
import type { WodtoboxPack } from '../types/pack'
import type { GoogleSession } from './googleAuth'

const FOLDER_NAME = 'WODtoBox'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

export interface DriveCopy {
  id: string
  modifiedAt: number
  pack: WodtoboxPack
  folderId: string | null
  folderName: string
}

function headers(session: GoogleSession, extra?: HeadersInit): HeadersInit {
  return { Authorization: `Bearer ${session.accessToken}`, ...extra }
}

async function driveJson<T>(session: GoogleSession, url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: headers(session, init?.headers) })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Drive ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

type DriveFileHit = { id: string; name: string; modifiedAt: number }

async function listDrivePacks(session: GoogleSession): Promise<DriveFileHit[]> {
  const query = encodeURIComponent(
    `(name = '${PACK_FILENAME}' or name = '${LEGACY_PACK_FILENAME}') and trashed = false`,
  )
  const data = await driveJson<{ files?: { id: string; name?: string; modifiedTime?: string }[] }>(
    session,
    `${API}/files?q=${query}&spaces=drive&fields=files(id,name,modifiedTime)&pageSize=10&orderBy=modifiedTime%20desc`,
  )
  return (data.files ?? []).map((file) => ({
    id: file.id,
    name: file.name?.trim() || LEGACY_PACK_FILENAME,
    modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : 0,
  }))
}

export async function findDrivePack(session: GoogleSession): Promise<DriveFileHit | null> {
  const files = await listDrivePacks(session)
  if (!files.length) return null
  return files.find((file) => file.name === PACK_FILENAME) ?? files[0]
}

export async function downloadDrivePack(session: GoogleSession, fileId: string): Promise<WodtoboxPack> {
  const response = await fetch(`${API}/files/${fileId}?alt=media`, { headers: headers(session) })
  if (!response.ok) throw new Error('No se pudo leer el archivo de Drive')
  const pack = parsePack(await response.json())
  if (!pack) throw new Error('El archivo de Drive no es un pack de WODtoBox')
  return pack
}

export async function loadDriveCopy(session: GoogleSession): Promise<DriveCopy | null> {
  const found = await findDrivePack(session)
  if (!found) return null
  const pack = await downloadDrivePack(session, found.id)
  const location = await driveFileLocation(session, found.id)
  return { id: found.id, modifiedAt: found.modifiedAt, pack, ...location }
}

async function findAppFolder(session: GoogleSession): Promise<string | null> {
  const query = encodeURIComponent(
    `name = '${FOLDER_NAME}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
  )
  const data = await driveJson<{ files?: { id: string }[] }>(
    session,
    `${API}/files?q=${query}&spaces=drive&fields=files(id)&pageSize=1`,
  )
  return data.files?.[0]?.id ?? null
}

async function ensureAppFolder(session: GoogleSession): Promise<string> {
  const existing = await findAppFolder(session)
  if (existing) return existing
  const created = await driveJson<{ id: string }>(session, `${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: FOLDER_MIME,
      appProperties: { wodotobox: 'folder' },
    }),
  })
  return created.id
}

export async function driveFileLocation(
  session: GoogleSession,
  fileId: string,
): Promise<{ folderId: string | null; folderName: string }> {
  try {
    const meta = await driveJson<{ parents?: string[] }>(session, `${API}/files/${fileId}?fields=parents`)
    const folderId = meta.parents?.[0] ?? null
    if (!folderId) return { folderId: null, folderName: 'Mi unidad' }
    try {
      const folder = await driveJson<{ name?: string }>(session, `${API}/files/${folderId}?fields=name`)
      return { folderId, folderName: folder.name?.trim() || FOLDER_NAME }
    } catch {
      return { folderId, folderName: FOLDER_NAME }
    }
  } catch {
    return { folderId: null, folderName: 'Mi unidad' }
  }
}

async function createDriveFile(session: GoogleSession, pack: WodtoboxPack) {
  const folderId = await ensureAppFolder(session)
  const created = await driveJson<{ id: string }>(session, `${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: PACK_FILENAME,
      mimeType: 'application/json',
      parents: [folderId],
      appProperties: { wodotobox: 'pack' },
    }),
  })
  return updateDriveFile(session, created.id, pack)
}

async function renameDrivePack(session: GoogleSession, fileId: string) {
  try {
    await driveJson(session, `${API}/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: PACK_FILENAME, appProperties: { wodotobox: 'pack' } }),
    })
  } catch {
    /* el contenido ya está; el nombre viejo se sigue leyendo */
  }
}

async function updateDriveFile(session: GoogleSession, fileId: string, pack: WodtoboxPack) {
  const saved = await driveJson<{ id: string; modifiedTime?: string }>(
    session,
    `${UPLOAD}/files/${fileId}?uploadType=media&fields=id,modifiedTime`,
    {
      method: 'PATCH',
      body: JSON.stringify(pack),
      headers: { 'Content-Type': 'application/json' },
    },
  )
  await renameDrivePack(session, saved.id)
  return saved
}

export async function uploadDrivePack(session: GoogleSession, fileId?: string | null) {
  const pack = buildPack()
  let saved: { id: string; modifiedTime?: string } | null = null
  if (fileId) {
    try {
      saved = await updateDriveFile(session, fileId, pack)
    } catch {
      saved = null
    }
  }
  if (!saved) {
    const found = await findDrivePack(session)
    saved = found ? await updateDriveFile(session, found.id, pack) : await createDriveFile(session, pack)
  }
  const location = await driveFileLocation(session, saved.id)
  return {
    id: saved.id,
    modifiedAt: saved.modifiedTime ? Date.parse(saved.modifiedTime) : Date.now(),
    pack,
    ...location,
  }
}

function isMissingFile(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return /404|"notFound"|File not found|not found/i.test(message)
}

export async function deleteDrivePack(session: GoogleSession, fileId?: string | null) {
  const ids = new Set<string>()
  if (fileId) ids.add(fileId)
  for (const file of await listDrivePacks(session)) ids.add(file.id)
  for (const id of ids) {
    try {
      await driveJson(session, `${API}/files/${id}`, { method: 'DELETE' })
    } catch (err) {
      if (!isMissingFile(err)) throw err
    }
  }
}
