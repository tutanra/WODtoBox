import { useEffect, useMemo, useState } from 'react'
import { CloudUpload, LogIn, LogOut } from 'lucide-react'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { formatHistoryDay, formatHistoryTime } from '../lib/format'
import { applyPack, localDataAt } from '../lib/pack'
import {
  googleSignIn,
  googleSignOut,
  currentGoogleSession,
  type GoogleSession,
} from '../lib/googleAuth'
import { loadDriveCopy, uploadDrivePack, type DriveCopy } from '../lib/drive'
import { getGoogleClientId, readSyncMeta, saveGoogleClientId, writeSyncMeta } from '../lib/sync'

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
  const [busy, setBusy] = useState<'login' | 'remote' | 'up' | 'down' | 'out' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clientDraft, setClientDraft] = useState(() => getGoogleClientId())
  const [pendingDown, setPendingDown] = useState(false)
  const [clientId, setClientId] = useState(() => getGoogleClientId())
  const localAt = useMemo(() => localDataAt(), [meta.lastSyncAt, remote])
  const driveAt = remote?.pack.dataAt ?? meta.driveDataAt
  const status = compare(localAt, driveAt)

  const refreshRemote = async (nextSession: GoogleSession) => {
    setBusy('remote')
    try {
      const copy = await loadDriveCopy(nextSession)
      setRemote(copy)
      if (copy) {
        setMeta(writeSyncMeta({ driveFileId: copy.id, driveDataAt: copy.pack.dataAt }))
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer Drive')
    } finally {
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
          email: session.email,
        }),
      )
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
      }),
    )
    setPendingDown(false)
  }

  const statusCopy =
    status === 'none'
      ? 'Todavía no hay copia en Drive.'
      : status === 'local'
        ? 'Este dispositivo tiene cambios más nuevos que Drive.'
        : status === 'drive'
          ? 'Drive tiene una copia más nueva que este dispositivo.'
          : 'Este dispositivo y Drive están al día.'

  return (
    <Screen>
      <TopBar title="DRIVE" />
      <p className="mb-5 text-sm text-mute">
        Copia WODs, plan, RM e historial a un archivo en tu Google Drive. El timer en curso no se
        sube. La cuenta es opcional: sin ella la app sigue igual.
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
        <p className="text-xs text-mute">Drive: {stamp(driveAt)}</p>
      </article>

      {!session ? (
        <article className="mt-3 rounded-3xl border border-line bg-panel p-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-flame">CLIENT ID</p>
          <p className="mt-2 text-sm text-mute">
            Client ID de tipo «Aplicación web» (Google Cloud, API de Drive). En el móvil hace falta también un cliente Android del mismo proyecto, paquete com.wodplanning.app.
          </p>
          <input
            value={clientDraft}
            onChange={(event) => setClientDraft(event.target.value)}
            placeholder="….apps.googleusercontent.com"
            className="mt-3 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
          />
          <button
            type="button"
            onClick={() => setClientId(saveGoogleClientId(clientDraft))}
            className="mt-3 w-full rounded-2xl border border-line py-3 font-semibold text-paper"
          >
            Guardar Client ID
          </button>
        </article>
      ) : null}

      {error ? <p className="mt-3 text-sm text-warn">{error}</p> : null}

      <div className="mt-auto flex flex-col gap-3 pt-6">
        {session ? (
          <>
            <p className="text-center text-sm text-mute">{session.email || session.name}</p>
            <button
              type="button"
              disabled={busy != null}
              onClick={() => void upload()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-flame py-4 font-display text-3xl tracking-wide text-ink disabled:opacity-40"
            >
              <CloudUpload className="h-6 w-6" />
              {busy === 'up' ? 'SUBIENDO…' : 'SYNC'}
            </button>
            {remote ? (
              <button
                type="button"
                disabled={busy != null}
                onClick={() => setPendingDown(true)}
                className="w-full rounded-2xl border border-line bg-panel py-3 font-semibold text-paper disabled:opacity-40"
              >
                Bajar de Drive
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
    </Screen>
  )
}
