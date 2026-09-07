import { useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { metaFor } from '../data/kinds'
import { unlockAudio } from '../lib/audio'
import { newRunId, persistRunSession } from '../lib/runSession'
import { summarizeTimer } from '../lib/summarize'
import { listHeroWods, restoreHeroWod } from '../lib/wods'
import { wodPreview, type Wod } from '../types/wod'

export function WodHeroes() {
  const navigate = useNavigate()
  const [wods, setWods] = useState(() => listHeroWods())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pending = wods.find((wod) => wod.id === pendingId) ?? null

  return (
    <Screen>
      <TopBar title="WOD HEROES" backTo="/wods" />
      <p className="mb-5 text-sm text-mute">
        WODs clásicos, con pesos en kg. Ábrelos, lánzalos al timer o restaura la plantilla.
      </p>

      <div className="flex flex-col gap-3 pb-4">
        {wods.map((wod) => (
          <HeroCard
            key={wod.id}
            wod={wod}
            onLaunch={() => {
              unlockAudio()
              persistRunSession({ config: wod.timer, wod, runId: newRunId() })
              navigate(`/timers/${wod.kind}/run`, { state: { config: wod.timer, wod } })
            }}
            onRestore={() => setPendingId(wod.id)}
          />
        ))}
      </div>

      {pending ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Restaurar {pending.name}?</p>
            <p className="mt-2 text-sm text-mute">Vuelve a la plantilla original, con los kilos de Rx.</p>
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
                  restoreHeroWod(pending.id)
                  setWods(listHeroWods())
                  setPendingId(null)
                }}
                className="rounded-2xl bg-flame py-3 font-semibold text-ink"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}

function HeroCard({
  wod,
  onLaunch,
  onRestore,
}: {
  wod: Wod
  onLaunch: () => void
  onRestore: () => void
}) {
  return (
    <article className="rounded-3xl border border-line bg-panel p-4">
      <Link to={`/wods/${wod.id}`} className="block">
        <p className="text-xs font-semibold tracking-[0.22em] text-flame">
          {metaFor(wod.kind).title}
        </p>
        <h2 className="mt-1 font-display text-4xl leading-none text-paper">{wod.name}</h2>
        <p className="mt-2 text-sm text-mute">{wodPreview(wod, 4)}</p>
        <p className="mt-1 text-xs text-mute">{summarizeTimer(wod.timer)}</p>
      </Link>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onLaunch}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-flame py-2.5 text-sm font-semibold text-ink"
        >
          <Play className="h-4 w-4" />
          Al timer
        </button>
        <button
          type="button"
          onClick={onRestore}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-panel-2 text-mute"
          aria-label={`Restaurar ${wod.name}`}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
