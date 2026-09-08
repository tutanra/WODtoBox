import { defaultConfig, isTimerKind, normalizeTimerConfig, type TimerConfig } from '../types/timer'
import { normalizeWod, type Wod } from '../types/wod'

export interface RunSession {
  config: TimerConfig
  wod: Wod | null
  runId?: string
}

export function newRunId() {
  return crypto.randomUUID()
}

const SESSION_KEY = 'wodtobox.runSession'
const CONFIG_KEY = 'wodtobox.timerConfig'

function isTimerConfig(value: unknown): value is TimerConfig {
  if (!value || typeof value !== 'object') return false
  const config = value as TimerConfig
  return isTimerKind(config.kind) && typeof config.durationSeconds === 'number'
}

export function persistRunSession(session: RunSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  sessionStorage.setItem(CONFIG_KEY, JSON.stringify(session.config))
}

export function persistConfig(config: TimerConfig) {
  persistRunSession({ config, wod: null })
}

export function clearRunSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(CONFIG_KEY)
}

export function readPersistedConfig(): TimerConfig | null {
  return readRunSession()?.config ?? null
}

export function readRunSession(): RunSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && isTimerConfig((parsed as RunSession).config)) {
        const session = parsed as RunSession
        return {
          config: normalizeTimerConfig(session.config),
          wod: normalizeWod(session.wod),
          runId: typeof session.runId === 'string' ? session.runId : undefined,
        }
      }
    } catch {
      /* ignore */
    }
  }

  const legacy = sessionStorage.getItem(CONFIG_KEY)
  if (!legacy) return null
  try {
    const config = JSON.parse(legacy) as unknown
    return isTimerConfig(config) ? { config: normalizeTimerConfig(config), wod: null } : null
  } catch {
    return null
  }
}

export function parseRunState(state: unknown): RunSession | null {
  if (!state || typeof state !== 'object') return null
  const record = state as Record<string, unknown>
  const runId = typeof record.runId === 'string' ? record.runId : undefined
  if (isTimerConfig(record.config)) {
    return { config: normalizeTimerConfig(record.config), wod: normalizeWod(record.wod), runId }
  }
  if (isTimerConfig(record)) {
    return {
      config: { ...defaultConfig(record.kind), ...record },
      wod: normalizeWod(record.wod),
      runId,
    }
  }
  return null
}
