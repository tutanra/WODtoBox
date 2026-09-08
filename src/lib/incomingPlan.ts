import { parsePlanShareText } from './sharePlan'
import type { Program } from '../types/program'

const EVENT = 'wodtobox:incoming-plan'

export interface IncomingPlanShare {
  program: Program | null
  error: string | null
}

let pending: IncomingPlanShare | null = null

function publish(next: IncomingPlanShare) {
  pending = next
  window.dispatchEvent(new Event(EVENT))
}

export function offerIncomingPlanText(text: string) {
  const parsed = parsePlanShareText(text)
  publish(
    parsed
      ? { program: parsed.program, error: null }
      : { program: null, error: 'Ese archivo no es un plan de WODtoBox.' },
  )
}

export function offerIncomingPlanError(message: string) {
  publish({ program: null, error: message })
}

export function takeIncomingPlanShare(): IncomingPlanShare | null {
  const value = pending
  pending = null
  return value
}

export function onIncomingPlanShare(listener: () => void) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
