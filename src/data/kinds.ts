import type { ComponentType } from 'react'
import {
  Clock3,
  Flame,
  Layers,
  Repeat2,
  Timer,
  Watch,
} from 'lucide-react'
import type { TimerKind } from '../types/timer'

export interface KindMeta {
  kind: TimerKind
  title: string
  subtitle: string
  hint: string
  icon: ComponentType<{ className?: string }>
}

export const KIND_META: KindMeta[] = [
  {
    kind: 'amrap',
    title: 'AMRAP',
    subtitle: 'As Many Rounds As Possible',
    hint: 'Cuenta atrás durante el tiempo fijado',
    icon: Repeat2,
  },
  {
    kind: 'forTime',
    title: 'FOR TIME',
    subtitle: 'Time cap',
    hint: 'Cuenta de 0 al cap o al revés, con tope opcional',
    icon: Timer,
  },
  {
    kind: 'emom',
    title: 'EMOM',
    subtitle: 'Every Minute On the Minute',
    hint: 'Intervalos de 1, 2 o 3 minutos',
    icon: Clock3,
  },
  {
    kind: 'tabata',
    title: 'TABATA',
    subtitle: '20 / 10',
    hint: '8 rondas clásicas de trabajo y descanso',
    icon: Flame,
  },
  {
    kind: 'intervals',
    title: 'INTERVALOS',
    subtitle: 'Work / Rest',
    hint: 'Bloques personalizados de trabajo y pausa',
    icon: Layers,
  },
  {
    kind: 'stopwatch',
    title: 'CRONÓMETRO',
    subtitle: 'Libre',
    hint: 'Tiempo corrido, sin estructura',
    icon: Watch,
  },
]

export function metaFor(kind: TimerKind) {
  const found = KIND_META.find((item) => item.kind === kind)
  if (!found) throw new Error(`Unknown timer kind: ${kind}`)
  return found
}
