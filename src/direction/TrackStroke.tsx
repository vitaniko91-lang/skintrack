import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { stage, span } from './stage'

/** Размер кадра, в котором сняты точки (hero-1280.*). */
const IMG_W = 1280
const IMG_H = 853
const POS_X = 0.28 // object-position 28% 50% — как у <img> в HeroPhoto
const POS_Y = 0.5

/**
 * След бутпака на фото: от ботинка переднего лыжника вниз по траншее.
 * Точки сняты по кадру 1280×853 (сетка по assets-src/hero.jpg).
 */
export const TRACK_IMG: readonly [number, number][] = [
  [400, 698], [428, 718], [452, 742], [474, 768], [492, 792], [505, 812],
]

/** Пиксель кадра → пиксель экрана с учётом object-fit: cover и текущего transform <img>. */
export function imageToScreen(r: { left: number; top: number; width: number; height: number }, x: number, y: number) {
  const s = Math.max(r.width / IMG_W, r.height / IMG_H)
  const ox = (r.width - IMG_W * s) * POS_X
  const oy = (r.height - IMG_H * s) * POS_Y
  return [r.left + ox + x * s, r.top + oy + y * s] as const
}

function smoothPath(pts: readonly (readonly [number, number])[]): string {
  // Catmull-Rom → кубические Безье
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/**
 * 2D-штрих поверх фото: рисуется по следу в кадре (0–0.13), уходит из карточки-фото
 * мостом к экранной точке начала 3D-ленты (0.13–0.3), затем стирается с хвоста
 * (0.36–0.56) — эстафета переходит к 3D-ленте на горе.
 */
export function TrackStroke({ imgSelector }: { imgSelector: string }) {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = svg.current!
    const [glowA, coreA, glowB, coreB] = Array.from(root.querySelectorAll('path'))
    const head = root.querySelector('circle')!
    const set = (el: SVGPathElement, d: string, a: number, b: number) => {
      el.setAttribute('d', d)
      const L = el.getTotalLength()
      const vis = Math.max(b - a, 0) * L
      el.style.strokeDasharray = `${vis} ${L * 2}`
      el.style.strokeDashoffset = `${-a * L}`
      el.style.opacity = vis > 0.5 ? '1' : '0'
      return L
    }
    let idle = false
    const tick = () => {
      const img = document.querySelector(imgSelector) as HTMLElement | null
      if (!img) return
      const p = stage.p
      // вне окна эстафеты штрих невидим — не трогаем DOM, иначе SVG-блюр перерисовывается каждый кадр
      const inWindow = p > 0.0005 && p < 0.6
      if (!inWindow) {
        if (!idle) { root.style.visibility = 'hidden'; idle = true }
        return
      }
      if (idle) { root.style.visibility = 'visible'; idle = false }
      const r = img.getBoundingClientRect()
      const pts = TRACK_IMG.map(([x, y]) => imageToScreen(r, x, y))
      const dA = smoothPath(pts)
      const aDraw = span(p, 0.0, 0.13), aErase = span(p, 0.36, 0.46)
      set(glowA, dA, aErase, aDraw)
      set(coreA, dA, aErase, aDraw)

      const E = pts[pts.length - 1]
      const S: readonly [number, number] = stage.rReady ? [stage.rx, stage.ry] : [E[0] + 300, E[1] + 40]
      const dx = S[0] - E[0]
      const dB = `M${E[0].toFixed(1)},${E[1].toFixed(1)} C${(E[0] + 70).toFixed(1)},${(E[1] + 34).toFixed(1)} ${(S[0] - dx * 0.42).toFixed(1)},${(S[1] + 46).toFixed(1)} ${S[0].toFixed(1)},${S[1].toFixed(1)}`
      const bDraw = stage.rReady ? span(p, 0.13, 0.3) : 0, bErase = span(p, 0.44, 0.58)
      set(glowB, dB, bErase, bDraw)
      const LB = set(coreB, dB, bErase, bDraw)

      // горячая голова на фронте рисования
      let hx = pts[0][0], hy = pts[0][1], show = 0
      if (bDraw > 0 && bDraw < 1) { const q = coreB.getPointAtLength(bDraw * LB); hx = q.x; hy = q.y; show = 1 }
      else if (aDraw > 0 && aDraw < 1) { const q = coreA.getPointAtLength(aDraw * coreA.getTotalLength()); hx = q.x; hy = q.y; show = 1 }
      head.setAttribute('cx', hx.toFixed(1))
      head.setAttribute('cy', hy.toFixed(1))
      head.style.opacity = String(show)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [imgSelector])

  return (
    <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-0 z-[35] h-full w-full overflow-visible">
      <defs>
        <filter id="trk-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path fill="none" stroke="#5CE8FF" strokeWidth="14" strokeLinecap="round" filter="url(#trk-glow)" opacity="0" />
      <path fill="none" stroke="#D8FBFF" strokeWidth="4" strokeLinecap="round" opacity="0" />
      <path fill="none" stroke="#5CE8FF" strokeWidth="14" strokeLinecap="round" filter="url(#trk-glow)" opacity="0" />
      <path fill="none" stroke="#D8FBFF" strokeWidth="4" strokeLinecap="round" opacity="0" />
      <circle r="7" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px #5CE8FF) drop-shadow(0 0 20px #5CE8FF)' }} opacity="0" />
    </svg>
  )
}
