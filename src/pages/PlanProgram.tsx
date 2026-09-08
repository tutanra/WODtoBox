import { useEffect, useRef, useState } from 'react'
import { Copy, Play, Plus, Share2, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { unlockAudio } from '../lib/audio'
import { resetPlanProgress } from '../lib/history'
import { deleteProgram, getProgram, saveProgram } from '../lib/programs'
import { getSession, sessionProgress, startSession } from '../lib/sessions'
import { exportPlanFile } from '../lib/sharePlan'
import {
  cloneWeek,
  emptyDay,
  emptyTarget,
  emptyWeek,
  MAX_DAYS_PER_WEEK,
  nextDayName,
  renumberWeeks,
  type Program,
  type ProgramTarget,
  type ProgramWeek,
} from '../types/program'

export function PlanProgram() {
  const { programId } = useParams()
  const stored = programId ? getProgram(programId) : null
  if (!stored) return <Navigate to="/plan" replace />
  return <ProgramView key={stored.id} initial={stored} />
}

function ProgramView({ initial }: { initial: Program }) {
  const navigate = useNavigate()
  const [program, setProgram] = useState(initial)
  const programRef = useRef(program)
  programRef.current = program
  const [pendingWeekId, setPendingWeekId] = useState<string | null>(null)
  const [pendingReset, setPendingReset] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const removedRef = useRef(false)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const canShare = program.name.trim().length > 0

  const persist = (next: Program) => {
    const saved = saveProgram(next)
    programRef.current = saved
    setProgram(saved)
    return saved
  }

  const commit = (recipe?: (current: Program) => Program) => {
    const current = recipe ? recipe(programRef.current) : programRef.current
    return persist(current)
  }

  useEffect(() => {
    return () => {
      if (!removedRef.current) saveProgram(programRef.current)
    }
  }, [])

  const pendingWeek = program.weeks.find((week) => week.id === pendingWeekId) ?? null

  const copyWeek = (week: ProgramWeek) => {
    const index = program.weeks.findIndex((item) => item.id === week.id)
    if (index < 0) return
    const cloned = cloneWeek(week, week.number + 1)
    const weeks = renumberWeeks([
      ...program.weeks.slice(0, index + 1),
      cloned,
      ...program.weeks.slice(index + 1),
    ])
    persist({ ...program, weeks })
  }

  const deleteWeek = (weekId: string) => {
    if (program.weeks.length <= 1) return
    persist({
      ...program,
      weeks: renumberWeeks(program.weeks.filter((week) => week.id !== weekId)),
    })
    setPendingWeekId(null)
  }

  const addDay = (weekId: string) => {
    persist({
      ...program,
      weeks: program.weeks.map((week) => {
        if (week.id !== weekId || week.days.length >= MAX_DAYS_PER_WEEK) return week
        return { ...week, days: [...week.days, emptyDay(nextDayName(week.days))] }
      }),
    })
  }

  const patchTarget = (index: number, patch: Partial<ProgramTarget>) => {
    const next = {
      ...programRef.current,
      targets: programRef.current.targets.map((target, itemIndex) =>
        itemIndex === index ? { ...target, ...patch } : target,
      ),
    }
    programRef.current = next
    setProgram(next)
  }

  const patchWeek = (weekId: string, patch: Partial<ProgramWeek>) => {
    const next = {
      ...programRef.current,
      weeks: programRef.current.weeks.map((week) => (week.id === weekId ? { ...week, ...patch } : week)),
    }
    programRef.current = next
    setProgram(next)
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-paper outline-none placeholder:text-mute focus:border-flame'

  return (
    <Screen>
      <TopBar
        title="PLAN"
        backTo="/plan"
        action={
          <button
            type="button"
            disabled={!canShare || sharing}
            onClick={() => {
              const stored = commit()
              setShareError(null)
              setSharing(true)
              void exportPlanFile(stored)
                .catch((err) => {
                  setShareError(err instanceof Error ? err.message : 'No se pudo compartir el plan.')
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

      <input
        value={program.name}
        onChange={(event) => {
          const next = { ...programRef.current, name: event.target.value }
          programRef.current = next
          setProgram(next)
        }}
        onBlur={() => commit()}
        placeholder="Nombre del programa"
        className="mb-2 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none placeholder:text-mute focus:border-flame"
      />
      <input
        value={program.subtitle}
        onChange={(event) => {
          const next = { ...programRef.current, subtitle: event.target.value }
          programRef.current = next
          setProgram(next)
        }}
        onBlur={() => commit()}
        placeholder="Subtítulo"
        className="mb-4 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
      />

      <div className="mb-5 rounded-2xl border border-line bg-panel p-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-flame">OBJETIVOS</p>
        {program.targets.length === 0 ? (
          <p className="mt-2 text-sm text-mute">
            Movimiento, inicio, meta y ratio, como en las plantillas.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {program.targets.map((target, index) => (
              <div key={index} className="rounded-2xl bg-ink p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={target.movement}
                    onChange={(event) => patchTarget(index, { movement: event.target.value })}
                    onBlur={() => commit()}
                    placeholder="Movimiento"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-3 py-2 text-sm font-semibold text-paper outline-none placeholder:text-mute focus:border-flame"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      commit((current) => ({
                        ...current,
                        targets: current.targets.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel-2 text-mute"
                    aria-label={`Borrar objetivo ${target.movement || index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    value={target.start}
                    onChange={(event) => patchTarget(index, { start: event.target.value })}
                    onBlur={() => commit()}
                    placeholder="Inicio"
                    className={inputClass}
                  />
                  <input
                    value={target.goal}
                    onChange={(event) => patchTarget(index, { goal: event.target.value })}
                    onBlur={() => commit()}
                    placeholder="Meta"
                    className={`${inputClass} text-flame`}
                  />
                  <input
                    value={target.ratio}
                    onChange={(event) => patchTarget(index, { ratio: event.target.value })}
                    onBlur={() => commit()}
                    placeholder="Ratio"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            commit((current) => ({ ...current, targets: [...current.targets, emptyTarget()] }))
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-2.5 text-sm font-semibold text-paper"
        >
          <Plus className="h-4 w-4" />
          Objetivo
        </button>
      </div>

      <textarea
        value={program.notes}
        onChange={(event) => {
          const next = { ...programRef.current, notes: event.target.value }
          programRef.current = next
          setProgram(next)
        }}
        onBlur={() => commit()}
        placeholder="Notas, claves técnicas, recuperación…"
        rows={4}
        className="mb-5 w-full resize-y rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
      />

      <div className="flex flex-col gap-3 pb-6">
        {program.weeks.map((week) => (
          <div key={week.id} className="rounded-3xl border border-line bg-panel p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <input
                  value={week.phase}
                  onChange={(event) => patchWeek(week.id, { phase: event.target.value })}
                  onBlur={() => commit()}
                  placeholder={`Semana ${week.number}`}
                  className="w-full bg-transparent text-xs font-semibold tracking-[0.2em] text-flame outline-none placeholder:text-flame/50"
                />
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="shrink-0 font-display text-4xl leading-none text-paper">S{week.number} ·</span>
                  <input
                    value={week.title}
                    onChange={(event) => patchWeek(week.id, { title: event.target.value })}
                    onBlur={() => commit()}
                    placeholder={`Semana ${week.number}`}
                    className="min-w-0 flex-1 bg-transparent font-display text-4xl leading-none text-paper outline-none placeholder:text-mute"
                  />
                </div>
                <input
                  value={week.goal}
                  onChange={(event) => patchWeek(week.id, { goal: event.target.value })}
                  onBlur={() => commit()}
                  placeholder="Objetivo de la semana"
                  className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {week.days.map((day) => {
                const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
                const progress = sessionProgress(getSession(program.id, day.id), totalSets)
                return (
                  <div key={day.id} className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/plan/${program.id}/day/${day.id}`)}
                      className="min-w-0 flex-1 rounded-2xl border border-line bg-ink px-4 py-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-paper">{day.name}</p>
                        {progress > 0 ? (
                          <span className="text-xs text-work">{Math.round(progress * 100)}%</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-mute">{day.focus || `${day.exercises.length} ejercicios`}</p>
                      {progress > 0 ? (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-panel-2">
                          <div className="h-full bg-work" style={{ width: `${progress * 100}%` }} />
                        </div>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        persist(programRef.current)
                        unlockAudio()
                        startSession(program.id, week.id, day.id)
                        navigate(`/plan/${program.id}/day/${day.id}/train`, { state: { from: 'program' } })
                      }}
                      className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-flame text-ink"
                      aria-label={`Entrenar ${day.name}`}
                    >
                      <Play className="h-5 w-5" fill="currentColor" />
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              disabled={week.days.length >= MAX_DAYS_PER_WEEK}
              onClick={() => addDay(week.id)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-2.5 text-sm font-semibold text-paper disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
              Día
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyWeek(week)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-ink py-2.5 text-sm font-semibold text-paper"
              >
                <Copy className="h-4 w-4" />
                Copiar a la siguiente
              </button>
              <button
                type="button"
                disabled={program.weeks.length <= 1}
                onClick={() => setPendingWeekId(week.id)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-ink py-2.5 text-sm font-semibold text-mute disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => persist({ ...program, weeks: [...program.weeks, emptyWeek(program.weeks.length + 1)] })}
        className="mb-3 w-full rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-paper"
      >
        + Semana
      </button>

      <button
        type="button"
        onClick={() => setPendingReset(true)}
        className="mb-3 w-full rounded-2xl border border-line bg-panel py-3 text-sm font-semibold text-mute"
      >
        Reiniciar plan
      </button>

      <button
        type="button"
        onClick={() => setPendingDelete(true)}
        className="mb-3 w-full rounded-2xl border border-warn/40 bg-panel py-3 text-sm font-semibold text-warn"
      >
        Borrar plan
      </button>

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Borrar {program.name.trim() || 'este plan'}?
            </p>
            <p className="mt-2 text-sm text-mute">
              Se elimina el programa y el progreso de las sesiones. El historial se queda.
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
                  resetPlanProgress(program.id)
                  deleteProgram(program.id)
                  navigate('/plan', { replace: true })
                }}
                className="rounded-2xl bg-warn py-3 font-semibold text-paper"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingReset ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Reiniciar este plan?</p>
            <p className="mt-2 text-sm text-mute">
              Se borra el progreso de las sesiones para empezar el plan de nuevo. El historial se
              queda.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingReset(false)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPlanProgress(program.id)
                  setProgram((current) => ({ ...current }))
                  setPendingReset(false)
                }}
                className="rounded-2xl bg-warn py-3 font-semibold text-paper"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingWeek ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Borrar S{pendingWeek.number} · {pendingWeek.title}?
            </p>
            <p className="mt-2 text-sm text-mute">Se elimina la semana y sus días. Las demás se reenumeran.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingWeekId(null)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteWeek(pendingWeek.id)}
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
