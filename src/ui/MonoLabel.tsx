import type { ReactNode } from 'react'

export function MonoLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-accent">{children}</span>
}
