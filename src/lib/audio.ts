let audioCtx: AudioContext | null = null

function getCtx() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioCtor) return null
  if (!audioCtx) audioCtx = new AudioCtor()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export function unlockAudio() {
  getCtx()
}

function playAt(
  ctx: AudioContext,
  freq: number,
  duration: number,
  gainValue: number,
  type: OscillatorType,
  when: number,
  hold = 0,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const attack = Math.min(0.03, duration * 0.08)
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(gainValue, when + attack)
  const sustainUntil = when + Math.max(attack, duration * hold)
  gain.gain.setValueAtTime(gainValue, sustainUntil)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + duration)
}

function tone(freq: number, duration: number, gainValue: number, type: OscillatorType = 'square') {
  const ctx = getCtx()
  if (!ctx) return
  playAt(ctx, freq, duration, gainValue, type, ctx.currentTime)
}

function doubleTone(freq: number, duration: number, gap: number, gainValue: number, type: OscillatorType) {
  const ctx = getCtx()
  if (!ctx) return
  const start = ctx.currentTime
  playAt(ctx, freq, duration, gainValue, type, start)
  playAt(ctx, freq, duration, gainValue, type, start + duration + gap)
}

function endHorn(duration = 3.2, freqs: [number, number] = [220, 330]) {
  const ctx = getCtx()
  if (!ctx) return
  const t = ctx.currentTime
  playAt(ctx, freqs[0], duration, 0.2, 'sawtooth', t, 0.78)
  playAt(ctx, freqs[1], duration, 0.12, 'square', t, 0.78)
}

export type BeepKind = 'tick' | 'warn' | 'go' | 'rest' | 'done' | 'shift'

export function beep(kind: BeepKind) {
  if (kind === 'tick') {
    tone(800, 0.15, 0.12, 'square')
    return
  }
  if (kind === 'warn') {
    doubleTone(1200, 0.08, 0.07, 0.14, 'square')
    return
  }
  if (kind === 'go') {
    tone(1100, 2.4, 0.16, 'square')
    return
  }
  if (kind === 'rest') {
    tone(392, 0.22, 0.12, 'sine')
    return
  }
  if (kind === 'shift') {
    endHorn(1, [370, 554])
    return
  }

  endHorn()
}
