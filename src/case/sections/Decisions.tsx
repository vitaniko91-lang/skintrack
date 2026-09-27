import { DECISIONS } from '../content'
import { CaseSection } from '../ui/CaseSection'
import { TradeoffTable } from '../ui/TradeoffTable'
import { LABEL } from '../ui/glass'

export function Decisions() {
  return (
    <CaseSection id="decisions" index={3} accent="Three" label="decisions" title="Three decisions, each with what it cost.">
      <div className="space-y-28 max-md:space-y-20">
        {DECISIONS.map((d, i) => {
          const chosen = d.options.find((o) => o.id === d.chosen)!
          return (
            <article key={d.id} aria-labelledby={`${d.id}-h`}>
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[clamp(1.5rem,2.2vw,2rem)] font-medium tabular-nums text-cyan">3.{i + 1}</span>
                <h3 id={`${d.id}-h`} className="caps-wide text-[clamp(1.4rem,2.4vw,2.2rem)] font-extrabold uppercase leading-[1] tracking-[-0.02em] text-white">{d.title}</h3>
              </div>
              <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-body/80 [text-wrap:pretty]">{d.context}</p>
              <div className="mt-9"><TradeoffTable decision={d} /></div>
              <div className="mt-9 grid gap-8 md:grid-cols-3 md:gap-10">
                <div className="border-t border-cyan/40 pt-4">
                  <p className={LABEL}>Chose · <span className="text-cyan">{chosen.name}</span></p>
                  <p className="mt-3 leading-relaxed">{d.why}</p>
                </div>
                <div className="border-t border-white/12 pt-4">
                  <p className={LABEL}>Tradeoffs accepted</p>
                  <ul className="mt-3 space-y-2 leading-relaxed">{d.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
                <div className="border-t border-white/12 pt-4">
                  <p className={LABEL}>Revisit if</p>
                  <p className="mt-3 font-serif text-[21px] italic leading-snug text-cyan-hot/90">{d.revisit}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </CaseSection>
  )
}
