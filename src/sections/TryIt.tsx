import { MonoLabel } from '../ui/MonoLabel'
import { Prototype } from '../prototype/Prototype'

export function TryIt() {
  return (
    <section id="prototype" aria-labelledby="try-title" className="px-4 py-24 md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <MonoLabel>Prototype · 4 screens</MonoLabel>
        <h2
          id="try-title"
          className="mt-3 max-w-2xl text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[0.95] tracking-[-0.02em] [text-wrap:balance]"
          style={{ fontStretch: '115%' }}
        >
          Try the morning of a tour.
        </h2>
        <div className="mt-12">
          <Prototype />
        </div>
      </div>
    </section>
  )
}
