import type { Decision } from '../content'
import { SourceRef } from './SourceRef'

/**
 * Таблица вариантов по design-rationale.md: Option / UX / Dev cost / Risk.
 * На узком экране прокручивается по горизонтали — регион фокусируемый, чтобы
 * прокрутка работала и с клавиатуры.
 */
export function TradeoffTable({ decision }: { decision: Decision }) {
  const captionId = `${decision.id}-caption`
  return (
    <div role="region" aria-label={`${decision.title} — options`} tabIndex={0} className="overflow-x-auto rounded-[var(--radius-card)] ring-1 ring-line">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <caption id={captionId} className="sr-only">{decision.title}</caption>
        <thead>
          <tr className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            {['Option', 'UX', 'Dev cost', 'Risk'].map((h) => (
              <th key={h} scope="col" className="px-5 py-4 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {decision.options.map((o) => {
            const chosen = o.id === decision.chosen
            return (
              <tr key={o.id} className={`border-t border-line align-top ${chosen ? 'bg-ground-1' : ''}`}>
                <th scope="row" className="w-[22%] px-5 py-5 font-semibold">
                  {o.name}
                  {chosen && (
                    <span className="mt-2 block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-accent">Chosen</span>
                  )}
                </th>
                <td className="px-5 py-5 text-body">
                  {o.ux} {o.sourceId && <SourceRef sourceId={o.sourceId} />}
                </td>
                <td className="px-5 py-5 font-mono tabular-nums">{o.cost}</td>
                <td className="px-5 py-5 text-muted">{o.risk}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
