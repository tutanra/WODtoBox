import { parseWodShareText } from './shareWod'
import type { Wod } from '../types/wod'

const EVENT = 'wodtobox:incoming-wod'

export interface IncomingWodShare {
  wod: Wod | null
  error: string | null
}

let pending: IncomingWodShare | null = null

function publish(next: IncomingWodShare) {
  pending = next
  window.dispatchEvent(new Event(EVENT))
}

export function offerIncomingWodText(text: string) {
  const parsed = parseWodShareText(text)
  publish(
    parsed
      ? { wod: parsed.wod, error: null }
      : { wod: null, error: 'Ese archivo no es un WOD de WODtoBox.' },
  )
}

export function offerIncomingWodError(message: string) {
  publish({ wod: null, error: message })
}

export function takeIncomingWodShare(): IncomingWodShare | null {
  const value = pending
  pending = null
  return value
}

export function onIncomingWodShare(listener: () => void) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
