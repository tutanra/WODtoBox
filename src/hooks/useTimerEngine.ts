import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { beep, unlockAudio } from '../lib/audio'
import { computeSnapshot } from '../lib/engine'
import { pulse } from '../lib/haptics'
import type { TimerConfig, TimerSnapshot } from '../types/timer'

export function useTimerEngine(config: TimerConfig, autoStart = true) {
  const [running, setRunning] = useState(autoStart)
  const [startedAt, setStartedAt] = useState<number | null>(() => (autoStart ? Date.now() : null))
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [pausedAccum, setPausedAccum] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [amrapRounds, setAmrapRounds] = useState(0)
  const [manualFinishMs, setManualFinishMs] = useState<number | null>(null)
  const lastCue = useRef<string>('')

  const started = startedAt != null
  const elapsedMs = startedAt == null ? 0 : (pausedAt ?? now) - startedAt - pausedAccum

  const snapshot = useMemo(
    () =>
      computeSnapshot(config, elapsedMs, {
        amrapRounds,
        manualFinishMs,
        started,
      }),
    [amrapRounds, config, elapsedMs, manualFinishMs, started],
  )

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 50)
    return () => window.clearInterval(id)
  }, [running])

  const start = useCallback(() => {
    unlockAudio()
    const t = Date.now()
    setStartedAt(t)
    setPausedAt(null)
    setPausedAccum(0)
    setRunning(true)
    setAmrapRounds(0)
    setManualFinishMs(null)
    lastCue.current = ''
    setNow(t)
  }, [])

  const pause = useCallback(() => {
    if (!running || pausedAt != null) return
    setPausedAt(Date.now())
    setRunning(false)
  }, [pausedAt, running])

  const resume = useCallback(() => {
    if (startedAt == null || pausedAt == null) return
    setPausedAccum((value) => value + (Date.now() - pausedAt))
    setPausedAt(null)
    setRunning(true)
    setNow(Date.now())
  }, [pausedAt, startedAt])

  const reset = useCallback(() => {
    setRunning(false)
    setStartedAt(null)
    setPausedAt(null)
    setPausedAccum(0)
    setAmrapRounds(0)
    setManualFinishMs(null)
    lastCue.current = ''
  }, [])

  const addRound = useCallback(() => {
    setAmrapRounds((value) => value + 1)
    void pulse('medium')
  }, [])

  const markFinish = useCallback(() => {
    const finishAt = Math.max(0, elapsedMs - config.prepareSeconds * 1000)
    setManualFinishMs(finishAt)
    setRunning(false)
    void pulse('heavy')
  }, [config.prepareSeconds, elapsedMs])

  useEffect(() => {
    fireCues(snapshot, lastCue, config.kind)
  }, [config.kind, snapshot])

  return {
    snapshot,
    running,
    paused: pausedAt != null,
    elapsedMs,
    start,
    pause,
    resume,
    reset,
    addRound,
    markFinish,
  }
}

function fireCues(
  snapshot: TimerSnapshot,
  lastCue: { current: string },
  kind: TimerConfig['kind'],
) {
  if (snapshot.phase === 'idle') return

  const remainSec = Math.ceil(Math.max(0, snapshot.remainingMs) / 1000)
  const displaySec = Math.ceil(snapshot.displayMs / 1000)
  const key = `${snapshot.phase}:${snapshot.round}:${remainSec}:${displaySec}:${snapshot.finishedReason ?? ''}`
  if (key === lastCue.current) return

  const prev = lastCue.current
  lastCue.current = key
  const intervalShift = kind === 'tabata' || kind === 'intervals'

  if (snapshot.phase === 'finished') {
    beep('done')
    void pulse('heavy')
    return
  }

  if (!prev) {
    if (snapshot.phase === 'work') {
      beep('go')
      void pulse('heavy')
    }
    return
  }

  const [prevPhase, prevRoundRaw] = prev.split(':')
  const prevRound = Number(prevRoundRaw)

  if (snapshot.phase === 'prepare' && snapshot.warning) {
    beep('tick')
    void pulse('light')
    return
  }

  if (snapshot.phase === 'work' && prevPhase === 'prepare') {
    beep('go')
    void pulse('heavy')
    return
  }

  if (snapshot.phase === 'work' && prevPhase === 'rest') {
    beep(intervalShift ? 'shift' : 'go')
    void pulse('medium')
    return
  }

  if (snapshot.phase === 'rest' && prevPhase === 'work') {
    beep(intervalShift ? 'shift' : 'rest')
    void pulse('light')
    return
  }

  if (snapshot.phase === 'work' && snapshot.round > prevRound) {
    beep('go')
    void pulse('medium')
    return
  }

  if (snapshot.phase === 'work' && prevPhase === 'work' && remainSec === 10) {
    beep('warn')
    void pulse('light')
  }
}
