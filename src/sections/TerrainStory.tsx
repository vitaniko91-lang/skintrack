import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSectionProgress } from '../lib/useSectionProgress'
import { canUseWebGL, prefersReducedMotion } from '../lib/env'
import { fade } from '../scene/choreography'
import { routeStats, ROUTE_UV } from '../terrain/route'
import { SLOPE_BANDS } from '../terrain/slope'
import type { Heightfield } from '../terrain/decode'
import { Wordmark } from '../ui/Wordmark'
import { MonoLabel } from '../ui/MonoLabel'
import { ProductCard } from '../ui/ProductCard'

const TerrainCanvas = lazy(() => import('../scene/TerrainCanvas'))

/** Подписи фаз: [начало, конец] по прогрессу секции (совпадает со scrollState). */
const PHASES = { hero: [-1, 0.1], slope: [0.12, 0.46], route: [0.54, 1.1] } as const

/** Ниже этого изменения прогресса подпись не перекрашивается — не стоит ре-рендера. */
const PROGRESS_EPSILON = 0.001

export function TerrainStory() {
  const section = useRef<HTMLElement>(null)
  const [reduced] = useState(prefersReducedMotion)
  const [webgl] = useState(canUseWebGL)
  const progress = useSectionProgress(section, !reduced)
  const [hf, setHf] = useState<Heightfield | null>(null)
  const [failed, setFailed] = useState(false)
  const [p, setP] = useState(0)
  const handleError = useCallback(() => setFailed(true), [])

  // Подписи — единственный React-потребитель прогресса: обновляем с частотой кадров,
  // но только пока секция видна (IntersectionObserver) и только когда значение реально
  // изменилось — иначе это 60 сеттеров в секунду, часть из них впустую, для секции
  // вне экрана. В reduced-режиме подписи статичны — цикл не запускаем вовсе.
  useEffect(() => {
    if (reduced) return
    let raf = 0
    const tick = () => {
      const next = progress.current
      setP((prev) => (Math.abs(next - prev) > PROGRESS_EPSILON ? next : prev))
      raf = requestAnimationFrame(tick)
    }
    const start = () => { if (!raf) tick() }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }

    setP(progress.current) // читаем один раз на монтировании
    const node = section.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start()
      else stop()
    })
    io.observe(node)
    return () => { io.disconnect(); stop() }
  }, [progress, reduced])

  const stats = hf ? routeStats(hf, ROUTE_UV) : null
  const show = (k: keyof typeof PHASES) => {
    if (reduced) return 1
    const [a, b] = PHASES[k]
    return fade(p, a, b)
  }

  const statsList = stats ? [
    { label: 'max slope', value: `${Math.round(stats.maxSlopeDeg)}°` },
    { label: 'gain', value: `${Math.round(stats.gainM)} m` },
    { label: 'time', value: `${Math.floor(stats.minutes / 60)}:${String(stats.minutes % 60).padStart(2, '0')}` },
  ] : []

  const scene = !webgl || failed ? (
    <img src="./terrain/poster.webp" alt="" className="size-full object-cover" />
  ) : (
    <Suspense fallback={null}>
      <TerrainCanvas progress={progress} reduced={reduced} onReady={setHf} onError={handleError} />
    </Suspense>
  )

  const coords = (
    <header className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-6 md:p-10">
      <MonoLabel>45.9763°N · 7.6586°E</MonoLabel>
      <MonoLabel>Matterhorn · 4478 m</MonoLabel>
    </header>
  )

  if (reduced) {
    // Sticky 420vh + absolute captions только создают перекрытие, когда всё
    // видно сразу (без scroll-driven fade). Статичный кадр сцены + подписи
    // в обычном потоке документа — читаемо на любой ширине.
    return (
      <section ref={section} aria-label="The mountain" className="relative">
        <div className="relative h-dvh overflow-hidden">
          <div className="absolute inset-0">{scene}</div>
          {coords}
        </div>

        <div className="space-y-16 px-6 py-16 md:px-10 md:py-24">
          <div className="max-w-xl">
            <h1 className="text-[clamp(2.5rem,8vw,5rem)] leading-[0.9]"><Wordmark /></h1>
            <p className="mt-4 max-w-md text-lg text-muted">Read the slope before it reads you.</p>
          </div>

          <div className="max-w-xl">
            <MonoLabel>Slope layer</MonoLabel>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em]" style={{ fontStretch: '115%' }}>
              Most avalanches start between 30° and 45°.
            </h2>
            <ul className="mt-6 space-y-2 font-mono text-sm">
              {SLOPE_BANDS.map((b) => (
                <li key={b.label} className="flex items-center gap-3">
                  <span aria-hidden className="h-2.5 w-8 rounded-sm" style={{ background: b.color }} />
                  {b.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ProductCard title="Couloir Nord" danger={3} stats={statsList} />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={section} aria-label="The mountain" className="relative h-[420vh]">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="absolute inset-0">{scene}</div>
        {coords}

        <div className="absolute inset-x-6 bottom-10 md:inset-x-10" style={{ opacity: show('hero') }}>
          <h1 className="text-[clamp(3.5rem,11vw,10rem)] leading-[0.9]"><Wordmark /></h1>
          <p className="mt-4 max-w-md text-lg text-muted">Read the slope before it reads you.</p>
        </div>

        <div className="absolute left-6 top-1/2 max-w-sm -translate-y-1/2 md:left-10" style={{ opacity: show('slope') }}>
          <MonoLabel>Slope layer</MonoLabel>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.02em]" style={{ fontStretch: '115%' }}>
            Most avalanches start between 30° and 45°.
          </h2>
          <ul className="mt-6 space-y-2 font-mono text-sm">
            {SLOPE_BANDS.map((b) => (
              <li key={b.label} className="flex items-center gap-3">
                <span aria-hidden className="h-2.5 w-8 rounded-sm" style={{ background: b.color }} />
                {b.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-10 right-6 md:right-10" style={{ opacity: show('route') }}>
          <ProductCard title="Couloir Nord" danger={3} stats={statsList} />
        </div>
      </div>
    </section>
  )
}
