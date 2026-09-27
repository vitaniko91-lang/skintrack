import type { Stat } from '../content'
import { SourceRef } from './SourceRef'

/** Цифра из источника — крупным моно в циане со свечением (как 38° на сайте продукта). */
export function StatFigure({ stat, index }: { stat: Stat; index: number }) {
  return (
    <figure className="border-t border-cyan/25 pt-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted tabular-nums">Fig. 0{index + 1}</p>
      <p className="mt-3 font-mono text-[clamp(4rem,8.4vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.04em] text-cyan tabular-nums [text-shadow:0_0_48px_rgb(92_232_255/0.45)]">{stat.value}</p>
      <figcaption className="mt-5 max-w-[30ch] text-[17px] leading-relaxed text-body/85 [text-wrap:pretty]">
        {stat.label} <SourceRef sourceId={stat.sourceId} />
      </figcaption>
    </figure>
  )
}
