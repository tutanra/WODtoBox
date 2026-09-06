import { defaultConfig, isTimerKind, type TimerConfig, type TimerKind } from './timer'
import { formatCompact } from '../lib/format'

export type WodItem = WodExercise | WodRest | WodRoundSet

export interface WodExercise {
  id: string
  type: 'exercise'
  text: string
  weight: string
}

export interface WodRest {
  id: string
  type: 'rest'
  restSeconds: number
}

export interface WodRoundSet {
  id: string
  type: 'rounds'
  rounds: number
  items: Array<WodExercise | WodRest>
}

export interface Wod {
  id: string
  name: string
  kind: TimerKind
  blocks: WodItem[]
  timer: TimerConfig
  createdAt: number
  updatedAt: number
}

export function newExercise(partial?: Partial<Omit<WodExercise, 'type'>>): WodExercise {
  return {
    id: crypto.randomUUID(),
    text: '',
    weight: '',
    ...partial,
    type: 'exercise',
  }
}

export function newRest(restSeconds = 60): WodRest {
  return {
    id: crypto.randomUUID(),
    type: 'rest',
    restSeconds,
  }
}

export function newRoundSet(rounds = 3): WodRoundSet {
  return {
    id: crypto.randomUUID(),
    type: 'rounds',
    rounds,
    items: [newExercise(), newExercise()],
  }
}

export function exerciseLabel(item: WodExercise) {
  const text = item.text.trim() || 'Movimiento'
  const weight = item.weight.trim()
  return weight ? `${text} @ ${weight}` : text
}

export function restLabel(item: WodRest) {
  return `Descanso ${formatCompact(item.restSeconds)}`
}

export function normalizeItem(raw: unknown): WodItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>

  if (item.type === 'exercise') {
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: 'exercise',
      text: typeof item.text === 'string' ? item.text : '',
      weight: typeof item.weight === 'string' ? item.weight : '',
    }
  }

  if (item.type === 'rest') {
    const restSeconds = typeof item.restSeconds === 'number' ? item.restSeconds : 60
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: 'rest',
      restSeconds: restSeconds > 0 ? restSeconds : 60,
    }
  }

  if (item.type === 'rounds') {
    const rounds = typeof item.rounds === 'number' ? item.rounds : 3
    const nested = Array.isArray(item.items)
      ? item.items
          .map(normalizeItem)
          .filter((child): child is WodExercise | WodRest => child != null && child.type !== 'rounds')
      : [newExercise(), newExercise()]
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: 'rounds',
      rounds: Math.max(2, rounds),
      items: nested.length > 0 ? nested : [newExercise()],
    }
  }

  if (typeof item.text === 'string' || item.isRest === true) {
    if (item.isRest) {
      return {
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        type: 'rest',
        restSeconds: 60,
      }
    }
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: 'exercise',
      text: typeof item.text === 'string' ? item.text : '',
      weight: '',
    }
  }

  return null
}

export function normalizeWod(value: unknown): Wod | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  if (typeof raw.kind !== 'string' || !isTimerKind(raw.kind) || !Array.isArray(raw.blocks)) return null

  const timer = raw.timer as TimerConfig | undefined
  const blocks = raw.blocks.map(normalizeItem).filter((item): item is WodItem => item != null)

  return {
    id: raw.id,
    name: raw.name,
    kind: raw.kind,
    blocks: blocks.length > 0 ? blocks : [newExercise()],
    timer: timer && isTimerKind(timer.kind)
      ? { ...defaultConfig(raw.kind), ...timer, kind: raw.kind }
      : defaultConfig(raw.kind),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  }
}

export function isWod(value: unknown): value is Wod {
  return normalizeWod(value) != null
}

export function newWod(kind: TimerKind = 'amrap'): Wod {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: '',
    kind,
    blocks: [newExercise()],
    timer: defaultConfig(kind),
    createdAt: now,
    updatedAt: now,
  }
}

function previewPiece(item: WodItem): string | null {
  if (item.type === 'exercise') {
    return item.text.trim() ? exerciseLabel(item) : null
  }
  if (item.type === 'rest') return restLabel(item)
  const inner = item.items.map(previewPiece).filter(Boolean)
  if (inner.length === 0) return `${item.rounds} rondas`
  return `${item.rounds} × (${inner.join(', ')})`
}

export function wodPreview(wod: Wod, limit = 3) {
  const lines = wod.blocks.map(previewPiece).filter(Boolean) as string[]
  if (lines.length === 0) return 'Sin movimientos'
  if (lines.length <= limit) return lines.join(' · ')
  return `${lines.slice(0, limit).join(' · ')} · +${lines.length - limit}`
}

export function flattenWork(blocks: WodItem[]): WodExercise[] {
  const out: WodExercise[] = []
  for (const item of blocks) {
    if (item.type === 'exercise' && item.text.trim()) out.push(item)
    if (item.type === 'rounds') {
      const inner = item.items.filter(
        (child): child is WodExercise => child.type === 'exercise' && Boolean(child.text.trim()),
      )
      for (let round = 0; round < item.rounds; round += 1) out.push(...inner)
    }
  }
  return out
}

export function flattenRests(blocks: WodItem[]): WodRest[] {
  const out: WodRest[] = []
  for (const item of blocks) {
    if (item.type === 'rest') out.push(item)
    if (item.type === 'rounds') {
      for (const child of item.items) {
        if (child.type === 'rest') out.push(child)
      }
    }
  }
  return out
}
