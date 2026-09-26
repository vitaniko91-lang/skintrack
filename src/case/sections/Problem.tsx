import { PROBLEM, STATS } from '../content'
import { CaseSection } from '../ui/CaseSection'
import { StatFigure } from '../ui/StatFigure'

export function Problem() {
  return (
    <CaseSection id="problem" index={1} label="Problem" title={PROBLEM.title}>
      <p className="max-w-2xl text-xl text-muted [text-wrap:pretty]">{PROBLEM.body}</p>
      <div className="mt-16 grid gap-10 md:grid-cols-3">
        {STATS.map((s) => <StatFigure key={s.label} stat={s} />)}
      </div>
    </CaseSection>
  )
}
