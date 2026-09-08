import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Dumbbell, FileUp, Medal, Play, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { metaFor } from '../data/kinds'
import { newRunId, persistRunSession } from '../lib/runSession'
import { onIncomingWodShare, takeIncomingWodShare } from '../lib/incomingWod'
import { copyImportedWod, parseWodShareText } from '../lib/shareWod'
import { summarizeTimer } from '../lib/summarize'
import { unlockAudio } from '../lib/audio'
import { listWods, saveWod } from '../lib/wods'
import { wodPreview, type Wod } from '../types/wod'

export function WodsList() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [wods, setWods] = useState(() => listWods())
  const [pendingImport, setPendingImport] = useState<Wod | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const empty = wods.length === 0

  useEffect(() => {
    const applyIncoming = () => {
      const incoming = takeIncomingWodShare()
      if (!incoming) return
      if (incoming.error) setError(incoming.error)
      if (incoming.wod) {
        setError(null)
        setPendingImport(incoming.wod)
      }
    }
    applyIncoming()
    return onIncomingWodShare(applyIncoming)
  }, [])

  const pickImportFile = () => {
    setError(null)
    fileRef.current?.click()
  }

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const parsed = parseWodShareText(await file.text())
      if (!parsed) {
        setError('Ese archivo no es un WOD de WODtoBox.')
        return
      }
      setError(null)
      setPendingImport(parsed.wod)
    } catch {
      setError('No se pudo leer el fichero.')
    } finally {
      setBusy(false)
    }
  }

  const applyImport = () => {
    if (!pendingImport) return
    saveWod(copyImportedWod(pendingImport))
    setWods(listWods())
    setPendingImport(null)
  }

  return (
    <Screen>
      <TopBar
        title="WODS"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={pickImportFile}
              className="flex h-11 items-center gap-1 rounded-full border border-line bg-panel px-2.5 text-paper disabled:opacity-40"
            >
              <FileUp className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold leading-none">importar</span>
            </button>
            <Link
              to="/wods/new"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-flame text-ink"
              aria-label="Nuevo WOD"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        }
      />
      <p className="mb-5 text-sm text-mute">
        Graba el WOD: nombre, formato y movimientos. Luego lánzalo al timer. Abajo, WOD Heroes.
        Puedes importar un fichero .wodtobox que te hayan enviado.
      </p>
      {error ? <p className="mb-4 text-sm text-warn">{error}</p> : null}

      <input
        ref={fileRef}
        type="file"
        accept=".wodtobox,application/json,.json"
        className="hidden"
        onChange={(event) => void onImportFile(event)}
      />

      {empty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-flame">
            <Dumbbell className="h-7 w-7" />
          </span>
          <h2 className="mt-6 font-display text-5xl text-paper">SIN WODS</h2>
          <p className="mt-3 max-w-sm text-mute">
            Crea el del día, importa un .wodtobox o abre WOD Heroes (Fran, Cindy, Murph…).
          </p>
          <Link
            to="/wods/new"
            className="mt-6 rounded-2xl bg-flame px-6 py-3 font-display text-3xl text-ink"
          >
            NUEVO WOD
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={pickImportFile}
            className="mt-3 rounded-2xl border border-line px-6 py-3 font-semibold text-paper disabled:opacity-40"
          >
            Importar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {wods.map((wod) => (
            <div key={wod.id} className="rounded-3xl border border-line bg-panel p-4">
              <Link to={`/wods/${wod.id}`} className="block">
                <p className="text-xs font-semibold tracking-[0.22em] text-flame">
                  {metaFor(wod.kind).title}
                </p>
                <h2 className="mt-1 font-display text-4xl leading-none text-paper">
                  {wod.name.trim() || 'Sin nombre'}
                </h2>
                <p className="mt-2 text-sm text-mute">{wodPreview(wod)}</p>
                <p className="mt-1 text-xs text-mute">{summarizeTimer(wod.timer)}</p>
              </Link>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio()
                    persistRunSession({ config: wod.timer, wod, runId: newRunId() })
                    navigate(`/timers/${wod.kind}/run`, { state: { config: wod.timer, wod } })
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-flame py-2.5 text-sm font-semibold text-ink"
                >
                  <Play className="h-4 w-4" />
                  Al timer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/wods/heroes" className={empty ? 'mt-6' : 'mt-auto pt-6'}>
        <div className="rounded-3xl border border-flame/40 bg-panel p-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-flame">MENÚ</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-4xl leading-none text-paper">WOD HEROES</h2>
              <p className="mt-1 text-sm text-mute">Fran · Cindy · Murph · DT…</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-flame text-ink">
              <Medal className="h-5 w-5" />
            </span>
          </div>
        </div>
      </Link>

      {pendingImport ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Añadir {pendingImport.name.trim() || 'este WOD'}?
            </p>
            <p className="mt-2 text-sm text-mute">
              Se crea una copia en este dispositivo. No sustituye los WODs que ya tienes ni las
              plantillas Heroes.
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
                Añadir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
