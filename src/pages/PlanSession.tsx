import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Pause } from 'lucide-react'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { useRestTimer } from '../hooks/useRestTimer'
import { formatClock, formatCompact } from '../lib/format'
import { getProgram } from '../lib/programs'
import { saveSession, startSession } from '../lib/sessions'
import { bindWakeLockOnVisible, releaseWakeLock, requestWakeLock } from '../lib/wakeLock'
import { findDay, formatScheme, type ProgramDay, type ProgramSet, type SessionLog, type SetLog } from '../types/program'

const REST_PRESETS = [120, 150, 180]

export function PlanSession() {
  const { programId, dayId } = useParams()
  const location = useLocation()
  const program = programId ? getProgram(programId) : null
  const found = program && dayId ? findDay(program, dayId) : null
  if (!program || !found) return <Navigate to="/plan" replace />
  const fromProgram = (location.state as { from?: string } | null)?.from === 'program'
  return (
    <LiveSession
      day={found.day}
      programId={program.id}
      weekId={found.week.id}
      backTo={fromProgram ? `/plan/${program.id}` : `/plan/${program.id}/day/${found.day.id}`}
    />
  )
}

function LiveSession({
  day,
  programId,
  weekId,
  backTo,
}: {
  day: ProgramDay
  programId: string
  weekId: string
  backTo: string
}) {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => startSession(programId, weekId, day.id))
  const rest = useRestTimer(session.restSeconds)

  useEffect(() => {
    void requestWakeLock()
    const unbind = bindWakeLockOnVisible()
    return () => {
      unbind()
      void releaseWakeLock()
    }
  }, [])

  const persist = (next: SessionLog) => {
    const saved = saveSession(next)
    setSession(saved)
    return saved
  }

  const logFor = (set: ProgramSet): SetLog =>
    session.logs.find((item) => item.setId === set.id) ?? { setId: set.id, actualReps: set.reps, done: false }

  const patchLog = (set: ProgramSet, patch: Partial<SetLog>) => {
    const current = logFor(set)
    const nextLog = { ...current, ...patch }
    persist({ ...session, logs: [...session.logs.filter((item) => item.setId !== set.id), nextLog] })
  }

  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const doneSets = session.logs.filter((item) => item.done).length
  const remainingColor = rest.remainingMs <= 3000 && rest.running ? 'text-warn' : 'text-rest'

  return (
    <Screen>
      <TopBar title={day.name} backTo={backTo} />
      <p className="mb-4 text-sm text-mute">{day.focus}</p>

      {rest.running ? (
        <div className="mb-4 rounded-3xl border border-rest/40 bg-panel p-4 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-rest">PAUSA</p>
          <p className={`font-timer text-6xl font-bold leading-none ${remainingColor}`}>
            {formatClock(rest.remainingMs, true)}
          </p>
          <button type="button" onClick={rest.stop} className="mt-3 text-sm font-semibold text-mute">
            Saltar pausa
          </button>
        </div>
      ) : (
        <div className="mb-4 rounded-3xl border border-line bg-panel p-4">
          <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-mute">TIEMPO DE PAUSA</p>
          <div className="flex flex-wrap gap-2">
            {REST_PRESETS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => {
                  rest.setDuration(seconds)
                  persist({ ...session, restSeconds: seconds })
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  rest.duration === seconds ? 'bg-rest text-ink' : 'bg-panel-2 text-paper'
                }`}
              >
                {formatCompact(seconds)}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mb-3 text-sm text-mute">
        {doneSets}/{totalSets} series · ajusta reps y marca la serie
      </p>

      <div className="flex flex-col gap-4 pb-52">
        {day.exercises.map((exercise) => (
          <article key={exercise.id} className="rounded-3xl border border-line bg-panel p-4">
            <h2 className="font-display text-3xl leading-none text-paper">{exercise.name || 'Ejercicio'}</h2>
            {exercise.cue ? <p className="mt-1 text-sm text-mute">{exercise.cue}</p> : null}
            <p className="mt-1 text-xs text-mute">{formatScheme(exercise.sets)}</p>
            <div className="mt-3 flex flex-col gap-2">
              {exercise.sets.map((set, index) => {
                const log = logFor(set)
                const load = /kg|pesad|libre/i.test(set.weightText)
                  ? set.weightText
                  : set.weightText
                    ? `${set.weightText} kg`
                    : '—'
                return (
                  <div
                    key={set.id}
                    className={`flex items-center gap-2 rounded-2xl px-2 py-2 ${log.done ? 'bg-panel-2' : 'bg-ink'}`}
                  >
                    <span className="w-6 text-center text-xs text-mute">{index + 1}</span>
                    <span className="w-16 shrink-0 text-xs text-mute">{load}</span>
                    <button
                      type="button"
                      onClick={() => patchLog(set, { actualReps: Math.max(0, log.actualReps - 1), done: false })}
                      className="h-9 w-9 rounded-full bg-panel-2 text-lg text-paper"
                    >
                      −
                    </button>
                    <p className="min-w-8 text-center font-timer text-2xl font-bold text-paper">{log.actualReps}</p>
                    <button
                      type="button"
                      onClick={() => patchLog(set, { actualReps: log.actualReps + 1, done: false })}
                      className="h-9 w-9 rounded-full bg-panel-2 text-lg text-paper"
                    >
                      +
                    </button>
                    <span className="text-xs text-mute">/{set.reps}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const markingDone = !log.done
                        patchLog(set, { done: markingDone, actualReps: log.actualReps || set.reps })
                        if (markingDone && doneSets + 1 < totalSets) rest.start()
                      }}
                      className={`ml-auto h-9 w-9 rounded-full text-sm font-bold ${
                        log.done ? 'bg-work text-ink' : 'bg-panel-2 text-mute'
                      }`}
                      aria-label={log.done ? 'Hecha' : 'Marcar hecha'}
                    >
                      {log.done ? '✓' : ''}
                    </button>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-lg bg-gradient-to-t from-ink via-ink to-transparent px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {rest.running ? (
          <button
            type="button"
            onClick={rest.stop}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-rest py-4 font-display text-3xl text-ink"
          >
            {formatClock(rest.remainingMs, true)}
            <span className="font-sans text-sm font-semibold tracking-normal">Saltar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={rest.start}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-rest py-4 font-display text-3xl text-ink"
          >
            <Pause className="h-5 w-5" />
            PAUSA
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            persist({
              ...session,
              completedAt: doneSets >= totalSets && totalSets > 0 ? Date.now() : session.completedAt,
            })
            navigate(backTo)
          }}
          className="w-full rounded-2xl border border-line bg-panel py-3 font-semibold text-paper"
        >
          {doneSets >= totalSets && totalSets > 0 ? 'Terminar día' : 'Guardar y salir'}
        </button>
      </div>
    </Screen>
  )
}
