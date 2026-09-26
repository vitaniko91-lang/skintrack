import { JOURNEY, PERSONA } from '../content'
import { CaseSection } from '../ui/CaseSection'

const SCREEN_NAMES = { route: 'Build a route', slope: 'Read the slope', group: 'Check the group', warning: 'Get warned once' } as const

export function User() {
  return (
    <CaseSection id="user" index={2} label="User" title="One tourer, one day, five moments.">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <article className="rounded-[var(--radius-card)] bg-ground-1 p-6 ring-1 ring-line">
          <h3 className="text-2xl font-bold" style={{ fontStretch: '115%' }}>{PERSONA.name}, {PERSONA.age}</h3>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted">{PERSONA.role}</p>
          <p className="mt-4">{PERSONA.background}</p>
          <h4 className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">Wants</h4>
          <ul className="mt-2 space-y-1">{PERSONA.goals.map((g) => <li key={g}>{g}</li>)}</ul>
          <h4 className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">Frustrated by</h4>
          <ul className="mt-2 space-y-1">{PERSONA.frustrations.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="mt-6 text-sm text-muted">{PERSONA.disclaimer}</p>
        </article>

        <ol aria-label="Journey" className="grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-line ring-1 ring-line md:grid-cols-5">
          {JOURNEY.map((j, i) => (
            <li key={j.stage} className="flex flex-col gap-3 bg-ground p-5">
              <span className="font-mono text-xs tabular-nums text-accent">0{i + 1}</span>
              <h3 className="text-lg font-semibold">{j.stage}</h3>
              <p className="text-sm">{j.doing}</p>
              <p className="text-sm italic text-muted">“{j.thinking}”</p>
              <p className="mt-auto border-t border-line pt-3 text-sm">
                {j.product}
                {j.screen && <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">Screen · {SCREEN_NAMES[j.screen]}</span>}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </CaseSection>
  )
}
