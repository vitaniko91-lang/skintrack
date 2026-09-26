import { DECISIONS } from '../content'
import { CaseSection } from '../ui/CaseSection'
import { TradeoffTable } from '../ui/TradeoffTable'

const LABEL = 'font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted'

export function Decisions() {
  return (
    <CaseSection id="decisions" index={3} label="Decisions" title="Three decisions, each with what it cost.">
      <div className="space-y-24">
        {DECISIONS.map((d, i) => {
          const chosen = d.options.find((o) => o.id === d.chosen)!
          return (
            <article key={d.id} aria-labelledby={`${d.id}-h`}>
              <p className="font-mono text-xs tabular-nums text-accent">3.{i + 1}</p>
              <h3 id={`${d.id}-h`} className="mt-2 text-3xl font-bold tracking-[-0.02em]" style={{ fontStretch: '115%' }}>{d.title}</h3>
              <p className="mt-4 max-w-2xl text-lg text-muted [text-wrap:pretty]">{d.context}</p>
              <div className="mt-8"><TradeoffTable decision={d} /></div>
              <div className="mt-8 grid gap-8 md:grid-cols-3">
                <div>
                  <p className={LABEL}>Chose · {chosen.name}</p>
                  <p className="mt-2">{d.why}</p>
                </div>
                <div>
                  <p className={LABEL}>Tradeoffs accepted</p>
                  <ul className="mt-2 space-y-2">{d.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
                <div>
                  <p className={LABEL}>Revisit if</p>
                  <p className="mt-2">{d.revisit}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </CaseSection>
  )
}
