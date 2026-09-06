import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'

export function Home() {
  return (
    <Screen className="justify-between">
      <div className="pt-8">
        <p className="text-sm font-semibold tracking-[0.42em] text-flame">WOD TIMER</p>
        <h1 className="mt-3 font-display text-7xl leading-[0.85] text-paper">
          WOD
          <br />
          PLANNING
        </h1>
        <p className="mt-5 max-w-xs text-mute">
          Timers, WODs grabados y la planificación de fuerza, con pausas y reps en sesión.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          to="/timers"
          className="group relative overflow-hidden rounded-3xl border border-flame/40 bg-gradient-to-br from-flame to-orange-700 p-5 text-ink shadow-[0_20px_60px_rgba(255,90,31,0.25)]"
        >
          <p className="text-xs font-semibold tracking-[0.28em]">MENÚ 01</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-5xl leading-none">TIMERS</h2>
              <p className="mt-2 text-sm font-medium text-ink/80">AMRAP · For Time · EMOM · Tabata</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-flame">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </Link>

        <Link
          to="/wods"
          className="rounded-3xl border border-line bg-panel p-5 text-paper"
        >
          <p className="text-xs font-semibold tracking-[0.28em] text-mute">MENÚ 02</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-5xl leading-none text-paper">WODS</h2>
              <p className="mt-2 text-sm text-mute">Grabados · ejercicios · descanso · al timer</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink text-flame">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </Link>

        <Link
          to="/plan"
          className="rounded-3xl border border-line bg-panel p-5 text-paper"
        >
          <p className="text-xs font-semibold tracking-[0.28em] text-mute">MENÚ 03</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-5xl leading-none text-paper">PLAN</h2>
              <p className="mt-2 text-sm text-mute">Power Clean · Muscle-Up · series · pausas</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink text-flame">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </Link>
      </div>
    </Screen>
  )
}
