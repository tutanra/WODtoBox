import type { ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
  className?: string
}

export function Screen({ children, className = '' }: ScreenProps) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${className}`}
    >
      {children}
    </div>
  )
}
