import { useCallback, useEffect, useRef, useState } from 'react'
import { beep, unlockAudio } from '../lib/audio'
import { pulse } from '../lib/haptics'

export function useRestTimer(initialSeconds = 150) {
  const [duration, setDurationState] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const finished = useRef(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 50)
    return () => window.clearInterval(id)
  }, [running])

  const remainingMs = running && endsAt != null ? Math.max(0, endsAt - now) : duration * 1000

  useEffect(() => {
    if (!running || remainingMs > 0 || finished.current) return
    finished.current = true
    setRunning(false)
    setEndsAt(null)
    beep('done')
    void pulse('heavy')
  }, [remainingMs, running])

  const start = useCallback(() => {
    unlockAudio()
    finished.current = false
    const ms = duration * 1000
    setEndsAt(Date.now() + ms)
    setNow(Date.now())
    setRunning(true)
    beep('rest')
    void pulse('medium')
  }, [duration])

  const setDuration = useCallback((seconds: number) => {
    setDurationState(seconds)
    if (running) {
      finished.current = false
      setEndsAt(Date.now() + seconds * 1000)
      setNow(Date.now())
    }
  }, [running])

  const stop = useCallback(() => {
    setRunning(false)
    setEndsAt(null)
    finished.current = false
  }, [])

  return {
    duration,
    setDuration,
    running,
    remainingMs,
    start,
    stop,
  }
}
