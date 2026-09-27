import { forwardRef } from 'react'

const W = [640, 1280, 2048]
const set = (ext: string) => W.map((w) => `./photo/hero-${w}.${ext} ${w}w`).join(', ')

/**
 * Полноэкранное фото в циановом дуотоне (scripts/duotone_cyan.py).
 * Нижний градиент в чернила — под белым вордмарком, чтобы тот держал контраст.
 */
export const HeroPhoto = forwardRef<HTMLDivElement, { className?: string }>(function HeroPhoto({ className = '' }, ref) {
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <picture>
        <source type="image/avif" srcSet={set('avif')} sizes="100vw" />
        <img
          data-photo-img
          src="./photo/hero-1280.webp"
          srcSet={set('webp')}
          sizes="100vw"
          alt="A ski tourer climbs a steep snow slope with skis strapped to his pack, above a wide white valley."
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[28%_50%]"
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(2_16_22/0.88)_0%,rgb(2_16_22/0.55)_36%,transparent_66%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgb(2_16_22/0.55),transparent)]" />
    </div>
  )
})
