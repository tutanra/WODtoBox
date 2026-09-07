import { useMemo, useState } from 'react'
import { Plus, Trash2, Weight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { formatHistoryDay } from '../lib/format'
import { deleteRm, listRms } from '../lib/rms'
import { formatRmLine, groupRmsByExercise, type RmLift } from '../types/rm'

function newRmPath(exercise?: string) {
  if (!exercise?.trim()) return '/rm/new'
  return `/rm/new?ejercicio=${encodeURIComponent(exercise.trim())}`
}

export function RmList() {
  const [lifts, setLifts] = useState(() => listRms())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const groups = useMemo(() => groupRmsByExercise(lifts), [lifts])
  const pending = useMemo(() => lifts.find((lift) => lift.id === pendingId) ?? null, [lifts, pendingId])

  return (
    <Screen>
      <TopBar
        title="RM"
        action={
          <Link
            to="/rm/new"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-flame text-ink"
            aria-label="Nuevo RM"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />
      <p className="mb-5 text-sm text-mute">
        Pesos máximos: ejercicio, reps, kilos y el día. Pulsar un ejercicio añade otra marca de ese
        movimiento.
      </p>

      {lifts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-flame">
            <Weight className="h-7 w-7" />
          </span>
          <h2 className="mt-6 font-display text-5xl text-paper">SIN RM</h2>
          <p className="mt-3 max-w-sm text-mute">
            Anota un máximo: Power Clean 1 @ 100 kg, Front Squat 5 @ 110 kg…
          </p>
          <Link to="/rm/new" className="mt-6 rounded-2xl bg-flame px-6 py-3 font-display text-3xl text-ink">
            NUEVO RM
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5 pb-4">
          {groups.map((group) => (
            <section key={group.best.id} className="rounded-3xl border border-line bg-panel p-4">
              <div className="flex items-start gap-3">
                <Link to={newRmPath(group.name)} className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-[0.22em] text-flame">EJERCICIO</p>
                  <h3 className="mt-1 font-display text-4xl leading-none text-paper">{group.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-gold">{formatRmLine(group.best)}</p>
                  <p className="mt-1 text-xs text-mute">
                    Mejor · {formatHistoryDay(group.best.liftedAt)}
                  </p>
                </Link>
                <Link
                  to={newRmPath(group.name)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-flame text-ink"
                  aria-label={`Añadir RM de ${group.name}`}
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {group.lifts.map((lift) => (
                  <RmRow key={lift.id} lift={lift} onDelete={() => setPendingId(lift.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {pending ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Borrar {pending.exercise.trim() || 'este RM'}?
            </p>
            <p className="mt-2 text-sm text-mute">Se quita de RM y del historial de ese día.</p>
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
                  deleteRm(pending.id)
                  setLifts(listRms())
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

function RmRow({ lift, onDelete }: { lift: RmLift; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-panel-2 px-3 py-3">
      <Link to={`/rm/${lift.id}`} className="min-w-0 flex-1">
        <p className="text-xs text-mute">{formatHistoryDay(lift.liftedAt)}</p>
        <p className="mt-0.5 text-sm font-semibold text-paper">{formatRmLine(lift)}</p>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-mute"
        aria-label="Borrar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
