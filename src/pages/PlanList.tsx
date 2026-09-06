import { useMemo, useState } from 'react'
import { Dumbbell, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { listPrograms, saveProgram, deleteProgram } from '../lib/programs'
import { emptyProgram } from '../types/program'

export function PlanList() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState(() => listPrograms())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pending = useMemo(
    () => programs.find((program) => program.id === pendingId) ?? null,
    [pendingId, programs],
  )

  return (
    <Screen>
      <TopBar
        title="PLAN"
        action={
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
        }
      />
      <p className="mb-5 text-sm text-mute">
        Plantillas del Power Clean 100 kg y Kipping Muscle-Up, más planificaciones propias. Edita
        kilos y reps; en sesión marca pausas y cumplimenta repeticiones.
      </p>

      <div className="flex flex-col gap-3">
        {programs.map((program) => (
          <div key={program.id} className="rounded-3xl border border-line bg-panel p-4">
            <Link to={`/plan/${program.id}`} className="block">
              {program.seeded ? (
                <p className="text-xs font-semibold tracking-[0.22em] text-flame">PLANTILLA PDF</p>
              ) : (
                <p className="text-xs font-semibold tracking-[0.22em] text-mute">CUSTOM</p>
              )}
              <h2 className="mt-1 font-display text-4xl leading-none text-paper">
                {program.name.trim() || 'Sin nombre'}
              </h2>
              <p className="mt-2 text-sm text-mute">
                {program.subtitle || `${program.weeks.length} semanas`}
              </p>
            </Link>
            {!program.seeded ? (
              <button
                type="button"
                onClick={() => setPendingId(program.id)}
                className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-panel-2 text-mute"
                aria-label="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {programs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center text-mute">
          <Dumbbell className="h-8 w-8 text-flame" />
          <p className="mt-3">Crea una planificación o usa las plantillas del PDF.</p>
        </div>
      ) : null}

      {pending ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">¿Borrar {pending.name || 'esta plan'}?</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingId(null)}
                className="rounded-2xl border border-line py-3 font-semibold text-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProgram(pending.id)
                  setPrograms(listPrograms())
                  setPendingId(null)
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
