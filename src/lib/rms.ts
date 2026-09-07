import { deleteRmHistory } from './history'
import { normalizeRmLift, type RmLift } from '../types/rm'

const KEY = 'wodplanning.rms'

function readAll(): RmLift[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeRmLift)
      .filter((lift): lift is RmLift => lift != null)
      .sort((a, b) => b.liftedAt - a.liftedAt)
  } catch {
    return []
  }
}

function writeAll(lifts: RmLift[]) {
  localStorage.setItem(KEY, JSON.stringify(lifts))
}

export function listRms() {
  return readAll()
}

export function getRm(id: string) {
  return readAll().find((lift) => lift.id === id) ?? null
}

export function saveRm(lift: RmLift) {
  const next: RmLift = { ...lift, exercise: lift.exercise.trim() }
  writeAll([next, ...readAll().filter((item) => item.id !== lift.id)])
  return next
}

export function deleteRm(id: string) {
  writeAll(readAll().filter((lift) => lift.id !== id))
  deleteRmHistory(id)
}

export function replaceRms(lifts: unknown[]) {
  writeAll(lifts.map(normalizeRmLift).filter((lift): lift is RmLift => lift != null))
}
