import { forwardRef, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { heightAt } from '../terrain/decode'
import { ROUTE_UV } from '../terrain/route'
import { SLOPE_BANDS, slopeCell } from '../terrain/slope'
import { formatRouteStats, loadHeightfieldOnce, useRouteStats } from '../terrain/routeSummary'
import { avoid, edgePoint, formatElevation, formatKm, hazardSpan, placeCard, type Pt, type Rect } from './layout'
import { stage, span, easeOut } from './stage'

const VERTS = [0, 4, ROUTE_UV.length - 1] as const

/** Высоты вершин маршрута по DEM — те же данные, что у 3D-горы. */
function useElevations() {
  const [e, setE] = useState<number[] | null>(null)
  useEffect(() => {
    loadHeightfieldOnce().then((hf) => setE(VERTS.map((k) => heightAt(hf, ROUTE_UV[k][0], ROUTE_UV[k][1])))).catch(() => {})
  }, [])
  return e
}

interface Profile { line: string; area: string; haz: string; dot: [number, number] }

/**
 * Профиль высоты вдоль трека (DEM) и крутой участок кулуара на нём — «продукт в карточке»,
 * как велосипед на карточке EMX: настоящие данные вместо картинки.
 */
function useProfile() {
  const [p, setP] = useState<Profile | null>(null)
  useEffect(() => {
    loadHeightfieldOnce().then((hf) => {
      const N = 72, seg = ROUTE_UV.length - 1
      const hs: number[] = [], sl: number[] = []
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * seg, k = Math.min(Math.floor(t), seg - 1), f = t - k
        const u = ROUTE_UV[k][0] + (ROUTE_UV[k + 1][0] - ROUTE_UV[k][0]) * f
        const v = ROUTE_UV[k][1] + (ROUTE_UV[k + 1][1] - ROUTE_UV[k][1]) * f
        hs.push(heightAt(hf, u, v))
        sl.push(slopeCell(hf, Math.round(v * (hf.height - 1)) * hf.width + Math.round(u * (hf.width - 1))))
      }
      const lo = Math.min(...hs), hi = Math.max(...hs)
      const pt = (i: number): [number, number] => [(i / N) * 290 + 5, 58 - ((hs[i] - lo) / (hi - lo)) * 50]
      const xy = hs.map((_, i) => pt(i).map((n) => n.toFixed(1)).join(','))
      const line = `M${xy.join(' L')}`
      const span = hazardSpan(sl, 30, { gap: 3, near: 4 / seg }) ?? [0.5, 0.6]
      const a = Math.round(span[0] * N), b = Math.round(span[1] * N)
      const haz = `M${xy.slice(a, b + 1).join(' L')}`
      setP({ line, area: `${line} L295,64 L5,64 Z`, haz, dot: pt(Math.round((4 / seg) * N)) })
    }).catch(() => {})
  }, [])
  return p
}

function ProfileMini({ p }: { p: Profile | null }) {
  return (
    <svg viewBox="0 0 300 64" className="mt-4 h-14 w-full" aria-hidden>
      <defs>
        <linearGradient id="rc-prof" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5CE8FF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#5CE8FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {p && <>
        <path d={p.area} fill="url(#rc-prof)" />
        <path d={p.line} fill="none" stroke="#5CE8FF" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d={p.haz} fill="none" stroke="#FF9A1F" strokeWidth="4" strokeLinecap="round" />
        <circle cx={p.dot[0]} cy={p.dot[1]} r="5" fill="#FF9A1F" stroke="#fff" strokeWidth="2" />
      </>}
    </svg>
  )
}

/** Когда в прогрессе главы 02 появляется точка, выноска и карточка (по вершинам маршрута). */
const APPEAR = [0.2, 0.34, 0.5]
/** Смещение карточки от якоря: знак — сторона. Десктоп / узкий экран. */
const OFFSET: Pt[] = [{ x: 56, y: 24 }, { x: 72, y: -36 }, { x: -72, y: 12 }]
const OFFSET_NARROW: Pt[] = [{ x: 18, y: 26 }, { x: 18, y: -18 }, { x: -18, y: -30 }]
/** Глубина для параллакса за курсором: ближняя карточка сдвигается сильнее. */
const DEPTH = [0.6, 1, 0.8]

const glass =
  'rounded-[30px] border bg-[linear-gradient(160deg,rgb(20_40_52/0.9),rgb(4_8_12/0.92)_62%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_40px_80px_-30px_rgb(0_0_0/0.85)]'
const kicker = 'font-mono text-[11px] uppercase tracking-[0.18em] text-muted'

function Stat({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dt className={kicker}>{label}</dt>
      <dd className={`mt-1 font-mono text-[20px] font-medium tabular-nums leading-none ${tone}`}>{value}</dd>
    </div>
  )
}

/** Шкала крутизны (швейцарская конвенция) с меткой на 38°: 25..50°. */
function SlopeScale({ deg }: { deg: number }) {
  const lo = 25, hi = 50
  const pct = (d: number) => ((d - lo) / (hi - lo)) * 100
  return (
    <div className="mt-4" aria-hidden>
      <div className="relative h-2 overflow-visible rounded-full bg-white/10">
        {SLOPE_BANDS.map((b, i) => {
          const to = SLOPE_BANDS[i + 1]?.from ?? hi
          return <span key={b.from} className="absolute inset-y-0" style={{ left: `${pct(b.from)}%`, width: `${pct(to) - pct(b.from)}%`, background: b.color, opacity: deg >= b.from && deg < to ? 1 : 0.35 }} />
        })}
        <span className="absolute -top-1.5 h-5 w-[3px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_#fff]" style={{ left: `${pct(deg)}%` }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-muted"><span>25°</span><span>35°</span><span>45°</span></div>
    </div>
  )
}

interface CardProps { elev: (i: number) => string; maxDeg: string; gain: string; time: string; profile: Profile | null }

const StartCard = forwardRef<HTMLDivElement, CardProps>(function StartCard({ elev }, ref) {
  return (
    <div ref={ref} data-card className={`${glass} w-[248px] border-white/12 p-5 max-md:w-[176px] max-md:p-3.5`}>
      <div className="flex items-center justify-between">
        <p className={kicker}>Trailhead · NE face</p>
        <span className="icon-[lucide--flag] size-4 text-cyan" aria-hidden />
      </div>
      <h3 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.02em] max-md:text-[18px]">Start · <span className="tabular-nums">{elev(0)}</span></h3>
      <dl className="mt-3 flex gap-6 max-md:hidden">
        <Stat label="Depart" value="06:40" />
        <Stat label="Face" value="NE" />
      </dl>
    </div>
  )
})

const HazardCard = forwardRef<HTMLDivElement, CardProps>(function HazardCard({ elev, maxDeg, profile }, ref) {
  const deg = parseInt(maxDeg, 10) || 38
  return (
    <div ref={ref} data-card className={`${glass} w-[330px] border-danger-3/55 p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_60px_-10px_rgb(255_154_31/0.45),0_40px_80px_-30px_rgb(0_0_0/0.85)] max-md:w-[196px] max-md:p-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={kicker}>Hazard<span className="max-md:hidden"> · {elev(1)}</span></p>
          <h3 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em] max-md:text-[18px]">Couloir Nord</h3>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-3 text-ink shadow-[0_0_24px_rgb(255_154_31/0.7)] max-md:size-8" aria-hidden>
          <span className="icon-[lucide--triangle-alert] size-5 max-md:size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="font-sans text-[64px] font-bold leading-[0.85] tracking-[-0.04em] tabular-nums max-md:text-[40px]">{maxDeg}</p>
        <div className="pb-1 text-right">
          <p className={kicker}>Danger</p>
          <p className="mt-1 flex items-center gap-2 text-[15px] font-medium">
            <span className="grid size-6 place-items-center rounded-md bg-danger-3 text-[13px] font-bold text-ink">3</span>
            <span className="max-md:hidden">considerable</span>
          </p>
        </div>
      </div>
      <div className="max-md:hidden">
        <ProfileMini p={profile} />
        <SlopeScale deg={deg} />
        <div className="mt-4 flex h-12 items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] pl-1.5 pr-4">
          <span className="grid size-9 place-items-center rounded-full bg-danger-3/15 text-danger-3" aria-hidden>
            <span className="icon-[lucide--users] size-[18px]" />
          </span>
          <span className="flex-1 text-[14px] font-medium">Cross one at a time</span>
          <span aria-hidden className="chev font-mono text-lg text-danger-3"><span>›</span><span>›</span><span>›</span></span>
        </div>
      </div>
    </div>
  )
})

const SummitCard = forwardRef<HTMLDivElement, CardProps>(function SummitCard({ elev, gain, time }, ref) {
  return (
    <div ref={ref} data-card className={`${glass} w-[256px] border-cyan/35 p-5 max-md:w-[176px] max-md:p-3.5`}>
      <div className="flex items-center justify-between">
        <p className={kicker}>Finish · shoulder</p>
        <span className="icon-[lucide--mountain] size-4 text-cyan" aria-hidden />
      </div>
      <p className="mt-2 font-sans text-[44px] font-bold leading-[0.9] tracking-[-0.04em] tabular-nums text-cyan-hot max-md:text-[28px]">{elev(2)}</p>
      <dl className="mt-3 flex gap-6 max-md:hidden">
        <Stat label="Gain" value={`+${gain}`} />
        <Stat label="Time" value={time} />
      </dl>
    </div>
  )
})

/**
 * Глава 02: карточки маршрута выезжают из своих точек на 3D-горе и держатся за них,
 * пока гора поворачивается; наклон за курсором, выноски от точки к карточке.
 */
export function RouteCards({ statsRef }: { statsRef?: React.Ref<HTMLDListElement> }) {
  const layer = useRef<HTMLDivElement>(null)
  const cards = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const e = useElevations()
  const profile = useProfile()
  const s = useRouteStats()
  const f = s ? formatRouteStats(s) : null
  const elev = (i: number) => (e ? formatElevation(e[i]) : '—')
  const props: CardProps = { elev, maxDeg: f?.[0].value ?? '38°', gain: f?.[1].value ?? '1,000 m', time: f?.[2].value ?? '3:18', profile }

  useEffect(() => {
    const root = layer.current!
    const els = cards.map((c) => c.current!)
    const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-dot]'))
    const lines = Array.from(root.querySelectorAll<SVGLineElement>('[data-lead]'))
    const size = els.map(() => ({ w: 0, h: 0 }))
    const measure = () => els.forEach((el, i) => { size[i] = { w: el.offsetWidth, h: el.offsetHeight } })
    measure()
    const ro = new ResizeObserver(measure)
    els.forEach((el) => ro.observe(el))
    let idle = false
    let last = ''
    const tick = () => {
      const q = stage.q
      // трек ушёл из кадра — слой прячем и больше не пишем: выноски (SVG) иначе перерисовывали
      // полноэкранный слой на каждом кадре глав 03–06
      if (q <= 0.001 || !stage.anchorsReady || !stage.track) {
        if (!idle) { root.style.visibility = 'hidden'; idle = true }
        return
      }
      if (idle) { root.style.visibility = 'visible'; idle = false }
      const W = innerWidth, H = innerHeight, narrow = W < 768
      const A = stage.anchors
      const key = `${q}|${A[0].x}|${A[0].y}|${A[1].x}|${A[1].y}|${A[2].x}|${A[2].y}|${stage.px}|${stage.py}|${W}|${H}|${size.map((s) => s.w + 'x' + s.h).join()}`
      if (key === last) return // ничего не сдвинулось — DOM не трогаем
      last = key
      // сначала кулуар (главная), потом остальные разводятся от уже поставленных
      // узкий экран: подпись главы занимает верхнюю треть — карточки под ней
      const band = narrow ? H * 0.3 : 88
      const placed: Rect[] = []
      const target: Rect[] = []
      for (const i of [1, 0, 2]) {
        const r0 = placeCard(stage.anchors[i], size[i], { w: W, h: H }, (narrow ? OFFSET_NARROW : OFFSET)[i], narrow ? 12 : 24, band)
        const r = avoid(r0, placed, { w: W, h: H }, 12, narrow ? 12 : 24, band)
        placed.push(r); target[i] = r
      }
      els.forEach((el, i) => {
        const a = stage.anchors[i]
        const t0 = APPEAR[i]
        const kd = easeOut(span(q, t0, t0 + 0.05))
        const kl = span(q, t0 + 0.03, t0 + 0.09)
        const kc = easeOut(span(q, t0 + 0.05, t0 + 0.17))
        const r = target[i]
        // карточка выезжает из точки: путь от якоря к месту, масштаб 0.55→1
        const par = DEPTH[i] * (narrow ? 0 : 14)
        const x = a.x + (r.x - a.x) * kc - stage.px * par
        const y = a.y + (r.y - a.y) * kc - stage.py * par
        const tiltY = stage.px * 9 * DEPTH[i], tiltX = -stage.py * 7 * DEPTH[i]
        el.style.opacity = String(kc)
        el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) rotateZ(${((1 - kc) * (i === 2 ? -8 : 8)).toFixed(2)}deg) scale(${(0.55 + 0.45 * kc).toFixed(3)})`
        dots[i].style.transform = `translate3d(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px,0) scale(${kd.toFixed(3)})`
        dots[i].style.opacity = String(kd)
        const edge = edgePoint({ x: x, y: y, w: size[i].w, h: size[i].h }, a)
        const ln = lines[i]
        ln.setAttribute('x1', a.x.toFixed(1)); ln.setAttribute('y1', a.y.toFixed(1))
        ln.setAttribute('x2', (a.x + (edge.x - a.x) * kl).toFixed(1)); ln.setAttribute('y2', (a.y + (edge.y - a.y) * kl).toFixed(1))
        ln.style.opacity = String(kl * (1 - kc * 0.25))
      })
    }
    gsap.ticker.add(tick)
    return () => { gsap.ticker.remove(tick); ro.disconnect() }
  }, [])

  return (
    <>
      <div ref={layer} className="pointer-events-none absolute inset-0 z-20" style={{ visibility: 'hidden' }}>
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {[0, 1, 2].map((i) => (
            <line key={i} data-lead stroke={i === 1 ? '#FF9A1F' : '#B8F7FF'} strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" opacity="0" />
          ))}
        </svg>
        {[0, 1, 2].map((i) => (
          <span key={i} data-dot aria-hidden className="absolute left-0 top-0 opacity-0">
            <span className={`absolute -left-[7px] -top-[7px] size-[14px] rounded-full border-2 border-white ${i === 1 ? 'bg-danger-3 shadow-[0_0_18px_#FF9A1F]' : 'bg-cyan shadow-[0_0_18px_#5CE8FF]'}`} />
            {i === 1 && <span className="ping absolute -left-[22px] -top-[22px] size-[44px] rounded-full border-2 border-danger-3" />}
          </span>
        ))}
        <div className="absolute left-0 top-0 origin-top-left text-body" style={{ opacity: 0 }} ref={cards[0]}><StartCard {...props} /></div>
        <div className="absolute left-0 top-0 origin-top-left text-body" style={{ opacity: 0 }} ref={cards[1]}><HazardCard {...props} /></div>
        <div className="absolute left-0 top-0 origin-top-left text-body" style={{ opacity: 0 }} ref={cards[2]}><SummitCard {...props} /></div>
      </div>
      <RouteStats ref={statsRef} distance={s ? formatKm(s.lengthM) : '3.18 km'} gain={props.gain} time={props.time} maxDeg={props.maxDeg} />
    </>
  )
}

/** Полоса цифр маршрута — настоящие formatRouteStats по DEM. */
export const RouteStats = forwardRef<HTMLDListElement, { distance: string; gain: string; time: string; maxDeg: string }>(
  function RouteStats({ distance, gain, time, maxDeg }, ref) {
    const items = [
      { label: 'Distance', value: distance, tone: 'text-white' },
      { label: 'Gain', value: `+${gain}`, tone: 'text-white' },
      { label: 'Time · Munter', value: time, tone: 'text-white' },
      { label: 'Max slope', value: maxDeg, tone: 'text-danger-3' },
    ]
    return (
      <dl ref={ref} data-stats className={`${glass} pointer-events-none absolute bottom-[5svh] left-[5vw] z-20 flex border-white/12 px-2 py-4 max-md:inset-x-4 max-md:bottom-4 max-md:rounded-[22px] max-md:px-0 max-md:py-3`}>
        {items.map((it, i) => (
          <div key={it.label} className={`px-6 max-md:flex-1 max-md:px-3 ${i ? 'border-l border-white/10' : ''} ${i === 3 ? 'max-md:hidden' : ''}`}>
            <dt className={`${kicker} max-md:text-[9px] max-md:tracking-[0.1em]`}>{it.label}</dt>
            <dd className={`mt-1.5 font-mono text-[clamp(1.25rem,2.1vw,2rem)] font-medium tabular-nums leading-none ${it.tone} max-md:text-[17px]`}>{it.value}</dd>
          </div>
        ))}
      </dl>
    )
  },
)
