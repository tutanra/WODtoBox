import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TimerFields } from '../components/TimerFields'
import { TopBar } from '../components/TopBar'
import { metaFor } from '../data/kinds'
import { unlockAudio } from '../lib/audio'
import { newRunId, persistRunSession } from '../lib/runSession'
import { summarizeTimer } from '../lib/summarize'
import { defaultConfig, isTimerKind, type TimerConfig } from '../types/timer'
import { useMemo, useState } from 'react'

export function TimerSetup() {
  const { kind } = useParams()
  const navigate = useNavigate()

  if (!isTimerKind(kind)) {
    return <Navigate to="/timers" replace />
  }

  return (
    <SetupForm
      key={kind}
      kind={kind}
      onStart={(config) => {
        unlockAudio()
        persistRunSession({ config, wod: null, runId: newRunId() })
        navigate(`/timers/${config.kind}/run`, { state: { config, wod: null } })
      }}
      onBack={() => navigate('/timers')}
    />
  )
}

function SetupForm({
  kind,
  onStart,
  onBack,
}: {
  kind: TimerConfig['kind']
  onStart: (config: TimerConfig) => void
  onBack: () => void
}) {
  const meta = metaFor(kind)
  const [config, setConfig] = useState(() => defaultConfig(kind))
  const summary = useMemo(() => summarizeTimer(config), [config])

  return (
    <Screen>
      <TopBar title={meta.title} backTo="/timers" onBack={onBack} />
      <p className="mb-6 text-sm text-mute">{meta.hint}</p>

      <div className="flex flex-col gap-3 pb-28">
        <TimerFields config={config} onChange={setConfig} />
        <p className="text-center text-sm text-mute">{summary}</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-lg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          disabled={config.kind === 'amrap' && config.durationSeconds <= 0}
          onClick={() => onStart(config)}
          className="w-full rounded-2xl bg-flame py-4 font-display text-4xl tracking-wide text-ink disabled:opacity-40"
        >
          START
        </button>
      </div>
    </Screen>
  )
}
