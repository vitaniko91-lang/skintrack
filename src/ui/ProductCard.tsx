const DANGER = ['', 'low', 'moderate', 'considerable', 'high', 'very high'] as const

export interface Stat { label: string; value: string }

export function ProductCard({ title, stats, danger }: { title: string; stats: Stat[]; danger?: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <article className="rounded-[var(--radius-card)] bg-ground-1/90 p-5 backdrop-blur-sm ring-1 ring-line w-[min(20rem,86vw)]">
      <h3 className="text-xl font-bold tracking-[-0.02em]" style={{ fontStretch: '115%' }}>{title}</h3>
      {stats.length > 0 && (
        <dl className="mt-4 flex gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">{s.label}</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {danger && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ground-2 px-3 py-1.5 text-sm">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: ['', '#cce3a5', '#ffe45c', '#f79a2e', '#e3342f', '#2b1d1d'][danger] }} />
          Danger {danger} · {DANGER[danger]}
        </p>
      )}
    </article>
  )
}
