import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Cloud, CloudDownload, CloudUpload, FileDown, FileUp, LogIn, LogOut, Smartphone, Trash2 } from 'lucide-react'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { formatHistoryDay, formatHistoryTime } from '../lib/format'
import { applyPack, exportPackFile, localDataAt, parsePackText, purgeLocalData } from '../lib/pack'
import {
  googleSignIn,
  googleSignOut,
  currentGoogleSession,
  type GoogleSession,
} from '../lib/googleAuth'
import { deleteDrivePack, loadDriveCopy, uploadDrivePack, type DriveCopy } from '../lib/drive'
import { getGoogleClientId, readSyncMeta, writeSyncMeta } from '../lib/sync'
import type { WodtoboxPack } from '../types/pack'

type Compare = 'none' | 'local' | 'drive' | 'same'

function compare(localAt: number, driveAt: number | null): Compare {
  if (driveAt == null) return 'none'
  if (localAt > driveAt + 1000) return 'local'
  if (driveAt > localAt + 1000) return 'drive'
  return 'same'
}

function stamp(ts: number | null) {
  if (!ts) return 'Nunca'
  return `${formatHistoryDay(ts)} · ${formatHistoryTime(ts)}`
}

export function DriveSync() {
  const [session, setSession] = useState<GoogleSession | null>(() => currentGoogleSession())
  const [meta, setMeta] = useState(() => readSyncMeta())
  const [remote, setRemote] = useState<DriveCopy | null>(null)
  const [busy, setBusy] = useState<'login' | 'remote' | 'up' | 'down' | 'out' | 'purge' | 'file' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDown, setPendingDown] = useState(false)
  const [pendingUp, setPendingUp] = useState(false)
  const [pendingImport, setPendingImport] = useState<WodtoboxPack | null>(null)
  const [pendingPurge, setPendingPurge] = useState<null | 'choose' | 'local' | 'drive'>(null)
  const [localStamp, setLocalStamp] = useState(0)
  const [remoteLoaded, setRemoteLoaded] = useState(() => !currentGoogleSession())
  const fileRef = useRef<HTMLInputElement>(null)
  const clientId = getGoogleClientId()
  const localAt = useMemo(() => localDataAt(), [meta.lastSyncAt, remote, localStamp])
  const liveDriveAt = remote?.pack.dataAt ?? null
  const driveAt = liveDriveAt ?? (remoteLoaded && !error ? null : meta.driveDataAt)
  const status = compare(localAt, driveAt)
  const driveWins = status === 'drive'

  const refreshRemote = async (nextSession: GoogleSession) => {
    setBusy('remote')
    try {
      const copy = await loadDriveCopy(nextSession)
      setRemote(copy)
      if (copy) {
        setMeta(
          writeSyncMeta({
            driveFileId: copy.id,
            driveDataAt: copy.pack.dataAt,
            driveFolderId: copy.folderId,
            driveFolderName: copy.folderName,
          }),
        )
      } else {
        setMeta(writeSyncMeta({ driveFileId: null, driveDataAt: null }))
      }
      setError(null)
      return { copy, ok: true as const }
    } catch (err) {
      setRemote(null)
      setError(err instanceof Error ? err.message : 'No se pudo leer Drive')
      return { copy: null, ok: false as const }
    } finally {
      setRemoteLoaded(true)
      setBusy(null)
    }
  }

  useEffect(() => {
    if (session) void refreshRemote(session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async () => {
    setBusy('login')
    setError(null)
    try {
      const next = await googleSignIn()
      setSession(next)
      setMeta(writeSyncMeta({ email: next.email }))
      await refreshRemote(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar con Google')
    } finally {
      setBusy(null)
    }
  }

  const logout = async () => {
    setBusy('out')
    await googleSignOut()
    setSession(null)
    setRemote(null)
    setRemoteLoaded(true)
    setMeta(writeSyncMeta({ email: null }))
    setBusy(null)
  }

  const upload = async () => {
    if (!session) return
    setBusy('up')
    setError(null)
    try {
      const saved = await uploadDrivePack(session, remote?.id ?? meta.driveFileId)
      setRemote(saved)
      setMeta(
        writeSyncMeta({
          lastSyncAt: Date.now(),
          lastDirection: 'up',
          driveFileId: saved.id,
          driveDataAt: saved.pack.dataAt,
          driveFolderId: saved.folderId,
          driveFolderName: saved.folderName,
          email: session.email,
        }),
      )
      setPendingUp(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir a Drive')
    } finally {
      setBusy(null)
    }
  }

  const download = () => {
    if (!remote) return
    applyPack(remote.pack)
    setMeta(
      writeSyncMeta({
        lastSyncAt: Date.now(),
        lastDirection: 'down',
        driveFileId: remote.id,
        driveDataAt: remote.pack.dataAt,
        driveFolderId: remote.folderId,
        driveFolderName: remote.folderName,
      }),
    )
    setLocalStamp((value) => value + 1)
    setPendingDown(false)
  }

  const purgeLocal = () => {
    purgeLocalData()
    setLocalStamp((value) => value + 1)
    setPendingPurge(null)
  }

  const exportFile = async () => {
    setBusy('file')
    setError(null)
    try {
      await exportPackFile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el fichero.')
    } finally {
      setBusy(null)
    }
  }

  const pickImportFile = () => {
    setError(null)
    fileRef.current?.click()
  }

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('file')
    try {
      const pack = parsePackText(await file.text())
      if (!pack) {
        setError('Ese archivo no es un pack de WODtoBox.')
        return
      }
      setError(null)
      setPendingImport(pack)
    } catch {
      setError('No se pudo leer el fichero.')
    } finally {
      setBusy(null)
    }
  }

  const applyImport = () => {
    if (!pendingImport) return
    applyPack(pendingImport)
    setLocalStamp((value) => value + 1)
    setPendingImport(null)
  }

  const purgeDrive = async () => {
    if (!session) return
    setBusy('purge')
    setError(null)
    try {
      await deleteDrivePack(session, remote?.id ?? meta.driveFileId)
      setRemote(null)
      setMeta(writeSyncMeta({ driveFileId: null, driveDataAt: null, lastDirection: null }))
      setPendingPurge(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar el archivo de Drive.')
      setPendingPurge(null)
    } finally {
      setBusy(null)
    }
  }

  const onSync = async () => {
    if (!session) return
    if (driveWins) {
      let copy = remote
      if (!copy) {
        const probed = await refreshRemote(session)
        if (!probed.ok) return
        copy = probed.copy
      }
      if (copy) {
        setPendingDown(true)
        return
      }
    }
    void upload()
  }

  const statusCopy =
    session && !remoteLoaded
      ? 'Comprobando Drive…'
      : error && !remote
        ? 'No se pudo leer la copia de Drive.'
        : status === 'none'
          ? 'Todavía no hay copia en Drive.'
          : status === 'local'
            ? 'Este dispositivo tiene cambios más nuevos que Drive.'
            : status === 'drive'
              ? 'Drive tiene una copia más nueva que este dispositivo.'
              : 'Este dispositivo y Drive están al día.'

  return (
    <Screen>
      <TopBar
        title="DRIVE"
        action={
          <button
            type="button"
            disabled={busy != null}
            onClick={() => setPendingPurge('choose')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-warn/50 bg-panel text-warn disabled:opacity-40"
            aria-label="Purgar datos"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        }
      />
      <p className="mb-5 text-sm text-mute">
        Copia WODs, plan, RM e historial a Google Drive o a un fichero JSON. La primera subida a Drive
        crea la carpeta WODtoBox. Si luego mueves el archivo, las siguientes syncs siguen ahí. El
        timer en curso no se copia. La cuenta es opcional. La papelera deja elegir: borrar este
        dispositivo o la copia en Drive.
      </p>

      <article className="rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-flame">ÚLTIMA SYNC</p>
        <p className="mt-2 font-display text-4xl leading-none text-paper">{stamp(meta.lastSyncAt)}</p>
        <p className="mt-2 text-sm text-mute">
          {meta.lastDirection === 'up' ? 'Subida a Drive' : meta.lastDirection === 'down' ? 'Bajada de Drive' : 'Aún no has sincronizado.'}
        </p>
      </article>

      <article className="mt-3 rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-flame">ESTADO</p>
        <p className="mt-2 text-sm font-semibold text-gold">{statusCopy}</p>
        <p className="mt-2 text-xs text-mute">Local: {stamp(localAt || null)}</p>
        <p className="mt-2 text-xs text-mute">Drive: {stamp(driveAt)}</p>
        <p className="text-xs text-mute">
          Carpeta:{' '}
          {remote?.folderName ||
            meta.driveFolderName ||
            (session ? 'WODtoBox (al subir)' : 'WODtoBox')}
        </p>
      </article>

      <article className="mt-3 rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-flame">FICHERO</p>
        <p className="mt-2 text-sm text-mute">
          El mismo pack que Drive, wodtobox.pack.json, para pasar datos entre PC y móvil sin
          cuenta.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy != null}
            onClick={() => void exportFile()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-panel-2 py-3 text-sm font-semibold text-paper disabled:opacity-40"
          >
            <FileDown className="h-4 w-4" />
            {busy === 'file' ? '…' : 'Exportar'}
          </button>
          <button
            type="button"
            disabled={busy != null}
            onClick={pickImportFile}
            className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-panel-2 py-3 text-sm font-semibold text-paper disabled:opacity-40"
          >
            <FileUp className="h-4 w-4" />
            Importar
          </button>
        </div>
      </article>

      {error ? <p className="mt-3 text-sm text-warn">{error}</p> : null}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void onImportFile(event)}
      />

      <div className="mt-auto flex flex-col gap-3 pt-6">
        {session ? (
          <>
            <p className="text-center text-sm text-mute">{session.email || session.name}</p>
            <button
              type="button"
              disabled={busy != null || Boolean(session && !remoteLoaded)}
              onClick={() => void onSync()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-flame py-4 font-display text-3xl tracking-wide text-ink disabled:opacity-40"
            >
              {driveWins ? <CloudDownload className="h-6 w-6" /> : <CloudUpload className="h-6 w-6" />}
              {busy === 'up' ? 'SUBIENDO…' : busy === 'down' ? 'BAJANDO…' : 'SYNC'}
            </button>
            {driveWins ? (
              <button
                type="button"
                disabled={busy != null || Boolean(session && !remoteLoaded)}
                onClick={() => setPendingUp(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-panel py-3 font-semibold text-paper disabled:opacity-40"
              >
                <CloudUpload className="h-4 w-4" />
                Subir copia a Drive
              </button>
            ) : remote ? (
              <button
                type="button"
                disabled={busy != null}
                onClick={() => setPendingDown(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-panel py-3 font-semibold text-paper disabled:opacity-40"
              >
                <CloudDownload className="h-4 w-4" />
                Bajar copia de Drive
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy != null}
              onClick={() => void logout()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line py-3 font-semibold text-mute"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy != null || !clientId}
            onClick={() => void login()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-flame py-4 font-display text-3xl tracking-wide text-ink disabled:opacity-40"
          >
            <LogIn className="h-6 w-6" />
            {busy === 'login' ? 'ENTRANDO…' : 'GOOGLE'}
          </button>
        )}
      </div>

      {pendingImport ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Sustituir los datos de este dispositivo?</p>
            <p className="mt-2 text-sm text-mute">
              Se reemplazan WODs, plan, sesiones, RM e historial por el fichero. El timer en curso no
              se toca.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button type="button" onClick={applyImport} className="rounded-2xl bg-flame py-3 font-semibold text-ink">
                Importar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDown ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Sustituir los datos de este dispositivo?</p>
            <p className="mt-2 text-sm text-mute">
              Se reemplazan WODs, plan, sesiones, RM e historial por la copia de Drive. El timer en
              curso no se toca.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDown(false)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button type="button" onClick={download} className="rounded-2xl bg-flame py-3 font-semibold text-ink">
                Bajar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingUp ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Sustituir la copia en Drive?</p>
            <p className="mt-2 text-sm text-mute">
              Se reemplaza el archivo de Drive por los datos de este dispositivo. Lo que haya en
              Drive más nuevo se pierde.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy != null}
                onClick={() => setPendingUp(false)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy != null}
                onClick={() => void upload()}
                className="rounded-2xl bg-flame py-3 font-semibold text-ink disabled:opacity-40"
              >
                {busy === 'up' ? 'SUBIENDO…' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingPurge === 'choose' ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Qué quieres borrar?</p>
            <p className="mt-2 text-sm text-mute">
              Solo se borra lo que elijas. Puedes vaciar este dispositivo y dejar Drive, o al revés.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                disabled={busy != null}
                onClick={() => setPendingPurge('local')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-panel py-3 font-semibold text-paper disabled:opacity-40"
              >
                <Smartphone className="h-4 w-4" />
                Este dispositivo
              </button>
              <button
                type="button"
                disabled={busy != null || !session}
                onClick={() => setPendingPurge('drive')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-panel py-3 font-semibold text-paper disabled:opacity-40"
              >
                <Cloud className="h-4 w-4" />
                {session ? 'Copia en Drive' : 'Copia en Drive (entra con Google)'}
              </button>
              <button
                type="button"
                disabled={busy != null}
                onClick={() => setPendingPurge(null)}
                className="rounded-2xl border border-line py-3 font-semibold text-mute disabled:opacity-40"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingPurge === 'local' || pendingPurge === 'drive' ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              {pendingPurge === 'local' ? '¿Borrar este dispositivo?' : '¿Borrar la copia en Drive?'}
            </p>
            <p className="mt-2 text-sm text-mute">
              {pendingPurge === 'local'
                ? 'Se borran WODs, plan, RM e historial de este dispositivo. WOD Heroes vuelven al original. Drive no se toca.'
                : 'Se borra wodtobox.pack.json de tu Drive. Este dispositivo no se toca.'}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy != null}
                onClick={() => setPendingPurge('choose')}
                className="rounded-2xl border border-line py-3 font-semibold text-paper disabled:opacity-40"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={busy != null}
                onClick={() => (pendingPurge === 'local' ? purgeLocal() : void purgeDrive())}
                className="rounded-2xl bg-warn py-3 font-semibold text-paper disabled:opacity-40"
              >
                {busy === 'purge' ? 'BORRANDO…' : 'Borrar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
