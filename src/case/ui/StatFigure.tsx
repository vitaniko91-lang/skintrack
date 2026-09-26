import type { Stat } from '../content'
import { SourceRef } from './SourceRef'

export function StatFigure({ stat }: { stat: Stat }) {
  return (
    <figure className="border-t border-line pt-6">
      <p className="font-mono text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-none tabular-nums">{stat.value}</p>
      <figcaption className="mt-4 max-w-xs text-lg text-muted">
        {stat.label} <SourceRef sourceId={stat.sourceId} />
      </figcaption>
    </figure>
  )
}
