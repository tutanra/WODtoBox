import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Stepper } from '../components/Stepper'
import { TopBar } from '../components/TopBar'
import { useRestTimer } from '../hooks/useRestTimer'
import { clamp, formatClock, formatCompact, minutesOf, secondsOf, toTotalSeconds } from '../lib/format'
import { recordPlanSession } from '../lib/history'
import { getProgram } from '../lib/programs'
import { saveSession, startSession } from '../lib/sessions'
import { bindWakeLockOnVisible, releaseWakeLock, requestWakeLock } from '../lib/wakeLock'
import {
  findDay,
  formatScheme,
  type Program,
  type ProgramDay,
  type ProgramSet,
  type ProgramWeek,
  type SessionLog,
  type SetLog,
} from '../types/program'

const REST_PRESETS = [120, 150, 180]
const REST_MIN = 5
const REST_MAX = 600

function RestChipRow({
  duration,
  onPreset,
  onCustom,
}: {
  duration: number
  onPreset: (seconds: number) => void
  onCustom: () => void
}) {
  const isCustom = !REST_PRESETS.includes(duration)
  return (
    <div className="flex flex-wrap items-center gap-2">
      {REST_PRESETS.map((seconds) => (
        <button
          key={seconds}
          type="button"
          onClick={() => onPreset(seconds)}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
            duration === seconds ? 'bg-rest text-ink' : 'bg-panel-2 text-paper'
          }`}
        >
          {formatCompact(seconds)}
        </button>
      ))}
      <button
        type="button"
        onClick={onCustom}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
          isCustom ? 'bg-rest text-ink' : 'border border-dashed border-rest/70 bg-transparent text-rest'
        }`}
        aria-label="Pausa personalizada"
      >
        {isCustom ? formatCompact(duration) : 'otro'}
      </button>
    </div>
  )
}

export function PlanSession() {
  const { programId, dayId } = useParams()
  const location = useLocation()
  const program = programId ? getProgram(programId) : null
  const found = program && dayId ? findDay(program, dayId) : null
  if (!program || !found) return <Navigate to="/plan" replace />
  const from = (location.state as { from?: string } | null)?.from
  const backTo =
    from === 'program'
      ? `/plan/${program.id}`
      : from === 'list'
        ? '/plan'
        : `/plan/${program.id}/day/${found.day.id}`
  return (
    <LiveSession
      program={program}
      week={found.week}
      day={found.day}
      backTo={backTo}
    />
  )
}

function LiveSession({
  program,
  week,
  day,
  backTo,
}: {
  program: Program
  week: ProgramWeek
  day: ProgramDay
  backTo: string
}) {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => startSession(program.id, week.id, day.id))
  const rest = useRestTimer(session.restSeconds)
  const [customOpen, setCustomOpen] = useState(false)
  const [customMin, setCustomMin] = useState(() => minutesOf(session.restSeconds))
  const [customSec, setCustomSec] = useState(() => secondsOf(session.restSeconds))

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

  const applyRest = (seconds: number) => {
    const next = clamp(seconds, REST_MIN, REST_MAX)
    rest.setDuration(next)
    persist({ ...session, restSeconds: next })
  }

  const openCustomRest = () => {
    setCustomMin(minutesOf(rest.duration))
    setCustomSec(secondsOf(rest.duration))
    setCustomOpen(true)
  }

  const logFor = (set: ProgramSet): SetLog =>
    session.logs.find((item) => item.setId === set.id) ?? { setId: set.id, actualReps: set.reps, done: false }

  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)

  const persistLogs = (nextLogs: SetLog[]) => {
    const done = nextLogs.filter((item) => item.done).length
    const saved = persist({
      ...session,
      logs: nextLogs,
      completedAt: done >= totalSets && totalSets > 0 ? Date.now() : null,
    })
    recordPlanSession(saved, program, week, day)
    return saved
  }

  const patchLog = (set: ProgramSet, patch: Partial<SetLog>) => {
    const current = logFor(set)
    const nextLog = { ...current, ...patch }
    persistLogs([...session.logs.filter((item) => item.setId !== set.id), nextLog])
  }

  const doneSets = session.logs.filter((item) => item.done).length
  const lastTen = rest.running && rest.remainingMs > 0 && rest.remainingMs <= 10000

  const leave = () => {
    navigate(backTo)
  }

  return (
    <Screen>
      {rest.running ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-20">
          <div className="pointer-events-auto mx-auto w-full max-w-lg px-5 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="rounded-3xl border border-rest/50 bg-panel p-3 shadow-lg shadow-black/40">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={leave}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 text-paper"
                  aria-label="Volver"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-[0.3em] text-rest">PAUSA</p>
                  <p
                    className={`w-fit font-timer text-5xl font-bold leading-none text-rest ${lastTen ? 'last-ten' : ''}`}
                  >
                    {formatClock(rest.remainingMs, true)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={rest.stop}
                  className="shrink-0 rounded-2xl bg-rest px-4 py-3 text-sm font-semibold text-ink"
                >
                  Saltar
                </button>
              </div>
              <div className="mt-3">
                <RestChipRow duration={rest.duration} onPreset={applyRest} onCustom={openCustomRest} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <TopBar title={day.name} onBack={leave} className={rest.running ? 'invisible' : ''} />
      {day.focus ? <p className="mb-3 text-sm text-mute">{day.focus}</p> : null}
      <p className="mb-3 text-sm text-mute">
        {doneSets}/{totalSets} series · ajusta reps y marca la serie
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold tracking-[0.22em] text-mute">PAUSA</p>
        <RestChipRow duration={rest.duration} onPreset={applyRest} onCustom={openCustomRest} />
      </div>

      <div className="flex flex-col gap-4">
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

      {customOpen ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">Pausa</p>
            <p className="mt-2 text-sm text-mute">Minutos y segundos para esta pausa.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stepper
                label="Min"
                value={customMin}
                min={0}
                max={10}
                onChange={setCustomMin}
              />
              <Stepper
                label="Seg"
                value={customSec}
                min={0}
                max={59}
                step={5}
                format={(value) => String(value).padStart(2, '0')}
                onChange={setCustomSec}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  applyRest(toTotalSeconds(customMin, customSec))
                  setCustomOpen(false)
                }}
                className="rounded-2xl bg-rest py-3 font-semibold text-ink"
              >
                Poner
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
