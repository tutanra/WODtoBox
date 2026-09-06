import { Plus, Repeat2, Trash2 } from 'lucide-react'
import { clamp, formatCompact } from '../lib/format'
import {
  newExercise,
  newRest,
  newRoundSet,
  type WodExercise,
  type WodItem,
  type WodRest,
  type WodRoundSet,
} from '../types/wod'

const REST_PRESETS = [15, 30, 60, 90, 120, 180]

interface WodBlockListProps {
  blocks: WodItem[]
  onChange: (blocks: WodItem[]) => void
}

export function WodBlockList({ blocks, onChange }: WodBlockListProps) {
  const replace = (id: string, next: WodItem) => {
    onChange(blocks.map((item) => (item.id === id ? next : item)))
  }

  const remove = (id: string) => {
    const remaining = blocks.filter((item) => item.id !== id)
    onChange(remaining.length > 0 ? remaining : [newExercise()])
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((item, index) => (
        <ItemCard
          key={item.id}
          item={item}
          index={index}
          onChange={(next) => replace(item.id, next)}
          onRemove={() => remove(item.id)}
        />
      ))}

      <div className="grid grid-cols-3 gap-2">
        <AddButton label="Ejercicio" onClick={() => onChange([...blocks, newExercise()])} />
        <AddButton label="Descanso" tone="rest" onClick={() => onChange([...blocks, newRest()])} />
        <AddButton label="Rondas" tone="flame" onClick={() => onChange([...blocks, newRoundSet()])} />
      </div>
    </div>
  )
}

function AddButton({
  label,
  onClick,
  tone = 'paper',
}: {
  label: string
  onClick: () => void
  tone?: 'paper' | 'rest' | 'flame'
}) {
  const colors =
    tone === 'rest'
      ? 'border-rest/40 text-rest'
      : tone === 'flame'
        ? 'border-flame/40 text-flame'
        : 'border-line text-paper'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1 rounded-2xl border border-dashed py-3 text-xs font-semibold ${colors}`}
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function ItemCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: WodItem
  index: number
  onChange: (item: WodItem) => void
  onRemove: () => void
}) {
  if (item.type === 'rounds') {
    return <RoundSetCard item={item} onChange={onChange} onRemove={onRemove} />
  }
  if (item.type === 'rest') {
    return <RestCard item={item} onChange={onChange} onRemove={onRemove} />
  }
  return <ExerciseCard item={item} index={index + 1} onChange={onChange} onRemove={onRemove} />
}

function ExerciseCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: WodExercise
  index: number
  onChange: (item: WodExercise) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      <div className="flex items-center gap-2">
        <span className="w-6 text-center text-xs font-semibold text-mute">{index}</span>
        <input
          value={item.text}
          onChange={(event) => onChange({ ...item, text: event.target.value })}
          placeholder="Ejercicio y reps"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 py-2 text-paper outline-none placeholder:text-mute focus:border-flame"
        />
        <input
          value={item.weight}
          onChange={(event) => onChange({ ...item, weight: event.target.value })}
          placeholder="Peso"
          className="w-24 shrink-0 rounded-xl border border-line bg-ink px-2 py-2 text-center text-sm text-paper outline-none placeholder:text-mute focus:border-gold"
        />
        <DeleteButton onClick={onRemove} />
      </div>
    </div>
  )
}

function RestCard({
  item,
  onChange,
  onRemove,
}: {
  item: WodRest
  onChange: (item: WodRest) => void
  onRemove: () => void
}) {
  const setSeconds = (restSeconds: number) => onChange({ ...item, restSeconds: clamp(restSeconds, 5, 600) })

  return (
    <div className="rounded-2xl border border-rest/30 bg-panel p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-[0.18em] text-rest">REST</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-panel-2 text-lg text-paper"
            onClick={() => setSeconds(item.restSeconds - 15)}
          >
            −
          </button>
          <p className="min-w-14 text-center font-timer text-2xl font-bold text-paper">
            {formatCompact(item.restSeconds)}
          </p>
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-panel-2 text-lg text-paper"
            onClick={() => setSeconds(item.restSeconds + 15)}
          >
            +
          </button>
          <DeleteButton onClick={onRemove} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {REST_PRESETS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => setSeconds(seconds)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              item.restSeconds === seconds ? 'bg-rest text-ink' : 'bg-panel-2 text-paper'
            }`}
          >
            {formatCompact(seconds)}
          </button>
        ))}
      </div>
    </div>
  )
}

function RoundSetCard({
  item,
  onChange,
  onRemove,
}: {
  item: WodRoundSet
  onChange: (item: WodRoundSet) => void
  onRemove: () => void
}) {
  const replaceChild = (id: string, next: WodExercise | WodRest) => {
    onChange({
      ...item,
      items: item.items.map((child) => (child.id === id ? next : child)),
    })
  }

  const removeChild = (id: string) => {
    const remaining = item.items.filter((child) => child.id !== id)
    onChange({ ...item, items: remaining.length > 0 ? remaining : [newExercise()] })
  }

  return (
    <div className="rounded-2xl border border-flame/30 bg-panel p-3">
      <div className="mb-3 flex items-center gap-2">
        <Repeat2 className="h-4 w-4 text-flame" />
        <p className="text-xs font-semibold tracking-[0.18em] text-flame">RONDAS</p>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-panel-2 text-lg text-paper"
            onClick={() => onChange({ ...item, rounds: Math.max(2, item.rounds - 1) })}
          >
            −
          </button>
          <p className="min-w-8 text-center font-timer text-2xl font-bold text-paper">{item.rounds}</p>
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-panel-2 text-lg text-paper"
            onClick={() => onChange({ ...item, rounds: Math.min(30, item.rounds + 1) })}
          >
            +
          </button>
          <DeleteButton onClick={onRemove} />
        </div>
      </div>
      <p className="mb-2 text-xs text-mute">Estos movimientos se repiten {item.rounds} veces seguidas.</p>
      <div className="flex flex-col gap-2">
        {item.items.map((child, index) =>
          child.type === 'rest' ? (
            <RestCard
              key={child.id}
              item={child}
              onChange={(next) => replaceChild(child.id, next)}
              onRemove={() => removeChild(child.id)}
            />
          ) : (
            <ExerciseCard
              key={child.id}
              item={child}
              index={index + 1}
              onChange={(next) => replaceChild(child.id, next)}
              onRemove={() => removeChild(child.id)}
            />
          ),
        )}
        <div className="grid grid-cols-2 gap-2">
          <AddButton
            label="Ejercicio"
            onClick={() => onChange({ ...item, items: [...item.items, newExercise()] })}
          />
          <AddButton
            label="Descanso"
            tone="rest"
            onClick={() => onChange({ ...item, items: [...item.items, newRest()] })}
          />
        </div>
      </div>
    </div>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-2 text-mute"
      aria-label="Quitar"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
