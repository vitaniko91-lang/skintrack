import type { Decision } from '../content'
import { SourceRef } from './SourceRef'
import { GLASS } from './glass'

/**
 * Таблица вариантов по design-rationale.md: Option / UX / Dev cost / Risk — в стеклянной панели.
 * На узком экране прокручивается по горизонтали — регион фокусируемый, чтобы
 * прокрутка работала и с клавиатуры.
 */
export function TradeoffTable({ decision }: { decision: Decision }) {
  const captionId = `${decision.id}-caption`
  return (
    <>
      {/* Ниже md таблица шире экрана: без подсказки «Dev cost» и «Risk» просто не видны. */}
      <p aria-hidden className="mb-3 flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted md:hidden">
        Swipe for cost and risk <span className="icon-[lucide--arrow-right] size-3.5" />
      </p>
      <div role="region" aria-label={`${decision.title} — options`} tabIndex={0} className={`${GLASS} overflow-x-auto`}>
        <table className="w-full min-w-[42rem] table-fixed border-collapse text-left text-[15px]">
          <caption id={captionId} className="sr-only">{decision.title}</caption>
          {/* Одна сетка колонок на все три таблицы — иначе «Dev cost» гуляет от таблицы к таблице. */}
          <colgroup>
            <col className="w-[22%]" />
            <col />
            <col className="w-32" />
            <col className="w-[26%]" />
          </colgroup>
          <thead>
            <tr className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
              {['Option', 'UX', 'Dev cost', 'Risk'].map((h) => (
                <th key={h} scope="col" className="whitespace-nowrap px-6 py-4 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decision.options.map((o) => {
              const chosen = o.id === decision.chosen
              return (
                <tr key={o.id} className={`border-t border-white/10 align-top ${chosen ? 'bg-[linear-gradient(90deg,rgb(92_232_255/0.14),rgb(92_232_255/0.03))] shadow-[inset_3px_0_0_var(--color-cyan)]' : ''}`}>
                  <th scope="row" className={`px-6 py-5 font-semibold ${chosen ? 'text-white' : 'text-body/90'}`}>
                    {o.name}
                    {chosen && (
                      <span className="mt-2 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cyan">
                        <span aria-hidden className="icon-[lucide--check] size-3.5" />Chosen
                      </span>
                    )}
                  </th>
                  <td className="px-6 py-5 leading-relaxed text-body">
                    {o.ux} {o.sourceId && <SourceRef sourceId={o.sourceId} />}
                  </td>
                  <td className="px-6 py-5 font-mono tabular-nums text-white">{o.cost}</td>
                  <td className="px-6 py-5 leading-relaxed text-muted">{o.risk}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
