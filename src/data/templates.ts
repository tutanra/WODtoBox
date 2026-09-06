import { buildKippingMuscleUpProgram, KIPPING_MUSCLE_UP_ID } from './kippingMuscleUp'
import { buildPowerCleanProgram, POWER_CLEAN_PROGRAM_ID } from './powerClean100'
import type { Program } from '../types/program'

export const PROGRAM_TEMPLATES: { id: string; build: () => Program }[] = [
  { id: POWER_CLEAN_PROGRAM_ID, build: buildPowerCleanProgram },
  { id: KIPPING_MUSCLE_UP_ID, build: buildKippingMuscleUpProgram },
]

export function buildTemplate(id: string) {
  return PROGRAM_TEMPLATES.find((template) => template.id === id)?.build() ?? null
}
