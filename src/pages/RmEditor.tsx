import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Stepper } from '../components/Stepper'
import { TopBar } from '../components/TopBar'
import { fromDateInputValue, toDateInputValue } from '../lib/format'
import { recordRmLift, renameRmHistory } from '../lib/history'
import { getRm, renameExercise, saveRm } from '../lib/rms'
import {
  RM_MAX_REPS,
  formatEstimated1Rm,
  formatRmLine,
  newRmLift,
  parseWeightKg,
  type RmLift,
} from '../types/rm'

export function RmEditor() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const isNew = id === 'new'
  const existing = isNew ? null : id ? getRm(id) : null
  if (!isNew && !existing) return <Navigate to="/rm" replace />

  const seed = existing ?? newRmLift()
  const exercise = isNew ? (params.get('ejercicio') ?? '').trim() : seed.exercise
  const initial: RmLift = exercise ? { ...seed, exercise } : seed

  return <Editor key={`${existing?.id ?? 'new'}-${exercise}`} initial={initial} isNew={isNew} />
}

function Editor({ initial, isNew }: { initial: RmLift; isNew: boolean }) {
  const navigate = useNavigate()
  const [lift, setLift] = useState(initial)
  const canSave = lift.exercise.trim().length > 0 && lift.weightText.trim().length > 0
  const preview = useMemo(() => formatRmLine({ ...lift, weightKg: parseWeightKg(lift.weightText) }), [lift])
  const epley = useMemo(
    () => formatEstimated1Rm({ ...lift, weightKg: parseWeightKg(lift.weightText) }),
    [lift],
  )

  const persist = () => {
    const next: RmLift = {
      ...lift,
      exercise: lift.exercise.trim(),
      weightText: lift.weightText.trim(),
      weightKg: parseWeightKg(lift.weightText),
      liftedAt: lift.liftedAt || Date.now(),
    }
    if (!isNew) {
      renameExercise(initial.exercise, next.exercise)
      renameRmHistory(initial.exercise, next.exercise)
    }
    const saved = saveRm(next)
    recordRmLift(saved)
    return saved
  }

  return (
    <Screen>
      <TopBar title={isNew ? 'NUEVO RM' : 'RM'} onBack={() => navigate('/rm')} />

      <div className="flex flex-col gap-5 pb-6">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold tracking-[0.22em] text-mute uppercase">
            Ejercicio
          </span>
          <input
            value={lift.exercise}
            onChange={(event) => setLift((current) => ({ ...current, exercise: event.target.value }))}
            placeholder="Power Clean, Front Squat…"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none placeholder:text-mute focus:border-flame"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold tracking-[0.22em] text-mute uppercase">
            Día
          </span>
          <input
            type="date"
            value={toDateInputValue(lift.liftedAt)}
            onChange={(event) =>
              setLift((current) => ({
                ...current,
                liftedAt: fromDateInputValue(event.target.value, current.liftedAt),
              }))
            }
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none focus:border-flame [color-scheme:dark]"
          />
        </label>

        <Stepper
          label="Reps"
          value={lift.reps}
          min={1}
          max={RM_MAX_REPS}
          onChange={(reps) => setLift((current) => ({ ...current, reps }))}
        />

        <label className="block">
          <span className="mb-2 block text-xs font-semibold tracking-[0.22em] text-mute uppercase">
            Peso
          </span>
          <input
            value={lift.weightText}
            onChange={(event) => setLift((current) => ({ ...current, weightText: event.target.value }))}
            inputMode="decimal"
            placeholder="100 kg"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none placeholder:text-mute focus:border-flame"
          />
        </label>

        <p className={`text-center text-sm font-semibold ${lift.reps > 1 && epley ? 'text-gold' : 'text-mute'}`}>
          {preview}
        </p>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            persist()
            navigate('/rm')
          }}
          className="w-full rounded-2xl bg-flame py-4 font-display text-3xl tracking-wide text-ink disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </Screen>
  )
}
