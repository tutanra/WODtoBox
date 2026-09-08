import { isRetiredPlanTemplateId } from './retiredPlanIds'
import { normalizeProgram, type Program } from '../types/program'

const KEY = 'wodtobox.programs'

function readAll(): Program[] {
  const raw = localStorage.getItem(KEY)
  let programs: Program[] = []
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        programs = parsed.map(normalizeProgram).filter((program): program is Program => program != null)
      }
    } catch {
      programs = []
    }
  }

  const kept = programs.filter((program) => !isRetiredPlanTemplateId(program.id))
  if (kept.length !== programs.length) {
    writeAll(kept)
    programs = kept
  }
  return programs.sort((a, b) => b.updatedAt - a.updatedAt)
}

function writeAll(programs: Program[]) {
  localStorage.setItem(KEY, JSON.stringify(programs))
}

export function listPrograms() {
  return readAll()
}

export function getProgram(id: string) {
  return readAll().find((program) => program.id === id) ?? null
}

export function saveProgram(program: Program) {
  if (isRetiredPlanTemplateId(program.id)) return program
  const next: Program = { ...program, updatedAt: Date.now() }
  writeAll([next, ...readAll().filter((item) => item.id !== program.id)])
  return next
}

export function deleteProgram(id: string) {
  writeAll(readAll().filter((program) => program.id !== id))
}

export function replacePrograms(programs: unknown[]) {
  writeAll(
    programs
      .map(normalizeProgram)
      .filter((program): program is Program => program != null)
      .filter((program) => !isRetiredPlanTemplateId(program.id)),
  )
}
