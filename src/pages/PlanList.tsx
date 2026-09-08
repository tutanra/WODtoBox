import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ChevronRight, Dumbbell, FileUp, Play, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { unlockAudio } from '../lib/audio'
import { onIncomingPlanShare, takeIncomingPlanShare } from '../lib/incomingPlan'
import { listPrograms, saveProgram } from '../lib/programs'
import { programOverview, startSession } from '../lib/sessions'
import { copyImportedProgram, parsePlanShareText } from '../lib/sharePlan'
import { emptyProgram, type Program } from '../types/program'

const RING = 2 * Math.PI * 22

function ProgressRing({ ratio }: { ratio: number }) {
  const complete = ratio >= 1
  const percent = Math.round(ratio * 100)
  return (
    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="4" className="text-mute/35" />
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - (ratio > 0 ? Math.max(ratio, 0.04) : 0))}
          className={complete ? 'text-work' : 'text-flame'}
        />
      </svg>
      <span className={`font-display text-2xl leading-none ${complete ? 'text-work' : 'text-paper'}`}>
        {percent}
      </span>
    </span>
  )
}

export function PlanList() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [programs, setPrograms] = useState(() => listPrograms())
  const [pendingImport, setPendingImport] = useState<Program | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const applyIncoming = () => {
      const incoming = takeIncomingPlanShare()
      if (!incoming) return
      if (incoming.error) setError(incoming.error)
      if (incoming.program) {
        setError(null)
        setPendingImport(incoming.program)
      }
    }
    applyIncoming()
    return onIncomingPlanShare(applyIncoming)
  }, [])

  const pickImportFile = () => {
    setError(null)
    fileRef.current?.click()
  }

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const parsed = parsePlanShareText(await file.text())
      if (!parsed) {
        setError('Ese archivo no es un plan de WODtoBox.')
        return
      }
      setError(null)
      setPendingImport(parsed.program)
    } catch {
      setError('No se pudo leer el fichero.')
    } finally {
      setBusy(false)
    }
  }

  const applyImport = () => {
    if (!pendingImport) return
    saveProgram(copyImportedProgram(pendingImport))
    setPrograms(listPrograms())
    setPendingImport(null)
  }

  return (
    <Screen>
      <TopBar
        title="PLAN"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={pickImportFile}
              className="flex h-11 items-center gap-1 rounded-full border border-line bg-panel px-2.5 text-paper disabled:opacity-40"
            >
              <FileUp className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold leading-none">importar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const created = saveProgram(emptyProgram())
                navigate(`/plan/${created.id}`)
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-flame text-ink"
              aria-label="Nueva planificación"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        }
      />
      <p className="mb-5 text-sm text-mute">
        Programas por semanas y días. Edita kilos y reps; en sesión marca pausas y cumplimenta
        repeticiones. Puedes importar un fichero .wodtobox de un plan.
      </p>
      {error ? <p className="mb-4 text-sm text-warn">{error}</p> : null}

      <input
        ref={fileRef}
        type="file"
        accept=".wodtobox,application/json,.json"
        className="hidden"
        onChange={(event) => void onImportFile(event)}
      />

      {programs.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-flame">
            <Dumbbell className="h-7 w-7" />
          </span>
          <h2 className="mt-6 font-display text-5xl text-paper">SIN PLANES</h2>
          <p className="mt-3 max-w-sm text-mute">
            Crea un programa por semanas y días, o importa un .wodtobox.
          </p>
          <button
            type="button"
            onClick={() => {
              const created = saveProgram(emptyProgram())
              navigate(`/plan/${created.id}`)
            }}
            className="mt-6 rounded-2xl bg-flame px-6 py-3 font-display text-3xl text-ink"
          >
            NUEVO PLAN
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={pickImportFile}
            className="mt-3 rounded-2xl border border-line px-6 py-3 font-semibold text-paper disabled:opacity-40"
          >
            Importar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {programs.map((program) => {
            const overview = programOverview(program)
            const percent = Math.round(overview.ratio * 100)
            const complete = overview.dayCount > 0 && overview.doneDays === overview.dayCount
            return (
              <article
                key={program.id}
                className="relative overflow-hidden rounded-3xl border border-flame/25 bg-panel shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-flame to-flame-2"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-flame/25 blur-2xl"
                  aria-hidden
                />
                <Link to={`/plan/${program.id}`} className="relative block p-4 pl-5">
                  <div className="flex items-center gap-3">
                    <ProgressRing ratio={overview.ratio} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold tracking-[0.22em] text-flame">PLAN</p>
                      <h2 className="mt-0.5 font-display text-4xl leading-none text-paper">
                        {program.name.trim() || 'Sin nombre'}
                      </h2>
                      <p className="mt-1 truncate text-sm text-mute">
                        {program.subtitle || `${overview.weekCount} semanas`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-flame" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper">
                      {overview.weekCount} sem
                    </span>
                    <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper">
                      {overview.dayCount} días
                    </span>
                    <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-work">
                      {overview.doneDays} hecho{overview.doneDays === 1 ? '' : 's'}
                    </span>
                    {program.targets[0]?.goal ? (
                      <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
                        {program.targets[0].goal}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink">
                    <div
                      className={`h-full rounded-full ${complete ? 'bg-work' : 'bg-linear-to-r from-flame to-flame-2'}`}
                      style={{ width: `${percent === 0 ? 0 : Math.max(percent, 4)}%` }}
                    />
                  </div>
                </Link>
                <div className="relative flex items-center gap-2 px-4 pb-4 pl-5">
                  {complete ? (
                    <p className="min-w-0 flex-1 truncate rounded-2xl bg-work/15 px-3 py-2.5 text-sm font-semibold text-work">
                      Plan completado
                    </p>
                  ) : overview.next ? (
                    <>
                      <p className="min-w-0 flex-1 truncate rounded-2xl bg-ink px-3 py-2.5 text-sm font-semibold text-paper">
                        Siguiente · {overview.next.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio()
                          startSession(program.id, overview.next!.weekId, overview.next!.dayId)
                          navigate(`/plan/${program.id}/day/${overview.next!.dayId}/train`, {
                            state: { from: 'list' },
                          })
                        }}
                        className="flex h-11 w-14 shrink-0 items-center justify-center rounded-2xl bg-flame text-ink"
                        aria-label={`Entrenar ${overview.next.label}`}
                      >
                        <Play className="h-5 w-5" fill="currentColor" />
                      </button>
                    </>
                  ) : (
                    <p className="min-w-0 flex-1 truncate rounded-2xl bg-ink px-3 py-2.5 text-sm font-semibold text-mute">
                      Sin días todavía
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {pendingImport ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Añadir {pendingImport.name.trim() || 'este plan'}?
            </p>
            <p className="mt-2 text-sm text-mute">
              Se crea una copia en este dispositivo. No sustituye los planes que ya tienes.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyImport}
                className="rounded-2xl bg-flame py-3 font-semibold text-ink"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
