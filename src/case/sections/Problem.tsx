import { PROBLEM, STATS } from '../content'
import { CaseSection } from '../ui/CaseSection'
import { StatFigure } from '../ui/StatFigure'

export function Problem() {
  return (
    <CaseSection id="problem" index={1} accent="The" label="problem" title={PROBLEM.title}>
      <p className="max-w-[60ch] text-[19px] leading-relaxed text-body/85 [text-wrap:pretty] max-md:text-[17px]">{PROBLEM.body}</p>
      <div className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10 max-md:mt-14">
        {STATS.map((s, i) => <StatFigure key={s.label} stat={s} index={i} />)}
      </div>
    </CaseSection>
  )
}
