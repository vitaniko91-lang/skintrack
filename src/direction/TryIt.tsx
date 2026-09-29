import { useEffect, useReducer, useRef, useState, type Dispatch } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { formatRouteStats, useRouteStats } from '../terrain/routeSummary'
import { initialState, reducer, SCREENS, type ProtoEvent, type ProtoState, type ScreenId } from '../prototype/machine'
import { DEFAULT_CONDITIONS } from '../prototype/conditions'
import { PhoneFrame } from '../prototype/PhoneFrame'
import { FigureContext } from '../prototype/figureContext'
import { RouteScreen } from '../prototype/RouteScreen'
import { SlopeScreen } from '../prototype/SlopeScreen'
import { GroupScreen } from '../prototype/GroupScreen'
import { WarningScreen } from '../prototype/WarningScreen'
import { ChapterLabel } from './ChapterLabel'
import { Device } from './Device'
import { approach, floatY, mixPose, poseEqual, poseTransform, ROW_POSE, screenRibbonPath, SLOT_POSE, slotOf, tryPhases, type Pose } from './chapterMath'
import { stage } from './stage'

const EMPTY_STATS = [
  { label: 'max slope', value: '—' },
  { label: 'gain', value: '—' },
  { label: 'time', value: '—' },
]
/** Застывшие соседи показывают экран в «удачном» состоянии — как на борде. */
const FROZEN: Record<ScreenId, Partial<ProtoState>> = {
  route: { routeBuilt: true },
  slope: { routeBuilt: true, slopeOn: true },
  group: { check: 'passed' },
  warning: {},
}
const noop = () => {}
/** Телефон 390×800 + рамка 11 px. */
const DW = 412, DH = 822

function useNarrow() {
  const q = '(max-width: 767px)'
  const [n, setN] = useState(() => window.matchMedia?.(q).matches ?? false)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const on = () => setN(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return n
}

function ScreenOf({ st, dispatch, rows, slopeDeg, reduced }: {
  st: ProtoState; dispatch: Dispatch<ProtoEvent>; rows: { label: string; value: string }[]; slopeDeg: number; reduced: boolean
}) {
  switch (st.screen) {
    case 'route': return <RouteScreen state={st} dispatch={dispatch} stats={rows} reduced={reduced} />
    case 'slope': return <SlopeScreen state={st} dispatch={dispatch} reduced={reduced} />
    case 'group': return <GroupScreen state={st} dispatch={dispatch} conditions={DEFAULT_CONDITIONS} reduced={reduced} />
    case 'warning': return <WarningScreen state={st} dispatch={dispatch} reduced={reduced} slopeDeg={slopeDeg} />
  }
}

/** Степпер в манере Orlina: крупная курсивная цифра + широкий капс; подсказка — у активного. */
function Steps({ current, onGo }: { current: ScreenId; onGo: (id: ScreenId) => void }) {
  return (
    <ol aria-label="Prototype steps" className="pointer-events-auto mt-7 max-w-[440px] max-md:mt-6">
      {SCREENS.map((s, i) => {
        const on = s.id === current
        return (
          <li key={s.id} className="border-t border-white/10 last:border-b">
            <button
              type="button"
              aria-current={on ? 'step' : undefined}
              onClick={() => onGo(s.id)}
              className="group flex min-h-12 w-full items-center gap-4 py-2.5 text-left"
            >
              <span className={`w-10 font-serif text-[30px] italic leading-none transition-colors duration-200 ${on ? 'text-cyan' : 'text-cyan/45 group-hover:text-cyan/80'}`}>0{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className={`caps-wide block text-[15px] font-extrabold uppercase tracking-[0.02em] transition-colors duration-200 ${on ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>{s.step}</span>
                {on && <span className="mt-1 block text-[14px] leading-snug text-body/80">{s.hint}</span>}
              </span>
              <span aria-hidden className={`icon-[lucide--arrow-right] size-4 shrink-0 transition-[opacity,translate] duration-200 ${on ? 'translate-x-0 text-cyan opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'}`} />
            </button>
          </li>
        )
      })}
    </ol>
  )
}

const LABEL_CLS =
  'left-[5vw] top-1/2 w-[min(31vw,440px)] -translate-y-1/2 max-md:static max-md:w-auto max-md:translate-y-0 max-md:px-4 max-md:pt-20'

/**
 * Глава 04 · Try it. Три телефона в 3D-наклоне (RideOn): активный — живой прототип впереди,
 * соседи — застывшие экраны по бокам. Лента главы 03 входит сверху в экран и становится
 * маршрутом на карте. Степпер 01–04 и кнопки самого прототипа двигают «карусель».
 */
export function TryIt({ reduced = false }: { reduced?: boolean }) {
  const narrow = useNarrow()
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...initialState('route'), routeBuilt: reduced }))
  const stats = useRouteStats()
  const rows = stats ? formatRouteStats(stats) : EMPTY_STATS
  const slopeDeg = stats ? Math.round(stats.maxSlopeDeg) : 38
  const active = SCREENS.findIndex((s) => s.id === state.screen)
  const go = (id: ScreenId) => dispatch({ type: 'go', screen: id })

  const section = useRef<HTMLElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const stageEl = useRef<HTMLDivElement>(null)
  const phones = useRef<(HTMLDivElement | null)[]>([])
  const dims = useRef<(HTMLDivElement | null)[]>([])
  const live = useRef<HTMLDivElement>(null)
  const ribbon = useRef<SVGSVGElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const stateRef = useRef(state)
  stateRef.current = state
  /** статичный режим: перерасставить телефоны после смены экрана */
  const relayout = useRef<() => void>(noop)
  const autoBuilt = useRef(false)

  // ── 3D-карусель + лента (только десктоп) ──
  useEffect(() => {
    if (narrow) return
    const root = stageEl.current!
    const els = phones.current
    const cur: Pose[] = SCREENS.map((_, i) => ({ ...(reduced ? SLOT_POSE : ROW_POSE)[slotOf(i, activeRef.current, SCREENS.length)] }))
    const last: string[] = []
    let k = reduced ? 1 : 0 // въезд тройки 0..1
    let r = reduced ? 0.4 : 0 // прогресс закреплённой части (лента)
    // в движении — false до первого входа: onToggle срабатывает, только когда секция в кадре; с true тикер
    // расставлял телефоны (и читал раскладку) на каждом кадре всей страницы. Статичный режим триггеров не имеет — true
    let near = reduced
    const [glow, core] = Array.from(ribbon.current!.querySelectorAll('path'))
    const head = ribbon.current!.querySelector('circle')!
    let lastRibbon = ''

    // ширина сцены — из ResizeObserver, а не clientWidth на каждом кадре: чтение после записей GSAP
    // форсировало пересчёт раскладки в каждом кадре скролла
    let rootW = root.clientWidth
    const ro = new ResizeObserver(() => { rootW = root.clientWidth })
    ro.observe(root)
    const fitOf = () => Math.min(1, (innerHeight * 0.86) / DH, (rootW * 0.5) / DW)

    let now = performance.now()
    const place = (dt: number) => {
      now = performance.now()
      const fit = fitOf()
      const tilt = reduced ? { x: 0, y: 0 } : { x: stage.px * 4, y: stage.py * 3 }
      let moving = false
      els.forEach((el, i) => {
        if (!el) return
        const slot = slotOf(i, activeRef.current, SCREENS.length)
        const target = mixPose(ROW_POSE[slot], SLOT_POSE[slot], k)
        cur[i] = reduced || dt <= 0 ? target : approach(cur[i], target, dt)
        if (!poseEqual(cur[i], target)) moving = true
        // парение: только в движущемся режиме, у переднего вдвое тише — по нему попадают пальцем
        const lift = reduced ? 0 : floatY(i, now / 1000, slot === 'front' ? 3 : 8) * k
        const t = poseTransform(cur[i], DW, DH, fit, slot === 'front' ? tilt : { x: 0, y: 0 }, lift)
        if (t !== last[i]) {
          last[i] = t
          el.style.transform = t
          el.style.opacity = cur[i].op.toFixed(3)
          el.style.zIndex = String(slot === 'front' ? 3 : slot === 'back' ? 0 : 1)
          el.style.visibility = cur[i].op < 0.01 ? 'hidden' : 'visible'
          const d = dims.current[i]
          if (d) d.style.opacity = cur[i].dim.toFixed(3)
        }
      })
      return moving
    }

    const drawRibbon = () => {
      const ph = tryPhases(r)
      const dot = live.current?.querySelector('svg circle') as SVGCircleElement | null
      const vis = ph.draw - ph.erase
      if (!dot || vis <= 0.001 || !near) {
        if (lastRibbon !== 'off') { ribbon.current!.style.visibility = 'hidden'; lastRibbon = 'off' }
        return
      }
      const sr = root.getBoundingClientRect(), dr = dot.getBoundingClientRect()
      const to = { x: dr.left + dr.width / 2 - sr.left, y: dr.top + dr.height / 2 - sr.top }
      const from = { x: innerWidth * 0.7 - sr.left, y: -30 } // там, где кадр покинула лента главы 03
      const d = screenRibbonPath(from, to)
      const key = `${d}|${ph.draw.toFixed(4)}|${ph.erase.toFixed(4)}`
      if (key === lastRibbon) return
      lastRibbon = key
      ribbon.current!.style.visibility = 'visible'
      let L = 0
      for (const p of [glow, core]) {
        p.setAttribute('d', d)
        L = p.getTotalLength()
        // хвост втягивается в точку старта: видимая часть — [erase, draw] длины
        p.style.strokeDasharray = `${Math.max(vis, 0) * L} ${L * 2}`
        p.style.strokeDashoffset = `${-ph.erase * L}`
      }
      const q = core.getPointAtLength(ph.draw * L)
      head.setAttribute('cx', q.x.toFixed(1)); head.setAttribute('cy', q.y.toFixed(1))
      head.style.opacity = ph.draw < 1 ? '1' : String(1 - ph.erase)
      // лента коснулась экрана — маршрут строится сам, один раз за визит
      if (ph.build && !reduced && !autoBuilt.current) {
        autoBuilt.current = true
        const s = stateRef.current
        if (s.screen === 'route' && !s.routeBuilt) dispatch({ type: 'buildRoute' })
      }
    }

    let prev = performance.now()
    const tick = () => {
      const now = performance.now(), dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      if (!near) return // вне кадра телефоны не трогаем (парение иначе крутило бы тикер вечно)
      place(dt)
      drawRibbon()
    }

    if (reduced) {
      const once = () => { rootW = root.clientWidth; place(0); drawRibbon() }
      relayout.current = once
      const t = setTimeout(once, 50)
      const t2 = setTimeout(once, 600) // карта и шрифты догрузились
      addEventListener('resize', once)
      return () => { clearTimeout(t); clearTimeout(t2); removeEventListener('resize', once); ro.disconnect() }
    }

    gsap.ticker.add(tick)
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => { near = self.isActive },
      })
      const enter = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section.current, start: 'top 85%', end: 'top top', scrub: 0.6 },
        onUpdate() { k = gsap.parseEase('power2.out')(enter.progress()) },
      })
      enter.to({}, { duration: 1 }, 0)
      const lb = label.current!
      enter
        .fromTo(lb.querySelector('[data-ch="num"]'), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }, 0.3)
        .fromTo(lb.querySelector('[data-ch="kicker"]'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.4)
        .fromTo(lb.querySelector('[data-ch="read"]'), { opacity: 0, x: -50, filter: 'blur(14px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, 0.4)
        .fromTo(lb.querySelector('ol'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.62)
      lb.querySelectorAll('[data-ch="caps"]').forEach((el, i) => {
        enter.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.25, ease: 'power3.out' }, 0.46 + i * 0.02)
      })
      ScrollTrigger.create({
        trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (self) => { r = self.progress },
      })
    }, section)
    return () => { gsap.ticker.remove(tick); ctx.revert(); ro.disconnect() }
  }, [narrow, reduced])

  useEffect(() => { if (reduced) relayout.current() }, [active, reduced])

  const livePhone = (
    <FigureContext value={false}>
      <PhoneFrame conditions={DEFAULT_CONDITIONS} variant="figure">
        <div key={state.screen} className={`flex min-h-0 flex-1 flex-col ${reduced ? '' : 'animate-[screen-in_200ms_var(--ease-out-strong)]'}`}>
          <ScreenOf st={state} dispatch={dispatch} rows={rows} slopeDeg={slopeDeg} reduced={reduced} />
        </div>
      </PhoneFrame>
    </FigureContext>
  )
  const liveLabel = `Live prototype · step ${active + 1} of 4 · ${SCREENS[active].step}`

  return (
    <section
      ref={section}
      id="try"
      aria-label="Chapter 04 · Try it live"
      className={`relative bg-ground ${narrow ? 'pb-16' : reduced ? 'h-svh min-h-[720px]' : 'h-[260vh]'}`}
    >
      <div className={narrow ? 'relative overflow-x-clip' : 'sticky top-0 h-svh min-h-[720px] overflow-hidden'}>
        {/* ореол за тройкой */}
        <div aria-hidden className="pointer-events-none absolute right-[-10vw] top-[8%] size-[min(90vw,1100px)] rounded-full bg-[radial-gradient(circle,rgb(92_232_255/0.2),rgb(92_232_255/0.05)_45%,transparent_70%)] max-md:right-[-40vw] max-md:top-[30%]" />

        <ChapterLabel
          ref={label}
          id="chapter-04"
          num="04"
          accent="Try"
          caps="it live"
          body={null}
          className={LABEL_CLS}
        >
          <Steps current={state.screen} onGo={go} />
        </ChapterLabel>

        {narrow ? (
          <div className="mt-8 px-4">
            <div ref={live} role="group" aria-label={liveLabel} className="mx-auto w-full max-w-[420px]">
              <Device glow>{livePhone}</Device>
            </div>
          </div>
        ) : (
          <div ref={stageEl} className="absolute inset-y-0 right-0 w-[62vw] [perspective:1900px]">
            <div className="absolute inset-0 [transform-style:preserve-3d]">
              {SCREENS.map((s, i) => {
                const isLive = i === active
                return (
                  <div
                    key={s.id}
                    ref={(el) => { phones.current[i] = el }}
                    className="absolute left-1/2 top-1/2 origin-center will-change-transform"
                    style={{ width: DW, height: DH, marginLeft: -DW / 2, marginTop: -DH / 2, opacity: 0 }}
                    onClick={isLive ? undefined : () => go(s.id)}
                  >
                    {isLive ? (
                      <div ref={live} role="group" aria-label={liveLabel}>
                        <Device glow>{livePhone}</Device>
                      </div>
                    ) : (
                      <div inert aria-hidden className={`cursor-pointer ${slotOf(i, active, SCREENS.length) === 'right' ? 'screen-light' : ''}`}>
                        <Device>
                          <FigureContext value={true}>
                            <PhoneFrame conditions={DEFAULT_CONDITIONS} variant="figure">
                              <ScreenOf st={{ ...initialState(s.id), ...FROZEN[s.id] }} dispatch={noop} rows={rows} slopeDeg={slopeDeg} reduced />
                            </PhoneFrame>
                          </FigureContext>
                        </Device>
                      </div>
                    )}
                    <div ref={(el) => { dims.current[i] = el }} aria-hidden className="pointer-events-none absolute inset-0 rounded-[52px] bg-ink" style={{ opacity: 0 }} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!narrow && (
          <svg ref={ribbon} aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 h-full w-[62vw] overflow-visible" style={{ visibility: 'hidden' }}>
            <path fill="none" stroke="rgb(92 232 255 / 0.35)" strokeWidth="18" strokeLinecap="round" />
            <path fill="none" stroke="#E8FDFF" strokeWidth="5" strokeLinecap="round" />
            <circle r="7" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px #5CE8FF)' }} />
          </svg>
        )}

        {/* пилюля «Swipe to ride» у RideOn — здесь рабочая: сбрасывает прототип */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'reset' })}
          className="group absolute bottom-[6svh] left-[5vw] z-20 flex h-14 items-center gap-3 rounded-full border border-white/12 bg-[rgb(10_20_28/0.8)] pl-1.5 pr-5 text-[15px] font-medium text-body backdrop-blur-md transition-colors duration-200 hover:border-cyan/50 max-md:static max-md:mx-4 max-md:mt-6 max-md:w-[calc(100%-2rem)]"
        >
          <span className="grid size-11 place-items-center rounded-full bg-cyan text-ink shadow-[0_0_24px_rgb(92_232_255/0.55)]">
            <span aria-hidden className="icon-[lucide--rotate-ccw] size-5 transition-transform duration-300 group-hover:-rotate-90" />
          </span>
          <span className="flex-1 text-left">Restart the prototype</span>
          <span aria-hidden className="chev font-mono text-lg text-cyan"><span>›</span><span>›</span><span>›</span></span>
        </button>
      </div>
    </section>
  )
}
