const LINK = 'inline-flex h-14 items-center gap-2 rounded-full px-7 text-base font-semibold transition-[scale,box-shadow] duration-200 active:scale-[0.97]'

export function Finale() {
  return (
    <section aria-labelledby="finale-title" className="relative overflow-hidden px-4 pt-32 md:px-10 md:pt-48">
      <div className="relative z-10 max-w-3xl">
        <h2
          id="finale-title"
          className="text-[clamp(2.75rem,7vw,6.5rem)] font-bold leading-[0.92] tracking-[-0.02em]"
          style={{ fontStretch: '115%' }}
        >
          Plan the line.<br />Then ski it.
        </h2>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#prototype" className={`${LINK} bg-accent text-ground`}>Try the prototype</a>
          <a href="./case.html" className={`${LINK} text-body ring-1 ring-line hover:ring-accent/60`}>
            How it was designed <span aria-hidden className="icon-[lucide--arrow-right] size-4" />
          </a>
        </div>
      </div>
      <p
        data-watermark
        aria-hidden="true"
        className="pointer-events-none mt-24 select-none whitespace-nowrap text-[clamp(4rem,15vw,18rem)] font-extrabold lowercase leading-[0.78] tracking-[-0.04em] text-accent/[0.07]"
        style={{ fontStretch: '125%' }}
      >
        skintrack
      </p>
    </section>
  )
}
