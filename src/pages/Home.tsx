import { ArrowUpRight, Cloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'

const menus = [
  {
    to: '/timers',
    n: '01',
    title: 'TIMERS',
    hint: 'AMRAP · For Time · EMOM · Tabata',
    featured: true,
  },
  { to: '/wods', n: '02', title: 'WODS', hint: 'Grabados · ejercicios · al timer', featured: false },
  { to: '/plan', n: '03', title: 'PLAN', hint: 'Power Clean · Muscle-Up · series', featured: false },
  { to: '/rm', n: '04', title: 'RM', hint: 'Pesos máximos · reps · kilos', featured: false },
  { to: '/historial', n: '05', title: 'HISTORIAL', hint: 'WODs · plan · RM', featured: false },
] as const

export function Home() {
  return (
    <Screen className="justify-between">
      <div className="pt-8">
        <p className="text-sm font-semibold tracking-[0.42em] text-flame">WOD TIMER</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="font-display text-7xl leading-[0.85] text-paper">
            WOD
            <br />
            PLANNING
          </h1>
          <Link
            to="/sync"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-flame"
            aria-label="Drive"
          >
            <Cloud className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-5 max-w-xs text-mute">
          Timers, WODs, plan de fuerza, máximos e historial.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {menus.map((menu) => (
          <Link
            key={menu.to}
            to={menu.to}
            className={
              menu.featured
                ? 'group relative overflow-hidden rounded-3xl border border-flame/40 bg-gradient-to-br from-flame to-orange-700 px-4 py-2.5 text-ink shadow-[0_20px_60px_rgba(255,90,31,0.25)]'
                : 'rounded-3xl border border-line bg-panel px-4 py-2.5 text-paper'
            }
          >
            <p className={`text-[11px] font-semibold tracking-[0.28em] ${menu.featured ? '' : 'text-mute'}`}>
              MENÚ {menu.n}
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className={`font-display text-4xl leading-none ${menu.featured ? '' : 'text-paper'}`}>
                  {menu.title}
                </h2>
                <p className={`mt-0.5 text-xs ${menu.featured ? 'font-medium text-ink/80' : 'text-mute'}`}>
                  {menu.hint}
                </p>
              </div>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  menu.featured ? 'bg-ink text-flame' : 'border border-line bg-ink text-flame'
                }`}
              >
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Screen>
  )
}
