import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { manifestoPath } from './layout'
import { span, easeOut } from './stage'

const W = [640, 1280, 2048, 2880]
/** WebP — фолбэк для браузеров без AVIF, поэтому без 2880: бюджет страницы важнее резкости на редком пути. */
const WEBP_W = W.filter((w) => w <= 2048)
const set = (ext: string, ws = W) => ws.map((w) => `./photo/manifesto-${w}.${ext} ${w}w`).join(', ')

/** Запас холста сверху и снизу: слой ленты едет вместе с фразой, края не должны открываться. */
const PAD = 160
/** Слои ленты: широкое свечение → ядро. */
const STROKES: [number, string][] = [[26, 'rgba(92,232,255,0.16)'], [12, 'rgba(92,232,255,0.4)'], [5, '#E8FDFF']]

/** Фраза по словам; accent — курсивная антиква в циане. */
const LINES: { text: string; accent?: boolean }[][] = [
  [{ text: 'Every' }, { text: 'slope' }, { text: 'has' }, { text: 'a' }, { text: 'number.' }],
  [{ text: 'Know it', accent: true }, { text: 'before' }, { text: 'you’re' }],
  [{ text: 'standing' }, { text: 'on' }, { text: 'it.' }],
]

/**
 * Глава 03 · манифест. Фото во всю ширину раскрывается из скруглённой карточки
 * (обратный ход главы 01), гигантская фраза загорается по словам, 2D-лента
 * входит сверху, огибает фразу (над ней, слева, под ней — буквы не пересекает) и уходит вниз — к главе 04.
 */
export function Manifesto({ reduced = false }: { reduced?: boolean }) {
  const section = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const phrase = useRef<HTMLParagraphElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // лента рисуется в 2D-canvas: пунктирная перерисовка SVG на весь экран стоила ~20 fps
    const cv = canvas.current!
    const c2 = cv.getContext('2d')!
    const probe = svg.current!.querySelector('path')!
    const words = Array.from(phrase.current!.querySelectorAll<HTMLElement>('[data-w]'))
    let L = 1, path = new Path2D(), dpr = 1, cw = 0, ch = 0, scale = 1
    const lut: [number, number][] = []
    const lit: string[] = []
    let lastK = -1, want = 0
    const build = () => {
      // геометрия без transform фразы: петля строится вокруг слова в исходном положении,
      // а сдвиг фразы по скроллу переносится на весь слой ленты (follow)
      const host = cv.parentElement!
      cw = host.clientWidth; ch = host.clientHeight
      scale = cw < 768 ? 0.55 : 1
      dpr = Math.min(devicePixelRatio || 1, 2)
      cv.width = Math.round(cw * dpr); cv.height = Math.round((ch + PAD * 2) * dpr)
      // габарит всей фразы по словам (строки nowrap могут вылезать за ширину <p>)
      const p = phrase.current!
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const w of words) {
        x0 = Math.min(x0, w.offsetLeft); y0 = Math.min(y0, w.offsetTop)
        x1 = Math.max(x1, w.offsetLeft + w.offsetWidth); y1 = Math.max(y1, w.offsetTop + w.offsetHeight)
      }
      const box = { x: p.offsetLeft + x0, y: p.offsetTop + y0, w: x1 - x0, h: y1 - y0 }
      const d = manifestoPath(cw, ch, box)
      probe.setAttribute('d', d)
      path = new Path2D(d)
      L = probe.getTotalLength()
      lut.length = 0
      for (let i = 0; i <= 400; i++) { const q = probe.getPointAtLength((i / 400) * L); lut.push([q.x, q.y]) }
      lastK = -1
      draw(want)
    }
    const follow = () => { cv.style.transform = `translate3d(0,${(Number(gsap.getProperty(phrase.current, 'y')) - PAD).toFixed(1)}px,0)` }
    function draw(k: number) {
      want = k
      if (Math.abs(k - lastK) < 0.0005) return
      lastK = k
      c2.setTransform(dpr, 0, 0, dpr, 0, PAD * dpr)
      c2.clearRect(0, -PAD, cw, ch + PAD * 2)
      if (k <= 0.001) return
      c2.lineCap = 'round'
      c2.setLineDash([k * L, L * 2])
      for (const [w, col] of STROKES) { c2.lineWidth = w * scale; c2.strokeStyle = col; c2.stroke(path) }
      if (k < 0.999) {
        const f = k * 400, i = Math.min(Math.floor(f), 399), t = f - i
        const x = lut[i][0] + (lut[i + 1][0] - lut[i][0]) * t, y = lut[i][1] + (lut[i + 1][1] - lut[i][1]) * t
        const R = 22 * scale, g = c2.createRadialGradient(x, y, 0, x, y, R)
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.36, 'rgba(92,232,255,0.8)'); g.addColorStop(1, 'rgba(92,232,255,0)')
        c2.fillStyle = g
        c2.beginPath(); c2.arc(x, y, R, 0, Math.PI * 2); c2.fill()
      }
    }
    const light = (r: number) => {
      // слова загораются по очереди: 0.08 → 0.7 прогресса главы
      words.forEach((w, i) => {
        const k = span(r, 0.08 + (i / words.length) * 0.56, 0.08 + ((i + 1.4) / words.length) * 0.56).toFixed(2)
        if (lit[i] !== k) { lit[i] = k; w.style.setProperty('--lit', k) }
      })
    }

    if (reduced) {
      const on = () => { build(); follow(); draw(1); light(1) }
      document.fonts.ready.then(on)
      addEventListener('resize', on)
      return () => removeEventListener('resize', on)
    }

    const ctx = gsap.context(() => {
      // вход: фото раскрывается из скруглённой карточки, пока глава въезжает снизу
      gsap.fromTo(frame.current, { clipPath: 'inset(9% 7% 9% 7% round 48px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'top top', scrub: 0.6 },
      })
      gsap.fromTo(img.current, { scale: 1.48, yPercent: -3 }, {
        scale: 1.3, yPercent: 2, ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      })
      gsap.fromTo(hud.current, { yPercent: 60 }, {
        yPercent: -60, ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      })
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current, start: 'top 35%', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true,
          onRefresh: build,
        },
        onUpdate() {
          const r = tl.progress()
          light(r)
          follow()
          draw(easeOut(span(r, 0, 0.92)))
        },
      })
      tl.to({}, { duration: 1 })
      tl.fromTo(phrase.current, { y: 90 }, { y: -40, ease: 'none', duration: 1 }, 0)
      tl.fromTo('[data-m="label"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12 }, 0)
    }, section)
    document.fonts.ready.then(() => { build(); ScrollTrigger.refresh() })
    addEventListener('resize', build)
    return () => { ctx.revert(); removeEventListener('resize', build) }
  }, [reduced])

  return (
    <section ref={section} id="chapter-03" aria-labelledby="manifesto-h" className={`relative bg-ground ${reduced ? 'h-svh min-h-[640px]' : 'h-[320vh]'}`}>
      <div className="sticky top-0 h-svh min-h-[640px] overflow-hidden">
        <div ref={frame} className="absolute inset-0 overflow-hidden">
          <picture>
            <source type="image/avif" srcSet={set('avif')} sizes="100vw" />
            <img
              ref={img}
              src="./photo/manifesto-1280.webp"
              srcSet={set('webp', WEBP_W)}
              sizes="100vw"
              alt="A line of six ski tourers skins uphill across a wide snowfield below sunlit peaks in the Lyngen Alps."
              loading="lazy"
              decoding="async"
              className="h-full w-full origin-[62%_30%] object-cover object-[60%_45%] [transform:scale(1.3)] max-md:origin-[70%_72%] max-md:object-[72%_60%]"
            />
          </picture>
          {/* чернила слева и снизу — под белой фразой держат контраст AA, справа фото остаётся цветом */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(20deg,rgb(2_16_22/0.85)_0%,rgb(2_16_22/0.55)_28%,transparent_55%)] max-md:bg-[linear-gradient(to_top,rgb(2_16_22/0.92)_0%,rgb(2_16_22/0.7)_50%,rgb(2_16_22/0.1)_85%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_34%_at_36%_66%,rgb(2_16_22/0.82),rgb(2_16_22/0.45)_60%,transparent_100%)] max-md:hidden" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] bg-[linear-gradient(to_bottom,rgb(2_16_22/0.88),rgb(2_16_22/0.5)_55%,transparent)]" />
        </div>

        <div data-m="label" className="absolute left-[5vw] top-[12svh] z-10 flex items-baseline gap-4 max-md:left-4 max-md:top-[10svh]">
          <span className="font-serif text-[clamp(3rem,5vw,5.5rem)] italic leading-none text-cyan">03</span>
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted max-md:hidden">Chapter · of 06</span>
          <span className="font-serif text-[clamp(1.6rem,2.4vw,2.6rem)] italic text-cyan-hot">The</span>
          <span className="caps-wide -ml-2 text-[clamp(1.2rem,1.9vw,2rem)] font-extrabold uppercase tracking-[-0.02em] text-white">manifesto</span>
        </div>

        <h2 id="manifesto-h" className="sr-only">Every slope has a number. Know it before you’re standing on it.</h2>
        <p
          ref={phrase}
          aria-hidden
          className="manifesto absolute bottom-[14svh] left-[5vw] z-10 max-w-[16ch] text-[clamp(2.6rem,7.4vw,8.6rem)] font-semibold leading-[0.95] tracking-[-0.045em] max-md:bottom-[12svh] max-md:left-4 max-md:right-4"
        >
          {LINES.map((line, li) => (
            <span key={li} className="block whitespace-nowrap max-md:whitespace-normal">
              {line.map((w, wi) => (
                <span key={wi}>
                  {w.accent ? (
                    <span data-w className="accent font-serif font-normal italic tracking-[-0.01em]">{w.text}</span>
                  ) : (
                    <span data-w>{w.text}</span>
                  )}
                  {wi < line.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
          ))}
        </p>

        <div ref={hud} className="absolute right-[6vw] top-[22svh] z-10 w-[268px] rounded-[26px] border border-white/15 bg-[rgb(4_8_12/0.82)] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_30px_60px_-24px_rgb(0_0_0/0.8)] max-md:hidden" aria-hidden>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Slope ahead · 120 m</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-[48px] font-bold leading-[0.85] tracking-[-0.04em] tabular-nums text-body">38°</p>
            <span className="mb-1 flex items-center gap-2 text-[14px] font-medium text-body">
              <span className="grid size-6 place-items-center rounded-md bg-danger-3 text-[13px] font-bold text-ink">3</span>considerable
            </span>
          </div>
        </div>

        <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] w-full will-change-transform" style={{ height: `calc(100% + ${PAD * 2}px)` }} />
        <svg ref={svg} aria-hidden className="invisible absolute h-0 w-0"><path /></svg>

        <p className="absolute bottom-4 right-[5vw] z-10 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 max-md:right-4">
          Photo · Hendrik Morkel / Unsplash
        </p>
      </div>
    </section>
  )
}
