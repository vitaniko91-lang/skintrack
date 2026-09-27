import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Prototype } from '../../prototype/Prototype'
import type { Shot } from '../sections/Screens'
import { inDevice } from './inDevice'

/**
 * Мобильная замена сетки телефонов: один телефон и вкладки над ним.
 * Паттерн WAI-ARIA Tabs: стрелки двигают выбор, Home/End — к краям, фокус ходит за выбором.
 */
export function ScreenSwitcher({ label, shots }: { label: string; shots: Shot[] }) {
  const [active, setActive] = useState(0)
  const base = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  const select = (i: number) => {
    const next = (i + shots.length) % shots.length
    setActive(next)
    tabs.current[next]?.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') select(active + 1)
    else if (e.key === 'ArrowLeft') select(active - 1)
    else if (e.key === 'Home') select(0)
    else if (e.key === 'End') select(shots.length - 1)
    else return
    e.preventDefault()
  }
  const shot = shots[active]

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex gap-2 overflow-x-auto pb-2">
        {shots.map((s, i) => (
          <button
            key={s.label}
            ref={(el) => { tabs.current[i] = el }}
            id={`${base}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${base}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className="min-h-10 shrink-0 rounded-full border border-white/12 bg-[rgb(10_20_28/0.6)] px-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted backdrop-blur-md transition-colors duration-200 aria-selected:border-cyan aria-selected:bg-cyan aria-selected:font-semibold aria-selected:text-ink"
          >
            {s.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="mt-6 flex flex-col items-center gap-3">
        <Prototype key={shot.label} variant="figure" label={shot.label} initial={shot.initial} conditions={shot.conditions} wrap={inDevice('', true)} />
        <p className="max-w-[24.375rem] text-center text-[15px] leading-snug text-body/75">{shot.note}</p>
      </div>
    </div>
  )
}
