import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { arcLut, hermite } from './layout'
import { finalePhases } from './chapterMath'
import { formatRouteStats, useRouteStats } from '../terrain/routeSummary'
import { initialState } from '../prototype/machine'
import { DEFAULT_CONDITIONS } from '../prototype/conditions'
import { PhoneFrame } from '../prototype/PhoneFrame'
import { FigureContext } from '../prototype/figureContext'
import { RouteScreen } from '../prototype/RouteScreen'

const W = [640, 1280, 2048]
const set = (ext: string) => W.map((w) => `./photo/hero-${w}.${ext} ${w}w`).join(', ')
const WORD = 'skintrack'
const noop = () => {}

/**
 * Глава 06 · финал (RideOn «Thanks»): карточка-фото с телефоном в наклоне, лента влетает
 * сверху и ведёт по вордмарку — её голова открывает контур букв, буквы заливаются,
 * лента втягивается в них. Кнопки: прототип (#try) и кейс (./case.html).
 */
export function Finale({ reduced = false }: { reduced?: boolean }) {
  const section = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const fillSvg = useRef<SVGSVGElement>(null)
  const ribbonSvg = useRef<SVGSVGElement>(null)
  const ui = useRef<HTMLDivElement>(null)
  const phone = useRef<HTMLDivElement>(null)
  const stats = useRouteStats()
  const rows = stats ? formatRouteStats(stats) : []

  useEffect(() => {
    const root = svg.current!
    const outline = root.querySelector<SVGTextElement>('text')!
    const fill = fillSvg.current!.querySelector<SVGTextElement>('text')!
    const rs = ribbonSvg.current!
    const [glow, core] = Array.from(rs.querySelectorAll<SVGPathElement>('[data-ribbon]'))
    const head = rs.querySelector('circle')!
    const clip = root.querySelector('clipPath rect')!
    let L = 1, lut: [number, number][] = [], wm = { x: 0, y: 0, w: 0, h: 0 }, last = -1, want = 0

    const build = () => {
      const fitEl = phone.current?.querySelector<HTMLElement>('[data-fit]')
      if (fitEl) fitEl.style.scale = String(Math.min(1, (innerHeight * 0.66) / 822))
      // раскладочные размеры, без transform карточки (она масштабируется при входе)
      const c = card.current!
      const r = { left: c.offsetLeft, top: c.offsetTop, width: c.offsetWidth, height: c.offsetHeight, bottom: c.offsetTop + c.offsetHeight }
      const host = { left: 0, top: 0, width: root.clientWidth || c.parentElement!.clientWidth, height: c.parentElement!.clientHeight }
      const pad = Math.max(16, r.width * 0.025)
      // кегль подбирается так, чтобы слово заняло ширину карточки
      for (const t of [outline, fill]) t.setAttribute('font-size', '200')
      const len = fill.getComputedTextLength() || 1
      const fs = (200 * (r.width - pad * 2)) / len
      const x = r.left - host.left + pad
      const base = r.bottom - host.top - Math.max(14, r.height * 0.035)
      for (const t of [outline, fill]) { t.setAttribute('font-size', fs.toFixed(1)); t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', base.toFixed(1)) }
      const h = fs * 0.74 // высота строчных с выносными — по Archivo
      wm = { x, y: base - h, w: r.width - pad * 2, h }
      const cy = base - fs * 0.3
      const d = hermite([
        // входит сверху между подписью и телефоном, проходит над словом влево,
        // делает крюк у первой буквы и ведёт по строке — текст главы не пересекает
        { x: host.width * 0.53, y: -host.height * 0.1, tx: -0.05, ty: 1 },
        { x: host.width * 0.42, y: wm.y - fs * 0.1, tx: -1, ty: 0.12 },
        { x: wm.x - fs * 0.14, y: cy - fs * 0.05, tx: 0, ty: 1, k: 0.9 },
        { x: wm.x + wm.w * 0.36, y: cy - fs * 0.12, tx: 1, ty: -0.05 },
        { x: wm.x + wm.w * 0.72, y: cy + fs * 0.06, tx: 1, ty: 0.05 },
        { x: wm.x + wm.w + fs * 0.05, y: cy - fs * 0.1, tx: 1, ty: -0.4 },
      ])
      for (const p of [glow, core]) p.setAttribute('d', d)
      ;({ L, pts: lut } = arcLut(d, 300))
      for (const el of [root, fillSvg.current!, rs]) el.setAttribute('viewBox', `0 0 ${host.width.toFixed(0)} ${host.height.toFixed(0)}`)
      last = -1
      draw(want)
    }
    const at = (k: number) => {
      const f = k * 300, i = Math.min(Math.floor(f), 299), t = f - i
      return [lut[i][0] + (lut[i + 1][0] - lut[i][0]) * t, lut[i][1] + (lut[i + 1][1] - lut[i][1]) * t]
    }
    function draw(r: number) {
      want = r
      if (!lut.length || Math.abs(r - last) < 0.0004) return
      last = r
      const ph = finalePhases(r)
      const vis = Math.max(ph.draw - ph.erase, 0)
      for (const p of [glow, core]) {
        p.style.strokeDasharray = `${vis * L} ${L * 2}`
        p.style.strokeDashoffset = `${-ph.erase * L}`
        p.style.opacity = vis > 0.001 ? '1' : '0'
      }
      const [hx, hy] = at(ph.draw)
      head.setAttribute('cx', hx.toFixed(1)); head.setAttribute('cy', hy.toFixed(1))
      head.style.opacity = ph.draw > 0 && ph.draw < 1 ? '1' : '0'
      // контур букв открывается там, где уже прошла голова ленты
      const reveal = ph.draw >= 1 ? wm.w + wm.x + 40 : Math.max(hx, wm.x - 20)
      clip.setAttribute('x', String(wm.x - 40)); clip.setAttribute('y', String(wm.y - wm.h))
      clip.setAttribute('width', Math.max(0, reveal - wm.x + 40).toFixed(1)); clip.setAttribute('height', String(wm.h * 3))
      fillSvg.current!.style.opacity = ph.fill.toFixed(3)
      outline.style.opacity = (1 - ph.fill * 0.55).toFixed(3)
      if (ui.current) { ui.current.style.opacity = ph.ui.toFixed(3); ui.current.style.transform = `translate3d(0,${((1 - ph.ui) * 28).toFixed(1)}px,0)` }
    }

    if (reduced) {
      const on = () => { build(); draw(1) }
      document.fonts.ready.then(on)
      addEventListener('resize', on)
      return () => removeEventListener('resize', on)
    }

    const ctx = gsap.context(() => {
      // масштаб, а не clip-path: композитится без перерисовки большого фото
      gsap.fromTo(card.current, { scale: 0.86, yPercent: 8 }, {
        scale: 1, yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'top 45%', scrub: 0.6 },
      })
      gsap.fromTo(card.current!.querySelector('img'), { scale: 1.2 }, {
        scale: 1.04, ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      })
      gsap.fromTo(phone.current, { yPercent: 40, rotate: -4, opacity: 0 }, {
        yPercent: 0, rotate: 0, opacity: 1, ease: 'power2.out',
        scrollTrigger: { trigger: section.current, start: 'top 60%', end: 'top top', scrub: 0.6 },
      })
      ScrollTrigger.create({
        trigger: section.current, start: 'top 45%', end: 'bottom bottom', scrub: 0.7,
        onUpdate: (self) => draw(self.progress), onRefresh: build,
      })
    }, section)
    document.fonts.ready.then(() => { build(); ScrollTrigger.refresh() })
    addEventListener('resize', build)
    return () => { ctx.revert(); removeEventListener('resize', build) }
  }, [reduced])

  return (
    <section ref={section} id="chapter-06" aria-labelledby="finale-h" className={`relative bg-ground ${reduced ? 'h-svh min-h-[720px]' : 'h-[230vh]'}`}>
      <div className="sticky top-0 h-svh min-h-[640px] overflow-hidden">
        <div ref={card} className="absolute inset-x-[2vw] inset-y-[3svh] overflow-hidden rounded-[48px] will-change-transform max-md:inset-x-3 max-md:rounded-[32px]">
          <picture>
            <source type="image/avif" srcSet={set('avif')} sizes="100vw" />
            <img
              src="./photo/hero-1280.webp"
              srcSet={set('webp')}
              sizes="100vw"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[28%_40%] will-change-transform"
            />
          </picture>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(2_16_22/0.92)_0%,rgb(2_16_22/0.55)_38%,rgb(2_16_22/0.2)_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgb(2_16_22/0.8)_0%,rgb(2_16_22/0.35)_42%,transparent_65%)]" />
        </div>

        {/* телефон в наклоне поверх карточки и вордмарка (RideOn: телефон на руле) */}
        <div ref={phone} aria-hidden className="pointer-events-none absolute will-change-transform right-[7vw] top-[6svh] z-20 max-lg:hidden">
          <div data-fit className="w-[390px] origin-top-right [transform:perspective(1600px)_rotateY(-16deg)_rotateX(6deg)_rotateZ(9deg)]">
          <div className="rounded-[52px] bg-[linear-gradient(150deg,#2a3a44,#0b141b_45%,#1a2730)] p-[11px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),0_0_90px_-10px_rgb(92_232_255/0.4),0_60px_100px_-30px_rgb(0_0_0/0.9)]">
            <div inert>
              <FigureContext value={true}>
                <PhoneFrame conditions={DEFAULT_CONDITIONS} variant="figure">
                  <RouteScreen state={{ ...initialState('route'), routeBuilt: true }} dispatch={noop} stats={rows.length ? rows : [{ label: 'max slope', value: '38°' }]} reduced />
                </PhoneFrame>
              </FigureContext>
            </div>
          </div>
          </div>
        </div>

        <div className="absolute left-[calc(2vw+4vw)] top-[calc(3svh+6svh)] z-10 max-w-[560px] max-md:left-7 max-md:right-7 max-md:top-[calc(3svh+2rem)]">
          <div className="flex items-baseline gap-4">
            <span className="font-serif text-[clamp(3rem,5vw,5.5rem)] italic leading-none text-cyan">06</span>
            <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">Chapter · of 06</span>
          </div>
          <h2 id="finale-h" className="mt-2 leading-[0.9]">
            <span className="mb-[0.12em] block font-serif text-[clamp(2.6rem,5vw,5.2rem)] italic text-cyan-hot [text-shadow:0_0_40px_rgb(92_232_255/0.45)]">See you</span>
            <span className="caps-wide block text-[clamp(1.8rem,3.4vw,3.6rem)] font-extrabold uppercase tracking-[-0.03em] text-white">up there</span>
          </h2>
          <div ref={ui} className="mt-7 has-[:focus-visible]:!translate-y-0 has-[:focus-visible]:!opacity-100">
            <p className="max-w-[40ch] text-[17px] leading-relaxed text-body/90 max-md:text-[15px]">
              The prototype is live. Every number in it comes from real terrain — and every decision behind it is written down.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 max-md:flex-col">
              <a href="#try" className="group flex h-14 items-center gap-3 rounded-full bg-cyan pl-6 pr-2 text-[16px] font-semibold text-ink shadow-[0_0_40px_-6px_rgb(92_232_255/0.7)] transition-colors duration-200 hover:bg-cyan-hot max-md:justify-between">
                Try the prototype
                <span className="grid size-10 place-items-center rounded-full bg-ink text-cyan transition-transform duration-300 ease-[var(--ease-expo)] group-hover:translate-x-1">
                  <span aria-hidden className="icon-[lucide--arrow-up] size-5" />
                </span>
              </a>
              <a href="./case.html" className="flex h-14 items-center gap-2 rounded-full border border-white/25 bg-[rgb(4_8_12/0.55)] px-6 text-[16px] font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:border-cyan hover:text-cyan-hot max-md:justify-center">
                How it was designed <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* три слоя: контур (клип меняется), заливка (только opacity — свой слой, без перерисовки), лента */}
        <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          <defs>
            <clipPath id="fin-reveal"><rect x="0" y="0" width="0" height="0" /></clipPath>
          </defs>
          <text data-wm className="wordmark" fill="none" stroke="#B8F7FF" strokeWidth="1.6" clipPath="url(#fin-reveal)">{WORD}</text>
        </svg>
        <svg ref={fillSvg} aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible will-change-[opacity]" style={{ opacity: 0 }}>
          <text data-wm className="wordmark" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 30px rgb(92 232 255 / 0.35))' }}>{WORD}</text>
        </svg>
        <svg ref={ribbonSvg} aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          <path data-ribbon fill="none" stroke="rgb(92 232 255 / 0.35)" strokeWidth="20" strokeLinecap="round" />
          <path data-ribbon fill="none" stroke="#E8FDFF" strokeWidth="5" strokeLinecap="round" />
          <circle r="8" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 10px #5CE8FF)', opacity: 0 }} />
        </svg>
        <p className="sr-only">skintrack</p>
      </div>
    </section>
  )
}
