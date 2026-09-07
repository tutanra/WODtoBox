import { useMemo, useState } from 'react'
import { CalendarDays, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip, ChipRow } from '../components/Chips'
import { Screen } from '../components/Screen'
import { TopBar } from '../components/TopBar'
import { deleteHistoryEntry, listHistory } from '../lib/history'
import { formatHistoryDay, formatHistoryTime, historyDayKey } from '../lib/format'
import {
  historyResultLabel,
  historySubtitle,
  historyTitle,
  type HistoryEntry,
  type HistoryKind,
} from '../types/history'

const FILTERS: { id: 'all' | HistoryKind; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'wod', label: 'WODs' },
  { id: 'plan', label: 'Plan' },
  { id: 'rm', label: 'RM' },
]

export function HistoryList() {
  const [entries, setEntries] = useState(() => listHistory())
  const [filter, setFilter] = useState<'all' | HistoryKind>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const visible = useMemo(
    () => (filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter)),
    [entries, filter],
  )
  const pending = useMemo(
    () => entries.find((entry) => entry.id === pendingId && entry.kind === 'wod') ?? null,
    [entries, pendingId],
  )
  const groups = useMemo(() => groupByDay(visible), [visible])

  return (
    <Screen>
      <TopBar title="HISTORIAL" />
      <p className="mb-5 text-sm text-mute">
        WODs terminados, días de plan y máximos (RM). El progreso del plan se reinicia en el propio
        plan; el historial se queda.
      </p>

      <ChipRow>
        {FILTERS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            active={filter === item.id}
            onClick={() => setFilter(item.id)}
          />
        ))}
      </ChipRow>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-flame">
            <CalendarDays className="h-7 w-7" />
          </span>
          <h2 className="mt-6 font-display text-5xl text-paper">SIN ENTRENOS</h2>
          <p className="mt-3 max-w-sm text-mute">
            {emptyCopy(filter)}
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-6 pb-4">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-3 text-xs font-semibold tracking-[0.22em] text-mute uppercase">
                {group.label}
              </h2>
              <div className="flex flex-col gap-3">
                {group.entries.map((entry) => (
                  <article key={entry.id} className="rounded-3xl border border-line bg-panel p-4">
                    <Link to={`/historial/${entry.id}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-semibold tracking-[0.22em] text-flame">
                          {entry.kind === 'wod' ? 'WOD' : entry.kind === 'rm' ? 'RM' : 'PLAN'}
                        </p>
                        {entry.kind === 'rm' ? null : (
                          <p className="text-xs text-mute">{formatHistoryTime(entry.finishedAt)}</p>
                        )}
                      </div>
                      <h3 className="mt-1 font-display text-4xl leading-none text-paper">
                        {historyTitle(entry)}
                      </h3>
                      <p className="mt-2 text-sm text-mute">{historySubtitle(entry)}</p>
                      <p className="mt-1 text-sm font-semibold text-gold">{historyResultLabel(entry)}</p>
                    </Link>
                    {entry.kind === 'wod' ? (
                      <button
                        type="button"
                        onClick={() => setPendingId(entry.id)}
                        className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-panel-2 text-mute"
                        aria-label="Borrar del historial"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {pending ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-5">
            <p className="font-display text-4xl text-paper">
              ¿Borrar {historyTitle(pending)} del historial?
            </p>
            <p className="mt-2 text-sm text-mute">No borra el WOD grabado, solo este entreno del historial.</p>
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
                  deleteHistoryEntry(pending.id)
                  setEntries(listHistory())
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

function groupByDay(entries: HistoryEntry[]) {
  const groups: { key: string; label: string; entries: HistoryEntry[] }[] = []
  for (const entry of entries) {
    const key = historyDayKey(entry.finishedAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.entries.push(entry)
    } else {
      groups.push({ key, label: formatHistoryDay(entry.finishedAt), entries: [entry] })
    }
  }
  return groups
}

function emptyCopy(filter: 'all' | HistoryKind) {
  if (filter === 'wod') {
    return 'Lanza un WOD al timer y termina la cuenta. El resultado aparecerá aquí.'
  }
  if (filter === 'plan') {
    return 'En un día de plan, marca series y pulsa Guardar y salir. El progreso se actualiza si vuelves a entrar.'
  }
  if (filter === 'rm') {
    return 'Añade un máximo en RM: ejercicio, reps y peso. Aparecerá aquí con el día.'
  }
  return 'Completa un WOD, entrena un día de plan o anota un RM para verlo aquí.'
}
