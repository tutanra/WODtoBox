import { useState } from 'react'
import { Copy, Play, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { unlockAudio } from '../lib/audio'
import { getProgram, restoreTemplate, saveProgram } from '../lib/programs'
import { getSession, sessionProgress, startSession } from '../lib/sessions'
import { cloneWeek, emptyWeek, renumberWeeks, type Program, type ProgramWeek } from '../types/program'

export function PlanProgram() {
  const { programId } = useParams()
  const stored = programId ? getProgram(programId) : null
  if (!stored) return <Navigate to="/plan" replace />
  return <ProgramView key={stored.id} initial={stored} />
}

function ProgramView({ initial }: { initial: Program }) {
  const navigate = useNavigate()
  const [program, setProgram] = useState(initial)
  const [pendingWeekId, setPendingWeekId] = useState<string | null>(null)

  const persist = (next: Program) => {
    const saved = saveProgram(next)
    setProgram(saved)
    return saved
  }

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

  return (
    <Screen>
      <TopBar title="PLAN" backTo="/plan" />

      <input
        value={program.name}
        onChange={(event) => setProgram((current) => ({ ...current, name: event.target.value }))}
        onBlur={() => persist(program)}
        placeholder="Nombre del programa"
        className="mb-2 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-lg text-paper outline-none placeholder:text-mute focus:border-flame"
      />
      <input
        value={program.subtitle}
        onChange={(event) => setProgram((current) => ({ ...current, subtitle: event.target.value }))}
        onBlur={() => persist(program)}
        placeholder="Subtítulo"
        className="mb-4 w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
      />

      {program.targets.length > 0 ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-line">
          {program.targets.map((target) => (
            <div key={target.movement} className="grid grid-cols-4 gap-1 border-b border-line px-3 py-2 text-xs last:border-b-0">
              <span className="text-paper">{target.movement}</span>
              <span className="text-mute">{target.start}</span>
              <span className="text-flame">{target.goal}</span>
              <span className="text-right text-mute">{target.ratio}</span>
            </div>
          ))}
        </div>
      ) : null}

      <textarea
        value={program.notes}
        onChange={(event) => setProgram((current) => ({ ...current, notes: event.target.value }))}
        onBlur={() => persist(program)}
        placeholder="Notas, claves técnicas, recuperación…"
        rows={4}
        className="mb-5 w-full resize-y rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-paper outline-none placeholder:text-mute focus:border-flame"
      />

      <div className="flex flex-col gap-3 pb-6">
        {program.weeks.map((week) => (
          <div key={week.id} className="rounded-3xl border border-line bg-panel p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.2em] text-flame">
                  {week.phase || `SEMANA ${week.number}`}
                </p>
                <h2 className="mt-1 font-display text-4xl leading-none text-paper">
                  S{week.number} · {week.title}
                </h2>
                {week.goal ? <p className="mt-1 text-sm text-mute">Objetivo {week.goal}</p> : null}
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

      {program.seeded ? (
        <button
          type="button"
          onClick={() => {
            const restored = restoreTemplate(program.id)
            if (restored) setProgram(restored)
          }}
          className="w-full rounded-2xl border border-line bg-panel py-3 text-sm font-semibold text-mute"
        >
          Restaurar plantilla del PDF
        </button>
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
