import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { stage, span } from './stage'

/** Размер кадра, в котором сняты точки (hero-1280.*). */
const IMG_W = 1280
const IMG_H = 853
const POS_X = 0.28 // object-position 28% 50% — как у <img> в HeroPhoto
const POS_Y = 0.5

/** Ботинок переднего лыжника в кадре 1280×853 (сетка по assets-src/hero.jpg). */
export const BOOT_IMG: readonly [number, number] = [400, 698]

/** Пиксель кадра → пиксель экрана с учётом object-fit: cover и текущего transform <img>. */
export function imageToScreen(r: { left: number; top: number; width: number; height: number }, x: number, y: number) {
  const s = Math.max(r.width / IMG_W, r.height / IMG_H)
  const ox = (r.width - IMG_W * s) * POS_X
  const oy = (r.height - IMG_H * s) * POS_Y
  return [r.left + ox + x * s, r.top + oy + y * s] as const
}

/**
 * Одна дуга от ботинка к точке эстафеты: стартует вверх-вправо (подъём), а в конце
 * идёт ровно по экранной касательной 3D-ленты — стык без излома.
 */
export function arcPath(B: readonly [number, number], S: readonly [number, number], tan: readonly [number, number]): string {
  const dx = S[0] - B[0], dy = S[1] - B[1]
  const dist = Math.hypot(dx, dy) || 1
  const a = 0.62 * Math.sign(dx || 1)
  const ux = dx / dist, uy = dy / dist
  const r0 = [ux * Math.cos(a) + uy * Math.sin(a), -ux * Math.sin(a) + uy * Math.cos(a)]
  const k = dist * 0.38
  const c1 = [B[0] + r0[0] * k, B[1] + r0[1] * k]
  const c2 = [S[0] - tan[0] * k, S[1] - tan[1] * k]
  const f = (n: number) => n.toFixed(1)
  return `M${f(B[0])},${f(B[1])} C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(S[0])},${f(S[1])}`
}

/**
 * 2D-штрих поверх фото: одной дугой от ботинка к экранной точке, где из темноты
 * выходит 3D-лента (рисуется 0.02–0.3), затем стирается с хвоста (0.36–0.56).
 */
export function TrackStroke({ imgSelector }: { imgSelector: string }) {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = svg.current!
    const [glow, core] = Array.from(root.querySelectorAll('path'))
    const head = root.querySelector('circle')!
    let idle = false
    let last = ''
    const tick = () => {
      const img = document.querySelector(imgSelector) as HTMLElement | null
      if (!img) return
      const p = stage.p
      const drawn = span(p, 0.02, 0.3), erased = span(p, 0.36, 0.56)
      // вне окна эстафеты (и до 0.02 / после стирания) штриха нет — не трогаем DOM:
      // полноэкранный SVG с блюром иначе растрится каждый кадр
      const empty = drawn - erased <= 0 && !(drawn > 0 && drawn < 1)
      if (!(p > 0.0005 && p < 0.6) || !stage.rReady || empty) {
        if (!idle) { root.style.visibility = 'hidden'; idle = true }
        return
      }
      if (idle) { root.style.visibility = 'visible'; idle = false }
      const B = imageToScreen(img.getBoundingClientRect(), BOOT_IMG[0], BOOT_IMG[1])
      const d = arcPath(B, [stage.rx, stage.ry], [stage.rdx, stage.rdy])
      const key = `${d}|${p.toFixed(4)}`
      if (key === last) return // ничего не сдвинулось — не перерисовываем SVG
      last = key
      let L = 0
      for (const el of [glow, core]) {
        el.setAttribute('d', d)
        L = el.getTotalLength()
        const vis = Math.max(drawn - erased, 0) * L
        el.style.strokeDasharray = `${vis} ${L * 2}`
        el.style.strokeDashoffset = `${-erased * L}`
        el.style.opacity = vis > 0.5 ? '1' : '0'
      }
      const show = drawn > 0 && drawn < 1
      if (show) { const q = core.getPointAtLength(drawn * L); head.setAttribute('cx', q.x.toFixed(1)); head.setAttribute('cy', q.y.toFixed(1)) }
      head.style.opacity = show ? '1' : '0'
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [imgSelector])

  return (
    <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-0 z-[35] h-full w-full overflow-visible">
      <path fill="none" stroke="rgb(92 232 255 / 0.42)" strokeWidth="16" strokeLinecap="round" opacity="0" />
      <path fill="none" stroke="#E8FDFF" strokeWidth="5" strokeLinecap="round" opacity="0" />
      <circle r="7" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px #5CE8FF) drop-shadow(0 0 20px #5CE8FF)' }} opacity="0" />
    </svg>
  )
}
