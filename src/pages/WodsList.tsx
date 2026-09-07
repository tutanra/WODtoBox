import { useMemo, useState } from 'react'
import { Dumbbell, Medal, Play, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { metaFor } from '../data/kinds'
import { newRunId, persistRunSession } from '../lib/runSession'
import { summarizeTimer } from '../lib/summarize'
import { unlockAudio } from '../lib/audio'
import { deleteWod, listWods } from '../lib/wods'
import { wodPreview } from '../types/wod'

export function WodsList() {
  const navigate = useNavigate()
  const [wods, setWods] = useState(() => listWods())
  const [pendingId, setPendingId] = useState<string | null>(null)

  const empty = wods.length === 0
  const pending = useMemo(() => wods.find((wod) => wod.id === pendingId) ?? null, [pendingId, wods])

  return (
    <Screen>
      <TopBar
        title="WODS"
        action={
          <Link
            to="/wods/new"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-flame text-ink"
            aria-label="Nuevo WOD"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />
      <p className="mb-5 text-sm text-mute">
        Graba el WOD: nombre, formato y movimientos. Luego lánzalo al timer. Abajo, WOD Heroes.
      </p>

      {empty ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-panel/60 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-flame">
            <Dumbbell className="h-7 w-7" />
          </span>
          <h2 className="mt-6 font-display text-5xl text-paper">SIN WODS</h2>
          <p className="mt-3 max-w-sm text-mute">
            Crea el del día o abre WOD Heroes (Fran, Cindy, Murph…).
          </p>
          <Link
            to="/wods/new"
            className="mt-6 rounded-2xl bg-flame px-6 py-3 font-display text-3xl text-ink"
          >
            NUEVO WOD
          </Link>
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
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio()
                    persistRunSession({ config: wod.timer, wod, runId: newRunId() })
                    navigate(`/timers/${wod.kind}/run`, { state: { config: wod.timer, wod } })
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-flame py-2.5 text-sm font-semibold text-ink"
                >
                  <Play className="h-4 w-4" />
                  Al timer
                </button>
                <button
                  type="button"
                  onClick={() => setPendingId(wod.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-panel-2 text-mute"
                  aria-label="Borrar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/wods/heroes"
        className="mt-auto pt-6"
      >
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

      {pending ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Borrar {pending.name.trim() || 'este WOD'}?</p>
            <p className="mt-2 text-sm text-mute">Se elimina de la lista. No afecta a WOD Heroes ni a los timers sueltos.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingId(null)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteWod(pending.id)
                  setWods(listWods())
                  setPendingId(null)
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
