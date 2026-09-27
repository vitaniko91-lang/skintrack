import { forwardRef, type ReactNode } from 'react'

interface Props {
  id?: string
  num?: string
  accent?: string
  caps?: string
  body?: ReactNode
  children?: ReactNode
  className?: string
}

/** «01 · Read the slope» в манере Orlina: номер, курсивная антиква, широкий капс. */
export const ChapterLabel = forwardRef<HTMLDivElement, Props>(function ChapterLabel({
  id = 'chapter-01', num = '01', accent = 'Read', caps = 'the slope',
  body = <>Every pitch is shaded by its angle. The track bends around the 38° couloir where it can — and tells you where it can’t.</>,
  children, className = 'left-[5vw] top-1/2 w-[min(44vw,640px)] -translate-y-1/2 max-md:inset-x-4 max-md:top-auto max-md:bottom-8 max-md:w-auto max-md:translate-y-0',
}, ref) {
  return (
    <div ref={ref} id={id} className={`pointer-events-none absolute z-10 ${className}`}>
      <div className="flex items-baseline gap-4">
        <span data-ch="num" className="font-serif text-[clamp(3.5rem,7vw,7.5rem)] italic leading-none text-cyan">{num}</span>
        <span data-ch="kicker" className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">Chapter · of 06</span>
      </div>
      <h2 className="mt-2 leading-[0.86]">
        <span data-ch="read" className="block font-serif text-[clamp(3.5rem,8vw,8.5rem)] italic text-cyan-hot [text-shadow:0_0_40px_rgb(92_232_255/0.45)]">{accent}</span>
        <span className="caps-wide block text-[clamp(2.4rem,5.4vw,5.8rem)] font-extrabold uppercase tracking-[-0.03em] text-white [clip-path:inset(-10%_-5%_0_-5%)]">
          {caps.split('').map((c, i) => (
            <span key={i} data-ch="caps" className="inline-block whitespace-pre">{c}</span>
          ))}
        </span>
      </h2>
      {body && <p data-ch="body" className="mt-6 max-w-[34ch] text-[17px] leading-relaxed text-body/85 max-md:text-[15px]">{body}</p>}
      {children ?? (
        <dl data-ch="stats" className="mt-6 flex gap-8 font-mono text-[12px] uppercase tracking-[0.14em] text-muted max-md:hidden">
          <div><dt>Distance</dt><dd className="mt-1 text-2xl font-medium tabular-nums text-white">3.18 km</dd></div>
          <div><dt>Gain</dt><dd className="mt-1 text-2xl font-medium tabular-nums text-white">+1,000 m</dd></div>
          <div><dt>Max</dt><dd className="mt-1 text-2xl font-medium tabular-nums text-cyan">38°</dd></div>
        </dl>
      )}
    </div>
  )
})
