export const PACK_FORMAT = 'wodtobox.pack' as const
export const LEGACY_PACK_FORMAT = 'wodplanning.pack' as const

export interface WodtoboxPack {
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

export function isPackFormat(value: unknown): value is typeof PACK_FORMAT | typeof LEGACY_PACK_FORMAT {
  return value === PACK_FORMAT || value === LEGACY_PACK_FORMAT
}
