interface ToggleRowProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-line bg-panel px-4 py-4 text-left"
    >
      <span>
        <span className="block font-semibold text-paper">{label}</span>
        {hint ? <span className="text-sm text-mute">{hint}</span> : null}
      </span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-flame' : 'bg-panel-2'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-paper transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </button>
  )
}
