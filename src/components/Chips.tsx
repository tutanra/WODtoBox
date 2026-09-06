interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
        active ? 'bg-flame text-ink' : 'bg-panel-2 text-paper'
      }`}
    >
      {label}
    </button>
  )
}

import type { ReactNode } from 'react'

interface ChipRowProps {
  children: ReactNode
}

export function ChipRow({ children }: ChipRowProps) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}
