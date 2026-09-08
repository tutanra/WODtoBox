import { Navigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { metaFor } from '../data/kinds'
import { formatClock, formatHistoryDay, formatHistoryTime } from '../lib/format'
import { getHistoryEntry } from '../lib/history'
import { summarizeTimer } from '../lib/summarize'
import { wodPreview } from '../types/wod'
import {
  historyResultLabel,
  historyTitle,
  type HistoryPlanEntry,
  type HistoryRmEntry,
  type HistoryWodEntry,
} from '../types/history'

export function HistoryDetail() {
  const { id } = useParams()
  const entry = id ? getHistoryEntry(id) : null
  if (!entry) return <Navigate to="/historial" replace />

  const title = entry.kind === 'wod' ? 'WOD' : entry.kind === 'rm' ? 'RM' : 'PLAN'

  return (
    <Screen>
      <TopBar title={title} backTo="/historial" />
      <p className="text-xs font-semibold tracking-[0.22em] text-flame">
        {entry.kind === 'rm'
          ? formatHistoryDay(entry.finishedAt).toUpperCase()
          : `${formatHistoryDay(entry.finishedAt).toUpperCase()} · ${formatHistoryTime(entry.finishedAt)}`}
      </p>
      <h2 className="mt-2 font-display text-5xl leading-none text-paper">{historyTitle(entry)}</h2>
      <p className="mt-3 whitespace-pre-line rounded-2xl bg-panel px-4 py-3 text-sm font-semibold text-gold">
        {historyResultLabel(entry)}
      </p>

      {entry.kind === 'wod' ? (
        <WodDetail entry={entry} />
      ) : entry.kind === 'rm' ? (
        <RmDetail entry={entry} />
      ) : (
        <PlanDetail entry={entry} />
      )}
    </Screen>
  )
}

function WodDetail({ entry }: { entry: HistoryWodEntry }) {
  const wodLike = {
    id: entry.wodId,
    name: entry.name,
    kind: entry.timerKind,
    blocks: entry.blocks,
    timer: entry.timer,
    seeded: false,
    seedRevision: 0,
    createdAt: entry.finishedAt,
    updatedAt: entry.finishedAt,
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      <article className="rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-mute">FORMATO</p>
        <p className="mt-1 font-display text-3xl text-paper">{metaFor(entry.timerKind).title}</p>
        <p className="mt-1 text-sm text-mute">{summarizeTimer(entry.timer)}</p>
        {entry.timerKind === 'forTime' || entry.timerKind === 'stopwatch' ? (
          <p className="mt-3 font-timer text-4xl font-bold text-paper">
            {formatClock(entry.result.displayMs, false)}
          </p>
        ) : null}
        {entry.timerKind === 'amrap' ? (
          <p className="mt-3 font-timer text-4xl font-bold text-paper">
            {entry.result.amrapRounds} {entry.result.amrapRounds === 1 ? 'ronda' : 'rondas'}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-mute">{entry.result.sublabel}</p>
      </article>
      <article className="rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-mute">CONTENIDO</p>
        <p className="mt-2 text-sm text-paper">{wodPreview(wodLike, 12)}</p>
      </article>
    </div>
  )
}

function RmDetail({ entry }: { entry: HistoryRmEntry }) {
  return (
    <div className="mt-5">
      <article className="rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-mute">MÁXIMO</p>
        <p className="mt-1 font-display text-3xl text-paper">{entry.exercise.trim() || 'Ejercicio'}</p>
        <p className="mt-3 font-timer text-4xl font-bold text-paper">{historyResultLabel(entry)}</p>
        <p className="mt-2 text-sm text-mute">
          {entry.reps} {entry.reps === 1 ? 'repetición' : 'repeticiones'}
        </p>
      </article>
    </div>
  )
}

function PlanDetail({ entry }: { entry: HistoryPlanEntry }) {
  const week = entry.weekTitle.trim() || (entry.weekNumber > 0 ? `Semana ${entry.weekNumber}` : 'Semana')
  const day = entry.dayName.trim()
  const meta = [day ? week : '', entry.dayFocus.trim()].filter(Boolean).join(' · ')
  return (
    <div className="mt-5 flex flex-col gap-3 pb-4">
      <article className="rounded-3xl border border-line bg-panel p-4">
        <p className="text-xs font-semibold tracking-[0.22em] text-mute">DÍA</p>
        <p className="mt-1 font-display text-3xl text-paper">{day || week}</p>
        {meta ? <p className="mt-1 text-sm text-mute">{meta}</p> : null}
      </article>
      {entry.exercises.map((exercise, index) => (
        <article key={`${exercise.name}-${index}`} className="rounded-3xl border border-line bg-panel p-4">
          <h3 className="font-display text-3xl leading-none text-paper">
            {exercise.name.trim() || 'Ejercicio'}
          </h3>
          {exercise.cue ? <p className="mt-1 text-sm text-mute">{exercise.cue}</p> : null}
          <div className="mt-3 flex flex-col gap-2">
            {exercise.sets.map((set, setIndex) => {
              const load = /kg|pesad|libre/i.test(set.weightText)
                ? set.weightText
                : set.weightText
                  ? `${set.weightText} kg`
                  : '—'
              return (
                <div
                  key={set.setId}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 ${
                    set.done ? 'bg-panel-2' : 'bg-ink'
                  }`}
                >
                  <span className="text-xs text-mute">Serie {setIndex + 1}</span>
                  <span className="text-sm text-mute">{load}</span>
                  <span className="font-timer text-xl font-bold text-paper">
                    {set.actualReps}
                    <span className="text-sm font-semibold text-mute">/{set.reps}</span>
                  </span>
                  <span className={`text-sm font-semibold ${set.done ? 'text-work' : 'text-mute'}`}>
                    {set.done ? 'Hecha' : 'Pendiente'}
                  </span>
                </div>
              )
            })}
          </div>
        </article>
      ))}
    </div>
  )
}
