import { forwardRef } from 'react'

const WORD = 'skintrack'

/** Гигантский вордмарк строчными по фото (RideOn). Каждая буква — отдельный span для сборки. */
export const Wordmark = forwardRef<HTMLHeadingElement>(function Wordmark(_, ref) {
  return (
    <h1
      ref={ref}
      aria-label="skintrack"
      className="wordmark pointer-events-none absolute bottom-[-0.6vw] left-[2.4vw] z-30 origin-top-left select-none text-[21.9vw] text-white max-md:bottom-[calc(1rem+172px)] max-md:text-[22vw]"
    >
      <span aria-hidden className="block [clip-path:inset(-60%_-8%_-2%_-8%)]">
        {WORD.split('').map((c, i) => (
          <span key={i} data-letter className="inline-block will-change-transform">{c}</span>
        ))}
      </span>
    </h1>
  )
})
