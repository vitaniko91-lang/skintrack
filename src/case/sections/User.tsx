import { JOURNEY, PERSONA } from '../content'
import { CaseSection } from '../ui/CaseSection'
import { GLASS, LABEL } from '../ui/glass'

const SCREEN_NAMES = { route: 'Build a route', slope: 'Read the slope', group: 'Check the group', warning: 'Get warned once' } as const

export function User() {
  return (
    <CaseSection id="user" index={2} accent="One" label="tourer" title="One tourer, one day, five moments.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_1fr]">
        <article className={`${GLASS} p-7 max-md:p-5`}>
          <p className={LABEL}>Persona</p>
          <h3 className="mt-3 leading-[0.9]">
            <span className="font-serif text-[3rem] italic text-cyan-hot">{PERSONA.name},</span>{' '}
            <span className="font-mono text-[2rem] font-medium tabular-nums text-white">{PERSONA.age}</span>
          </h3>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">{PERSONA.role}</p>
          <p className="mt-5 leading-relaxed text-body/90">{PERSONA.background}</p>
          <h4 className={`mt-7 ${LABEL}`}>Wants</h4>
          <ul className="mt-3 space-y-2">{PERSONA.goals.map((g) => <li key={g} className="flex gap-3"><span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-cyan" />{g}</li>)}</ul>
          <h4 className={`mt-7 ${LABEL}`}>Frustrated by</h4>
          <ul className="mt-3 space-y-2">{PERSONA.frustrations.map((f) => <li key={f} className="flex gap-3"><span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full border border-muted" />{f}</li>)}</ul>
          <p className="mt-7 border-t border-white/10 pt-4 text-sm text-muted">{PERSONA.disclaimer}</p>
        </article>

        {/*
          Колонки дневника: 2 с sm, 3 при xl (делит место с персоной — 5 узких колонок при
          1280px дали бы меньше 120px текста), 5 — только с 2xl.
        */}
        <ol aria-label="Journey" className={`${GLASS} grid gap-px overflow-hidden !bg-white/[0.09] p-0 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5`}>
          {JOURNEY.map((j, i) => (
            <li key={j.stage} className="flex flex-col gap-3 bg-[linear-gradient(170deg,rgb(14_30_40/0.96),rgb(5_11_16/0.97))] p-6 sm:last:col-span-2 2xl:last:col-span-1">
              <span className="font-serif text-[2.6rem] italic leading-none text-cyan">0{i + 1}</span>
              <h3 className="caps-wide text-[15px] font-extrabold uppercase tracking-[0.02em] text-white">{j.stage}</h3>
              <p className="text-[15px] leading-snug">{j.doing}</p>
              <p className="font-serif text-[19px] italic leading-snug text-cyan-hot/90">“{j.thinking}”</p>
              <p className="mt-auto border-t border-white/10 pt-3 text-[14px] leading-snug text-body/85">
                {j.product}
                {j.screen && <span className="mt-2 block font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cyan">Screen · {SCREEN_NAMES[j.screen]}</span>}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </CaseSection>
  )
}
