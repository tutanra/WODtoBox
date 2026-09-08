import { PLAN_SHARE_FORMAT } from '../types/pack'
import { newId, normalizeProgram, type Program } from '../types/program'
import { shareFilename, shareOrDownloadFile } from './shareFile'

export interface WodtoboxPlanFile {
  format: typeof PLAN_SHARE_FORMAT
  schemaVersion: 1
  exportedAt: number
  program: Program
}

export function buildPlanShare(program: Program): WodtoboxPlanFile {
  return {
    format: PLAN_SHARE_FORMAT,
    schemaVersion: 1,
    exportedAt: Date.now(),
    program,
  }
}

export function parsePlanShare(value: unknown): WodtoboxPlanFile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.format !== PLAN_SHARE_FORMAT || raw.schemaVersion !== 1) return null
  const program = normalizeProgram(raw.program)
  if (!program) return null
  return {
    format: PLAN_SHARE_FORMAT,
    schemaVersion: 1,
    exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : 0,
    program,
  }
}

export function parsePlanShareText(text: string): WodtoboxPlanFile | null {
  try {
    return parsePlanShare(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

export function copyImportedProgram(program: Program): Program {
  const now = Date.now()
  return {
    ...program,
    id: newId(),
    seeded: false,
    createdAt: now,
    updatedAt: now,
    weeks: program.weeks.map((week) => ({
      ...week,
      id: newId(),
      days: week.days.map((day) => ({
        ...day,
        id: newId(),
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          id: newId(),
          sets: exercise.sets.map((set) => ({ ...set, id: newId() })),
        })),
      })),
    })),
  }
}

export async function exportPlanFile(program: Program) {
  const json = `${JSON.stringify(buildPlanShare(program), null, 2)}\n`
  const file = new File([json], shareFilename(program.name || 'plan'), { type: 'application/json' })
  await shareOrDownloadFile(file)
}
