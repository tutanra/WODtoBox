import { Pause, Repeat2 } from 'lucide-react'
import { activeBlockId } from '../lib/wodProgress'
import { formatCompact } from '../lib/format'
import type { TimerSnapshot } from '../types/timer'
import type { Wod, WodItem } from '../types/wod'

interface WodOverlayProps {
  wod: Wod
  snapshot: TimerSnapshot
}

export function WodOverlay({ wod, snapshot }: WodOverlayProps) {
  const activeId = activeBlockId(wod, snapshot)
  const showAllWork = wod.kind === 'amrap' || wod.kind === 'forTime' || wod.kind === 'stopwatch'
  const blocks = wod.blocks.filter(hasContent)

  if (blocks.length === 0) return null

  return (
    <div className="mt-3 w-full max-w-md rounded-2xl border border-line bg-panel/90 px-4 py-2.5">
      <p className="text-center text-xs font-semibold tracking-[0.28em] text-flame">
        {wod.name.trim() || 'WOD'}
      </p>
      <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
        {blocks.map((item, index) => (
          <OverlayItem
            key={item.id}
            item={item}
            index={index}
            activeId={activeId}
            highlightWork={showAllWork && snapshot.phase === 'work'}
          />
        ))}
      </ul>
    </div>
  )
}

function hasContent(item: WodItem) {
  if (item.type === 'rest') return true
  if (item.type === 'exercise') return Boolean(item.text.trim())
  return item.items.some((child) => child.type === 'rest' || child.text.trim())
}

function OverlayItem({
  item,
  index,
  activeId,
  highlightWork,
}: {
  item: WodItem
  index: number
  activeId: string | null
  highlightWork: boolean
}) {
  if (item.type === 'rounds') {
    const innerActive = item.items.some((child) => child.id === activeId)
    return (
      <li className={`rounded-xl px-2 py-1.5 ${innerActive ? 'bg-panel-2' : ''}`}>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-flame">
          <Repeat2 className="h-3.5 w-3.5" />
          {item.rounds} RONDAS
        </p>
        <ul className="space-y-1 pl-2">
          {item.items.filter(hasContent).map((child, childIndex) => (
            <OverlayItem
              key={child.id}
              item={child}
              index={childIndex}
              activeId={activeId}
              highlightWork={highlightWork}
            />
          ))}
        </ul>
      </li>
    )
  }

  const highlighted =
    activeId === item.id || (highlightWork && item.type === 'exercise')

  return (
    <li
      className={`flex items-start gap-2 rounded-xl px-2 py-1.5 text-left text-sm ${
        highlighted ? 'bg-panel-2 text-paper' : 'text-mute'
      }`}
    >
      <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold text-mute">
        {item.type === 'rest' ? <Pause className="h-3.5 w-3.5 text-rest" /> : index + 1}
      </span>
      <span className={highlighted ? 'font-semibold' : ''}>
        {item.type === 'rest' ? 'Descanso' : item.text.trim() || 'Movimiento'}
      </span>
      {item.type === 'exercise' && item.weight.trim() ? (
        <span className={`ml-auto shrink-0 text-xs ${highlighted ? 'text-gold' : 'text-mute'}`}>
          {item.weight.trim()}
        </span>
      ) : null}
      {item.type === 'rest' ? (
        <span className="ml-auto shrink-0 text-xs text-rest">{formatCompact(item.restSeconds)}</span>
      ) : null}
    </li>
  )
}
