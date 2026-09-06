import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { KIND_META } from '../data/kinds'

export function TimersMenu() {
  return (
    <Screen>
      <TopBar title="TIMERS" />
      <p className="mb-5 text-sm text-mute">Elige el formato del WOD. Configura tiempos y lanza la cuenta atrás.</p>
      <div className="grid grid-cols-2 gap-3">
        {KIND_META.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.kind}
              to={`/timers/${item.kind}`}
              className="flex min-h-36 flex-col rounded-3xl border border-line bg-panel p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-panel-2 text-flame">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-auto font-display text-3xl leading-none text-paper">{item.title}</h2>
              <p className="mt-1 text-xs text-mute">{item.subtitle}</p>
            </Link>
          )
        })}
      </div>
    </Screen>
  )
}
