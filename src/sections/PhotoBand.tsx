import { PHOTO } from '../content/photo'

const SIZES = '(min-width: 768px) calc(100vw - 5rem), calc(100vw - 2rem)'
const srcSet = (ext: 'avif' | 'webp') =>
  PHOTO.widths.map((w) => `./photo/${PHOTO.name}-${w}.${ext} ${w}w`).join(', ')

/** Пауза между 3D-сценой и прототипом: статичный кадр и одна фраза. Движения нет намеренно. */
export function PhotoBand() {
  return (
    <section aria-labelledby="manifesto" className="px-4 py-24 md:px-10 md:py-40">
      <figure>
        <picture>
          <source type="image/avif" srcSet={srcSet('avif')} sizes={SIZES} />
          <img
            src={`./photo/${PHOTO.name}-1280.webp`}
            srcSet={srcSet('webp')}
            sizes={SIZES}
            width={PHOTO.width}
            height={PHOTO.height}
            alt={PHOTO.alt}
            loading="lazy"
            decoding="async"
            className="h-[min(80vh,56rem)] w-full rounded-[40px] object-cover"
          />
        </picture>
        <figcaption className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          Photo · <a href={PHOTO.creditUrl} className="underline decoration-line underline-offset-4 hover:text-accent">{PHOTO.credit}</a> / Unsplash
        </figcaption>
      </figure>
      <h2
        id="manifesto"
        className="mt-16 max-w-5xl text-[clamp(2.25rem,6.5vw,6rem)] font-bold leading-[0.95] tracking-[-0.02em] [text-wrap:balance]"
        style={{ fontStretch: '115%' }}
      >
        Every slope has a number. <span className="text-muted">Know it before you’re standing on it.</span>
      </h2>
    </section>
  )
}
