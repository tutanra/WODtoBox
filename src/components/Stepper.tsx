interface StepperProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 99,
  step = 1,
  format = String,
  onChange,
}: StepperProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-3">
      <p className="mb-2 text-center text-xs font-semibold tracking-[0.22em] text-mute uppercase">
        {label}
      </p>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="h-12 w-12 rounded-full bg-panel-2 text-2xl text-paper disabled:opacity-30"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <p className="min-w-16 text-center font-timer text-5xl font-bold leading-none text-paper">
          {format(value)}
        </p>
        <button
          type="button"
          className="h-12 w-12 rounded-full bg-panel-2 text-2xl text-paper disabled:opacity-30"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          +
        </button>
      </div>
    </div>
  )
}
