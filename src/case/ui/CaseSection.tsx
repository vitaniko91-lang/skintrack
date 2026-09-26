import type { ReactNode } from 'react'
import { MonoLabel } from '../../ui/MonoLabel'

export function CaseSection({ id, index, label, title, children }: {
  id: string; index: number; label: string; title: string; children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="px-4 py-20 md:px-10 md:py-32">
      <MonoLabel>{String(index).padStart(2, '0')} · {label}</MonoLabel>
      <h2
        id={`${id}-title`}
        className="mt-3 max-w-4xl text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.95] tracking-[-0.02em] [text-wrap:balance]"
        style={{ fontStretch: '115%' }}
      >
        {title}
      </h2>
      <div className="mt-12">{children}</div>
    </section>
  )
}
