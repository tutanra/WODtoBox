import { PROGRAM_TEMPLATES, buildTemplate } from '../data/templates'
import type { Program } from '../types/program'

const KEY = 'wodplanning.programs'

function isProgram(value: unknown): value is Program {
  if (!value || typeof value !== 'object') return false
  const program = value as Program
  return typeof program.id === 'string' && Array.isArray(program.weeks)
}

function readAll(): Program[] {
  const raw = localStorage.getItem(KEY)
  let programs: Program[] = []
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) programs = parsed.filter(isProgram)
    } catch {
      programs = []
    }
  }

  let changed = false
  for (const template of PROGRAM_TEMPLATES) {
    if (!programs.some((program) => program.id === template.id)) {
      programs = [template.build(), ...programs]
      changed = true
    }
  }
  if (changed) writeAll(programs)
  return programs.sort((a, b) => Number(b.seeded) - Number(a.seeded) || b.updatedAt - a.updatedAt)
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
  const next: Program = { ...program, updatedAt: Date.now() }
  writeAll([next, ...readAll().filter((item) => item.id !== program.id)])
  return next
}

export function deleteProgram(id: string) {
  writeAll(readAll().filter((program) => program.id !== id))
}

export function restoreTemplate(id: string) {
  const fresh = buildTemplate(id)
  if (!fresh) return null
  return saveProgram(fresh)
}
