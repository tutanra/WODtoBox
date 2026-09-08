import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import { Screen } from '../components/Screen'
import { TimerFields } from '../components/TimerFields'
import { TopBar } from '../components/TopBar'
import { WodBlockList } from '../components/WodBlockList'
import { KIND_META, metaFor } from '../data/kinds'
import { unlockAudio } from '../lib/audio'
import { newRunId, persistRunSession } from '../lib/runSession'
import { exportWodFile } from '../lib/shareWod'
import { summarizeTimer } from '../lib/summarize'
import { getWod, restoreHeroWod, saveWod } from '../lib/wods'
import { newWod, type Wod } from '../types/wod'

export function WodEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const existing = isNew ? null : id ? getWod(id) : null

  if (!isNew && !existing) {
    return <Navigate to="/wods" replace />
  }

  return (
    <Editor
      key={existing?.id ?? 'new'}
      initial={existing ?? newWod()}
      onBack={() => navigate(existing?.seeded ? '/wods/heroes' : '/wods')}
    />
  )
}

function Editor({ initial, onBack }: { initial: Wod; onBack: () => void }) {
  const navigate = useNavigate()
  const [wod, setWod] = useState(initial)
  const [savedHint, setSavedHint] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const canSave = wod.name.trim().length > 0
  const summary = useMemo(() => summarizeTimer(wod.timer), [wod.timer])

  const persist = () => {
    const next: Wod = {
      ...wod,
      name: wod.name.trim(),
      timer: { ...wod.timer, kind: wod.kind },
    }
    return saveWod(next)
  }

  const launch = () => {
    const stored = persist()
    unlockAudio()
    persistRunSession({ config: stored.timer, wod: stored, runId: newRunId() })
    navigate(`/timers/${stored.kind}/run`, { state: { config: stored.timer, wod: stored } })
  }

  return (
    <Screen>
      <TopBar title={initial.name.trim() ? initial.name : 'NUEVO WOD'} onBack={onBack} />

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
        {savedHint ? <p className="text-center text-sm text-work">WOD guardado</p> : null}
        {shareError ? <p className="text-center text-sm text-warn">{shareError}</p> : null}

        <button
          type="button"
          disabled={!canSave}
          onClick={launch}
          className="w-full rounded-2xl bg-flame py-4 font-display text-3xl tracking-wide text-ink disabled:opacity-40"
        >
          ADAPTAR AL TIMER
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canSave || sharing}
            onClick={() => {
              const stored = persist()
              setWod(stored)
              setSavedHint(true)
              window.setTimeout(() => setSavedHint(false), 1600)
            }}
            className="flex-1 rounded-2xl border border-line bg-panel py-3 font-semibold text-paper disabled:opacity-40"
          >
            Guardar
          </button>
          <button
            type="button"
            disabled={!canSave || sharing}
            onClick={() => {
              const stored = persist()
              setWod(stored)
              setShareError(null)
              setSharing(true)
              void exportWodFile(stored)
                .catch((err) => {
                  setShareError(err instanceof Error ? err.message : 'No se pudo compartir el WOD.')
                })
                .finally(() => setSharing(false))
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-paper disabled:opacity-40"
            aria-label="Compartir"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
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
        ) : null}
      </div>
    </Screen>
  )
}
