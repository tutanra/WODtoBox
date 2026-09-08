import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { getProgram, saveProgram } from '../lib/programs'
import { deleteSessionForDay } from '../lib/sessions'
import {
  emptyExercise,
  emptySet,
  findDay,
  formatScheme,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from '../types/program'

export function PlanDayPage() {
  const { programId, dayId } = useParams()
  const program = programId ? getProgram(programId) : null
  const found = program && dayId ? findDay(program, dayId) : null
  if (!program || !found) return <Navigate to="/plan" replace />
  return <DayEditor program={program} weekId={found.week.id} day={found.day} />
}

function DayEditor({
  program,
  weekId,
  day,
}: {
  program: Program
  weekId: string
  day: ProgramDay
}) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(day)
  const [pendingDelete, setPendingDelete] = useState(false)
  const current = getProgram(program.id) ?? program
  const week = current.weeks.find((item) => item.id === weekId)
  const canDeleteDay = (week?.days.length ?? 1) > 1

  const persist = (next: ProgramDay) => {
    const updated: Program = {
      ...program,
      weeks: program.weeks.map((week) =>
        week.id === weekId
          ? { ...week, days: week.days.map((item) => (item.id === next.id ? next : item)) }
          : week,
      ),
    }
    saveProgram(updated)
    setDraft(next)
  }

  const updateExercise = (exercise: ProgramExercise) => {
    persist({
      ...draft,
      exercises: draft.exercises.map((item) => (item.id === exercise.id ? exercise : item)),
    })
  }

  const removeExercise = (id: string) => {
    persist({
      ...draft,
      exercises: draft.exercises.length > 1 ? draft.exercises.filter((item) => item.id !== id) : draft.exercises,
    })
  }

  return (
    <Screen>
      <TopBar title={draft.name || 'DÍA'} backTo={`/plan/${program.id}`} />

      <input
        value={draft.name}
        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        onBlur={() => persist(draft)}
        placeholder="Nombre del día"
        className="mb-2 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none focus:border-flame"
      />
      <input
        value={draft.focus}
        onChange={(event) => setDraft((current) => ({ ...current, focus: event.target.value }))}
        onBlur={() => persist(draft)}
        placeholder="Foco (tirón, test, squat…)"
        className="mb-5 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
      />

      <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-mute uppercase">Ejercicios</p>
      <p className="mb-3 text-sm text-mute">
        Cambia nombre, kilos y reps. Añade series si el día lo pide.
      </p>

      <div className="flex flex-col gap-3 pb-4">
        {draft.exercises.map((exercise) => (
          <article key={exercise.id} className="rounded-3xl border border-line bg-panel p-4">
            <input
              value={exercise.name}
              onChange={(event) => updateExercise({ ...exercise, name: event.target.value })}
              placeholder="Ejercicio"
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 font-semibold text-paper outline-none placeholder:text-mute focus:border-flame"
            />
            <input
              value={exercise.cue}
              onChange={(event) => updateExercise({ ...exercise, cue: event.target.value })}
              placeholder="Nota (pausa, ondas, %…)"
              className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
            />
            <p className="mt-2 text-xs text-mute">{formatScheme(exercise.sets)}</p>
            <div className="mt-3 flex flex-col gap-2">
              {exercise.sets.map((set, index) => (
                <div key={set.id} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs text-mute">{index + 1}</span>
                  <input
                    inputMode="numeric"
                    value={set.reps}
                    onChange={(event) => {
                      const reps = Math.max(1, Number(event.target.value) || 1)
                      updateExercise({
                        ...exercise,
                        sets: exercise.sets.map((item) => (item.id === set.id ? { ...item, reps } : item)),
                      })
                    }}
                    className="w-14 rounded-xl border border-line bg-ink px-2 py-2 text-center text-paper outline-none focus:border-flame"
                    aria-label="Repeticiones"
                  />
                  <span className="text-xs text-mute">reps</span>
                  <input
                    value={set.weightText}
                    onChange={(event) => {
                      const weightText = event.target.value
                      const parsed = Number(weightText.replace(',', '.'))
                      updateExercise({
                        ...exercise,
                        sets: exercise.sets.map((item) =>
                          item.id === set.id
                            ? { ...item, weightText, weightKg: Number.isFinite(parsed) ? parsed : null }
                            : item,
                        ),
                      })
                    }}
                    placeholder="kg"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-2 py-2 text-center text-paper outline-none placeholder:text-mute focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateExercise({
                        ...exercise,
                        sets: exercise.sets.length > 1 ? exercise.sets.filter((item) => item.id !== set.id) : exercise.sets,
                      })
                    }
                    className="text-xs text-mute"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const last = exercise.sets[exercise.sets.length - 1]
                  updateExercise({
                    ...exercise,
                    sets: [...exercise.sets, last ? { ...emptySet(), reps: last.reps, weightKg: last.weightKg, weightText: last.weightText } : emptySet()],
                  })
                }}
                className="flex-1 rounded-xl border border-dashed border-line py-2 text-xs font-semibold text-paper"
              >
                + Serie
              </button>
              <button
                type="button"
                onClick={() => removeExercise(exercise.id)}
                className="rounded-xl border border-line px-3 py-2 text-xs text-mute"
              >
                Quitar ejercicio
              </button>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => persist({ ...draft, exercises: [...draft.exercises, emptyExercise()] })}
        className="mb-3 w-full rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-paper"
      >
        + Ejercicio
      </button>

      <button
        type="button"
        disabled={!canDeleteDay}
        onClick={() => setPendingDelete(true)}
        className="mb-3 w-full rounded-2xl border border-line py-3 text-sm font-semibold text-mute disabled:opacity-30"
      >
        Borrar día
      </button>

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Borrar {draft.name.trim() || 'este día'}?
            </p>
            <p className="mt-2 text-sm text-mute">
              Se quita de la semana. El historial de series hechas se queda.
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
                  const latest = getProgram(program.id) ?? program
                  const latestWeek = latest.weeks.find((item) => item.id === weekId)
                  if (!latestWeek || latestWeek.days.length <= 1) {
                    setPendingDelete(false)
                    return
                  }
                  deleteSessionForDay(latest.id, draft.id)
                  saveProgram({
                    ...latest,
                    weeks: latest.weeks.map((item) =>
                      item.id === weekId
                        ? { ...item, days: item.days.filter((entry) => entry.id !== draft.id) }
                        : item,
                    ),
                  })
                  navigate(`/plan/${program.id}`)
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
