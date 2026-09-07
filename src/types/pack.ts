export const PACK_FORMAT = 'wodplanning.pack' as const

export interface WodPlanningPack {
  format: typeof PACK_FORMAT
  schemaVersion: 1
  exportedAt: number
  dataAt: number
  wods: unknown[]
  programs: unknown[]
  sessions: unknown[]
  history: unknown[]
  rms: unknown[]
}
