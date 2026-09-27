import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gearRibbonPath, tiltFor } from './chapterMath'

/** Мокапы вордмарка (docs/portfolio/skintrack/gear/, провенанс там же): Ч/Б фото + циановый вордмарк. */
const ITEMS = [
  { src: './gear/gear-1.webp', key: 'helmet', label: 'Helmet', alt: 'A ski helmet with a mirrored visor, the lowercase skintrack wordmark printed across its shell.', cls: 'col-span-5 row-span-2', pos: 'object-[50%_35%]', depth: 0.6 },
  { src: './gear/gear-4.webp', key: 'watch', label: 'Watch face', alt: 'A sports watch on a wrist showing the skintrack ascent screen: 1,240 m climbed.', cls: 'col-span-7', pos: 'object-[50%_42%]', depth: 1 },
  { src: './gear/gear-2.webp', key: 'bottle', label: 'Bottle', alt: 'A matte insulated bottle standing in snow, the skintrack wordmark running vertically down its side.', cls: 'col-span-3', pos: 'object-[50%_45%]', depth: 1.4 },
  { src: './gear/gear-3.webp', key: 'beanie', label: 'Beanie', alt: 'A ribbed knit beanie with a woven skintrack patch on the cuff, against snowy branches.', cls: 'col-span-4', pos: 'object-[50%_50%]', depth: 0.9 },
] as const

/** Три слоя, как у ленты манифеста: широкий ореол, свечение, светлое ядро. Ореол шире щели —
 * заходит на кромку карточек на 3 px, до содержимого фото не достаёт. */
const STROKES: [number, string][] = [[30, 'rgba(92,232,255,0.16)'], [14, 'rgba(92,232,255,0.42)'], [5, '#E8FDFF']]

/**
 * Глава 05 · Gear (RideOn, борды брендинга): карточки-фото разного размера со скруглением 40,
 * наклон за курсором, появление по скроллу; лента проходит по щелям между карточками
 * и уходит вниз — к финалу.
 */
export function Gear({ reduced = false }: { reduced?: boolean }) {
  const section = useRef<HTMLElement>(null)
  const grid = useRef<HTMLUListElement>(null)
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = svg.current!
    const paths = Array.from(root.querySelectorAll('path'))
    const core = paths[paths.length - 1]
    const cards = Array.from(grid.current!.querySelectorAll<HTMLElement>('[data-card]'))
    let L = 1, want = 0, last = -1, wide = innerWidth >= 768

    const build = () => {
      wide = innerWidth >= 768
      root.style.display = wide ? '' : 'none'
      if (!wide) return
      const s = { width: section.current!.clientWidth, height: section.current!.clientHeight }
      // раскладка без transform: при refresh карточки ещё сдвинуты входной анимацией (y 120, scale 0.94),
      // и getBoundingClientRect уводил ленту на карточки
      const ul = grid.current!
      const r = cards.map((c) => { const li = c.parentElement!; return { x: ul.offsetLeft + li.offsetLeft, y: ul.offsetTop + li.offsetTop, w: li.offsetWidth, h: li.offsetHeight } })
      const d = gearRibbonPath(r, s.width, s.height)
      // слой ленты — только по её габариту: перерисовка штриха на всю ширину доски стоила кадров
      const x0 = Math.min(r[0].x + r[0].w, r[2].x + r[2].w) - 40
      const x1 = Math.max(r[1].x, r[3].x) + 40
      root.style.left = `${x0}px`; root.style.width = `${x1 - x0}px`
      root.setAttribute('viewBox', `${x0.toFixed(0)} 0 ${(x1 - x0).toFixed(0)} ${s.height.toFixed(0)}`)
      for (const p of paths) p.setAttribute('d', d)
      L = core.getTotalLength()
      last = -1
      draw(want)
    }
    function draw(k: number) {
      want = k
      if (!wide || Math.abs(k - last) < 0.0005) return
      last = k
      for (const p of paths) p.style.strokeDasharray = `${k * L} ${L * 2}`
    }

    if (reduced) {
      const on = () => { build(); draw(1) }
      const t = setTimeout(on, 60)
      addEventListener('resize', on)
      return () => { clearTimeout(t); removeEventListener('resize', on) }
    }

    // наклон за курсором: rotate на внутреннем слое, чтобы не спорить с параллаксом обёртки
    const offs = cards.map((card) => {
      const move = (e: PointerEvent) => {
        const b = card.getBoundingClientRect()
        const { rx, ry } = tiltFor((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, 8)
        card.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`
      }
      const leave = () => { card.style.transform = '' }
      card.addEventListener('pointermove', move)
      card.addEventListener('pointerleave', leave)
      return () => { card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', leave) }
    })

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const wrap = card.parentElement!
        // вход: карточка поднимается и раскрывается из скругления побольше
        gsap.fromTo(wrap, { y: 120, opacity: 0, scale: 0.94 }, {
          y: 0, opacity: 1, scale: 1, ease: 'power3.out', duration: 1,
          scrollTrigger: { trigger: wrap, start: 'top 92%', end: 'top 55%', scrub: 0.6 },
        })
        // параллакс по глубине — разные скорости дают «доску» с глубиной
        gsap.fromTo(card.querySelector('img'), { yPercent: -6 * ITEMS[i].depth }, {
          yPercent: 6 * ITEMS[i].depth, ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        })
      })
      gsap.fromTo('[data-g="label"] > *', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: section.current, start: 'top 80%', end: 'top 40%', scrub: 0.6 },
      })
      ScrollTrigger.create({
        trigger: section.current, start: 'top 70%', end: 'bottom 60%', scrub: 0.7,
        onUpdate: (self) => draw(self.progress), onRefresh: build,
      })
    }, section)
    document.fonts.ready.then(build)
    addEventListener('resize', build)
    return () => { ctx.revert(); offs.forEach((f) => f()); removeEventListener('resize', build) }
  }, [reduced])

  return (
    <section ref={section} id="chapter-05" aria-labelledby="gear-h" className="relative bg-ground px-[4vw] pb-[16svh] pt-[14svh] max-md:px-4 max-md:py-20">
      <div data-g="label" className="relative z-10 flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <div>
          <div className="flex items-baseline gap-4">
            <span className="font-serif text-[clamp(3.5rem,7vw,7.5rem)] italic leading-none text-cyan">05</span>
            <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">Chapter · of 06</span>
          </div>
          <h2 id="gear-h" className="mt-2 leading-[0.86]">
            <span className="block font-serif text-[clamp(3rem,6.4vw,7rem)] italic text-cyan-hot [text-shadow:0_0_40px_rgb(92_232_255/0.45)]">The</span>
            <span className="caps-wide block text-[clamp(2.4rem,5.4vw,5.8rem)] font-extrabold uppercase tracking-[-0.03em] text-white">gear</span>
          </h2>
        </div>
        <p className="max-w-[34ch] pb-3 text-[17px] leading-relaxed text-body/85 max-md:text-[15px]">
          One lowercase wordmark, on the things you actually carry up the skin track. <span className="text-muted">Brand mockups.</span>
        </p>
      </div>

      <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[2] h-full w-full overflow-visible">
        {STROKES.map(([w, c], i) => <path key={i} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" style={{ strokeDasharray: '0 1e5' }} />)}
      </svg>

      <ul ref={grid} className="relative z-[1] mt-14 grid grid-cols-12 grid-rows-[repeat(2,min(46svh,520px))] gap-6 max-md:mt-10 max-md:grid-cols-1 max-md:grid-rows-none max-md:gap-4">
        {ITEMS.map((it) => (
          <li key={it.key} className={`${it.cls} will-change-[transform,opacity] max-md:col-span-1 max-md:row-span-1 max-md:aspect-[4/5]`}>
            <figure data-card className="group relative h-full overflow-hidden rounded-[40px] bg-ground-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-transform duration-200 ease-out will-change-transform max-md:rounded-[28px]">
              <img src={it.src} alt={it.alt} loading="lazy" decoding="async" className={`h-[112%] w-full -translate-y-[6%] object-cover will-change-transform ${it.pos}`} />
              <figcaption className="absolute bottom-4 left-4 flex h-9 items-center gap-2 rounded-full bg-[rgb(4_8_12/0.72)] px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-body backdrop-blur-md">
                <span aria-hidden className="size-1.5 rounded-full bg-cyan" />{it.label}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="relative z-10 mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Mockups on photos by Imad Clicks, Natalia García Prieto, Özgür Beşli, Atlantic Ambience / Pexels
      </p>
    </section>
  )
}
