import { buildPack, parsePack } from './pack'
import type { WodPlanningPack } from '../types/pack'
import type { GoogleSession } from './googleAuth'

const FILE_NAME = 'wodplanning.pack.json'
const FOLDER_NAME = 'WODtoBox'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

export interface DriveCopy {
  id: string
  modifiedAt: number
  pack: WodPlanningPack
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

export async function findDrivePack(session: GoogleSession): Promise<{ id: string; modifiedAt: number } | null> {
  const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`)
  const data = await driveJson<{ files?: { id: string; modifiedTime?: string }[] }>(
    session,
    `${API}/files?q=${query}&spaces=drive&fields=files(id,modifiedTime)&pageSize=5&orderBy=modifiedTime%20desc`,
  )
  const file = data.files?.[0]
  if (!file) return null
  return {
    id: file.id,
    modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : 0,
  }
}

export async function downloadDrivePack(session: GoogleSession, fileId: string): Promise<WodPlanningPack> {
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
      appProperties: { wodplanning: 'folder' },
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

async function createDriveFile(session: GoogleSession, pack: WodPlanningPack) {
  const folderId = await ensureAppFolder(session)
  const created = await driveJson<{ id: string }>(session, `${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FILE_NAME,
      mimeType: 'application/json',
      parents: [folderId],
      appProperties: { wodplanning: 'pack' },
    }),
  })
  return updateDriveFile(session, created.id, pack)
}

async function updateDriveFile(session: GoogleSession, fileId: string, pack: WodPlanningPack) {
  return driveJson<{ id: string; modifiedTime?: string }>(
    session,
    `${UPLOAD}/files/${fileId}?uploadType=media&fields=id,modifiedTime`,
    {
      method: 'PATCH',
      body: JSON.stringify(pack),
      headers: { 'Content-Type': 'application/json' },
    },
  )
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
  const found = await findDrivePack(session)
  if (found) ids.add(found.id)
  for (const id of ids) {
    try {
      await driveJson(session, `${API}/files/${id}`, { method: 'DELETE' })
    } catch (err) {
      if (!isMissingFile(err)) throw err
    }
  }
}
