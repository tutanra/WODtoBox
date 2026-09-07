import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface TopBarProps {
  title: string
  backTo?: string
  onBack?: () => void
  right?: string
  action?: ReactNode
  className?: string
}

export function TopBar({ title, backTo = '/', onBack, right, action, className = '' }: TopBarProps) {
  return (
    <header className={`mb-6 flex items-center gap-3 ${className}`}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-paper"
          aria-label="Volver"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : (
        <Link
          to={backTo}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-paper"
          aria-label="Volver"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      )}
      <h1 className="flex-1 font-display text-4xl leading-none tracking-wide text-paper">{title}</h1>
      {action ? action : right ? <span className="text-xs font-semibold tracking-[0.2em] text-mute">{right}</span> : null}
    </header>
  )
}
