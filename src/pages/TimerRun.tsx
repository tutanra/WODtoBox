import { useEffect } from 'react'
import { Flag, Pause, Play, RotateCcw, Undo2 } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { WodOverlay } from '../components/WodOverlay'
import { metaFor } from '../data/kinds'
import { useTimerEngine } from '../hooks/useTimerEngine'
import { formatClock } from '../lib/format'
import { parseRunState, persistRunSession, readRunSession } from '../lib/runSession'
import { bindWakeLockOnVisible, releaseWakeLock, requestWakeLock } from '../lib/wakeLock'
import { isTimerKind, type TimerConfig } from '../types/timer'
import type { Wod } from '../types/wod'

export function TimerRun() {
  const { kind } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const session = parseRunState(location.state) ?? readRunSession()
  const config = session?.config ?? null
  const wod = session?.wod ?? null

  if (!isTimerKind(kind) || !config || config.kind !== kind) {
    return <Navigate to={isTimerKind(kind) ? `/timers/${kind}` : '/timers'} replace />
  }

  const exitTo = wod ? `/wods/${wod.id}` : `/timers/${config.kind}`

  return <LiveTimer config={config} wod={wod} onExit={() => navigate(exitTo)} />
}

function LiveTimer({
  config,
  wod,
  onExit,
}: {
  config: TimerConfig
  wod: Wod | null
  onExit: () => void
}) {
  const { snapshot, running, paused, start, pause, resume, reset, addRound, markFinish } =
    useTimerEngine(config, true)

  useEffect(() => {
    persistRunSession({ config, wod })
    void requestWakeLock()
    const unbind = bindWakeLockOnVisible()
    return () => {
      unbind()
      void releaseWakeLock()
    }
  }, [config, wod])

  const lastTen = snapshot.phase === 'work' && snapshot.warning
  const color = phaseColor(snapshot.phase, snapshot.phase === 'prepare' && snapshot.warning)
  const showRounds = config.kind === 'amrap'
  const showFinish = config.kind === 'forTime' && snapshot.phase === 'work'
  const canToggle = snapshot.phase !== 'finished' && snapshot.phase !== 'idle'

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink">
      <div
        className="absolute inset-x-0 top-0 h-1.5 origin-left bg-flame transition-[width] duration-75"
        style={{ width: `${Math.min(100, snapshot.overallProgress * 100)}%` }}
      />

      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onExit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-paper"
          aria-label="Salir"
        >
          <Undo2 className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <p className="text-[1.6875rem] font-semibold tracking-[0.22em] text-flame">
            {wod?.name.trim() || metaFor(config.kind).title}
          </p>
          {snapshot.totalRounds > 0 && snapshot.phase !== 'prepare' && snapshot.phase !== 'idle' ? (
            <p className="text-[1.96875rem] leading-tight text-mute">
              {snapshot.round} / {snapshot.totalRounds}
            </p>
          ) : (
            <p className="text-[1.96875rem] leading-tight text-mute">
              {snapshot.phase === 'prepare' ? 'Cuenta atrás' : snapshot.sublabel}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            reset()
            start()
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-paper"
          aria-label="Reiniciar"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3">
        <p className={`text-[2.53125rem] font-semibold tracking-[0.24em] ${color}`}>{snapshot.label}</p>
        <p
          className={`mt-1 w-fit font-timer font-bold leading-none tracking-normal tabular-nums ${color} ${lastTen ? 'last-ten' : ''}`}
          style={{
            fontSize:
              snapshot.isCountDown && snapshot.phase !== 'idle' && snapshot.phase !== 'finished'
                ? 'min(38vw, 30.4vh)'
                : 'min(40vw, 32vh)',
          }}
        >
          {snapshot.phase === 'finished'
            ? formatClock(snapshot.displayMs, false)
            : formatClock(snapshot.displayMs, snapshot.isCountDown)}
        </p>
        {snapshot.phase === 'finished' ? (
          <p className="mt-3 text-gold">{snapshot.sublabel}</p>
        ) : paused ? (
          <p className="mt-3 tracking-[0.3em] text-mute">PAUSA</p>
        ) : null}
        {showRounds && snapshot.phase !== 'prepare' && snapshot.phase !== 'idle' ? (
          <p className="mt-2 font-timer text-3xl text-paper">{snapshot.amrapRounds} rondas</p>
        ) : null}
        {wod ? <WodOverlay wod={wod} snapshot={snapshot} /> : null}
      </div>

      <footer className="grid grid-cols-2 gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {snapshot.phase === 'finished' ? (
          <>
            <button
              type="button"
              onClick={() => {
                reset()
                start()
              }}
              className="col-span-2 rounded-2xl bg-flame py-4 font-display text-3xl text-ink"
            >
              OTRA VEZ
            </button>
            <button
              type="button"
              onClick={onExit}
              className="col-span-2 rounded-2xl border border-line bg-panel py-3 font-semibold text-paper"
            >
              Volver {wod ? 'al WOD' : 'a ajustes'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!canToggle}
              onClick={() => (running ? pause() : resume())}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-panel py-4 font-semibold text-paper disabled:opacity-40"
            >
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? 'Pausa' : 'Seguir'}
            </button>
            {showRounds ? (
              <button
                type="button"
                disabled={snapshot.phase === 'prepare'}
                onClick={addRound}
                className="rounded-2xl bg-flame py-4 font-display text-3xl text-ink disabled:opacity-40"
              >
                + RONDA
              </button>
            ) : showFinish ? (
              <button
                type="button"
                onClick={markFinish}
                className="flex items-center justify-center gap-2 rounded-2xl bg-work py-4 font-display text-3xl text-ink"
              >
                <Flag className="h-5 w-5" />
                FINISH
              </button>
            ) : (
              <button
                type="button"
                onClick={onExit}
                className="rounded-2xl border border-line bg-panel py-4 font-semibold text-paper"
              >
                Salir
              </button>
            )}
          </>
        )}
      </footer>
    </div>
  )
}

function phaseColor(phase: string, countdownWarn: boolean) {
  if (countdownWarn) return 'text-warn'
  if (phase === 'prepare') return 'text-flame'
  if (phase === 'rest') return 'text-rest'
  if (phase === 'finished') return 'text-gold'
  if (phase === 'work') return 'text-work'
  return 'text-paper'
}
