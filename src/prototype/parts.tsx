import type { ReactNode } from 'react'

/** Кнопки телефона: 56 px в высоту — палец в перчатке, не курсор. */
const BASE = 'inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-[scale,background-color,box-shadow] duration-200 active:scale-[0.97] disabled:opacity-60'

export function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${BASE} bg-accent text-ground`}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${BASE} text-body ring-1 ring-line hover:ring-accent/60`}>
      {children}
    </button>
  )
}

export function ScreenShell({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-baseline justify-between px-5 pb-3 pt-2">
        <h3 className="text-xl font-bold tracking-[-0.02em]" style={{ fontStretch: '115%' }}>{title}</h3>
        <span className="font-mono text-xs tabular-nums text-muted">{index}/4</span>
      </header>
      {children}
    </div>
  )
}

export function StatRow({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <dl className="flex justify-between gap-4">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">{s.label}</dt>
          <dd className="font-mono text-2xl font-semibold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}
