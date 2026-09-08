import { useEffect, useMemo, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TimerFields } from '../components/TimerFields'
import { TopBar } from '../components/TopBar'
import { WodBlockList } from '../components/WodBlockList'
import { KIND_META, metaFor } from '../data/kinds'
import { exportWodFile } from '../lib/shareWod'
import { summarizeTimer } from '../lib/summarize'
import { deleteWod, getWod, restoreHeroWod, saveWod } from '../lib/wods'
import { newWod, type Wod } from '../types/wod'

function storedWod(wod: Wod): Wod {
  return {
    ...wod,
    name: wod.name.trim(),
    timer: { ...wod.timer, kind: wod.kind },
  }
}

export function WodEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [session] = useState(() => {
    if (isNew) return { wod: newWod(), back: '/wods' as const, startedNew: true }
    const found = id ? getWod(id) : null
    if (!found) return null
    return { wod: found, back: found.seeded ? '/wods/heroes' : '/wods', startedNew: false }
  })

  if (!session) {
    return <Navigate to="/wods" replace />
  }

  return (
    <Editor
      key={session.wod.id}
      initial={session.wod}
      startedNew={session.startedNew}
      onBack={() => navigate(session.back)}
    />
  )
}

function Editor({
  initial,
  startedNew,
  onBack,
}: {
  initial: Wod
  startedNew: boolean
  onBack: () => void
}) {
  const navigate = useNavigate()
  const [wod, setWod] = useState(initial)
  const [inserted, setInserted] = useState(!startedNew)
  const replacedNew = useRef(!startedNew)
  const removedRef = useRef(false)
  const lastSavedJson = useRef(JSON.stringify(storedWod(initial)))
  const summary = useMemo(() => summarizeTimer(wod.timer), [wod.timer])
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const canShare = wod.name.trim().length > 0

  useEffect(() => {
    if (removedRef.current) return
    const next = storedWod(wod)
    const json = JSON.stringify(next)
    if (json === lastSavedJson.current) return
    lastSavedJson.current = json
    const stored = saveWod(next)
    if (!replacedNew.current) {
      replacedNew.current = true
      setInserted(true)
      navigate(`/wods/${stored.id}`, { replace: true })
    }
  }, [navigate, wod])

  return (
    <Screen>
      <TopBar
        title={wod.name.trim() ? wod.name : 'NUEVO WOD'}
        onBack={onBack}
        action={
          <button
            type="button"
            disabled={!canShare || sharing}
            onClick={() => {
              const stored = saveWod(storedWod(wod))
              setShareError(null)
              setSharing(true)
              void exportWodFile(stored)
                .catch((err) => {
                  setShareError(err instanceof Error ? err.message : 'No se pudo compartir el WOD.')
                })
                .finally(() => setSharing(false))
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-paper disabled:opacity-40"
            aria-label="Compartir"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />
      {shareError ? <p className="mb-4 text-center text-sm text-warn">{shareError}</p> : null}

      <div className="flex flex-col gap-5 pb-6">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold tracking-[0.22em] text-mute uppercase">
            Nombre
          </span>
          <input
            value={wod.name}
            onChange={(event) => setWod((current) => ({ ...current, name: event.target.value }))}
            placeholder="Cindy, Fran, Open 24.1…"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none placeholder:text-mute focus:border-flame"
          />
        </label>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-mute uppercase">Tipo</p>
          <div className="flex flex-wrap gap-2">
            {KIND_META.map((item) => (
              <button
                key={item.kind}
                type="button"
                onClick={() =>
                  setWod((current) => ({
                    ...current,
                    kind: item.kind,
                    timer: { ...current.timer, kind: item.kind },
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  wod.kind === item.kind ? 'bg-flame text-ink' : 'bg-panel-2 text-paper'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-mute">{metaFor(wod.kind).hint}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-mute uppercase">Timer</p>
          <TimerFields
            config={wod.timer}
            onChange={(timer) => setWod((current) => ({ ...current, timer: { ...timer, kind: current.kind } }))}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-mute uppercase">Contenido</p>
          <p className="mb-3 text-sm text-mute">
            Ejercicio y peso aparte. El descanso va en su propia línea, con tiempo. Si varios
            movimientos se repiten juntos, agrúpalos en rondas.
          </p>
          <WodBlockList
            blocks={wod.blocks}
            onChange={(blocks) => setWod((current) => ({ ...current, blocks }))}
          />
        </div>

        <p className="text-center text-sm text-mute">{summary}</p>

        {initial.seeded ? (
          <button
            type="button"
            onClick={() => {
              const restored = restoreHeroWod(initial.id)
              if (!restored) return
              setWod(restored)
            }}
            className="w-full rounded-2xl border border-line py-3 text-sm font-semibold text-mute"
          >
            Restaurar plantilla
          </button>
        ) : inserted ? (
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            className="w-full rounded-2xl border border-warn/40 bg-panel py-3 text-sm font-semibold text-warn"
          >
            Borrar WOD
          </button>
        ) : null}
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Borrar {wod.name.trim() || 'este WOD'}?
            </p>
            <p className="mt-2 text-sm text-mute">
              Se elimina de la lista. No afecta a WOD Heroes ni a los timers sueltos.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(false)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  removedRef.current = true
                  deleteWod(wod.id)
                  onBack()
                }}
                className="rounded-2xl bg-warn py-3 font-semibold text-paper"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
