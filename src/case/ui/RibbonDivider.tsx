import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../../lib/env'

/** Слои ленты — те же, что у манифеста на сайте продукта: ореол, свечение, ядро. */
const STROKES: [number, string][] = [[22, 'rgba(92,232,255,0.14)'], [9, 'rgba(92,232,255,0.4)'], [3, '#E8FDFF']]
const H = 140

/** Серпантин скинтрека поперёк страницы: два плавных поворота, зеркально через раз. */
export function dividerPath(w: number, flip: boolean): string {
  const f = (n: number) => n.toFixed(1)
  const y = (v: number) => (flip ? H - v : v)
  return `M${f(-20)},${f(y(96))} C${f(w * 0.22)},${f(y(96))} ${f(w * 0.3)},${f(y(34))} ${f(w * 0.5)},${f(y(40))} S${f(w * 0.78)},${f(y(104))} ${f(w + 20)},${f(y(58))}`
}

/**
 * Тонкая светящаяся лента между главами кейса. Прорисовывается по скроллу;
 * при reduced motion (или ?static) — сразу целиком, без движения.
 */
export function RibbonDivider({ flip = false }: { flip?: boolean }) {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = svg.current!
    const paths = Array.from(root.querySelectorAll('path'))
    const head = root.querySelector('circle')!
    const core = paths[paths.length - 1]
    let k = 0
    const draw = (v: number) => {
      k = v
      // jsdom (тесты) не считает геометрию SVG
      if (typeof core.getTotalLength !== 'function') return
      const L = core.getTotalLength() || 1
      for (const p of paths) p.style.strokeDasharray = `${v * L} ${L * 2}`
      const q = core.getPointAtLength(v * L)
      head.setAttribute('cx', q.x.toFixed(1)); head.setAttribute('cy', q.y.toFixed(1))
      head.style.opacity = v > 0.01 && v < 0.995 ? '1' : '0'
    }
    const build = () => {
      const w = root.clientWidth || 1
      root.setAttribute('viewBox', `0 0 ${w} ${H}`)
      const d = dividerPath(w, flip)
      for (const p of paths) p.setAttribute('d', d)
      draw(k)
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(build) : null
    ro?.observe(root)
    build()
    if (prefersReducedMotion()) { draw(1); return () => ro?.disconnect() }
    // регистрация здесь, а не при импорте: в тестах matchMedia подменяется позже импорта
    gsap.registerPlugin(ScrollTrigger)
    const st = ScrollTrigger.create({ trigger: root, start: 'top 92%', end: 'bottom 35%', scrub: 0.6, onUpdate: (s) => draw(s.progress) })
    return () => { st.kill(); ro?.disconnect() }
  }, [flip])

  return (
    <div aria-hidden className="pointer-events-none relative -my-10 overflow-hidden">
      <svg ref={svg} className="block h-[140px] w-full overflow-visible">
        {STROKES.map(([w, c], i) => <path key={i} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" style={{ strokeDasharray: '0 1e5' }} />)}
        <circle r="5" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px #5CE8FF)', opacity: 0 }} />
      </svg>
    </div>
  )
}
