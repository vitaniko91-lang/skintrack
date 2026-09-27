import { forwardRef, useEffect, useState } from 'react'
import { heightAt } from '../terrain/decode'
import { ROUTE_UV } from '../terrain/route'
import { loadHeightfieldOnce } from '../terrain/routeSummary'

/** Профиль высоты вдоль настоящего трека — 48 точек из DEM. */
function useProfile() {
  const [d, setD] = useState<string | null>(null)
  useEffect(() => {
    loadHeightfieldOnce().then((hf) => {
      const pts: number[] = []
      const seg = ROUTE_UV.length - 1
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * seg
        const k = Math.min(Math.floor(t), seg - 1), f = t - k
        const [u0, v0] = ROUTE_UV[k], [u1, v1] = ROUTE_UV[k + 1]
        pts.push(heightAt(hf, u0 + (u1 - u0) * f, v0 + (v1 - v0) * f))
      }
      const lo = Math.min(...pts), hi = Math.max(...pts)
      const xy = pts.map((h, i) => `${(i / 48) * 300},${56 - ((h - lo) / (hi - lo)) * 48}`)
      setD(`M${xy.join(' L')}`)
    }).catch(() => {})
  }, [])
  return d
}

interface Props { onStart: () => void; className?: string }

/** Плавающая карточка маршрута — аналог «EMX ST50 · Swipe to ride». */
export const SwipeCard = forwardRef<HTMLDivElement, Props>(function SwipeCard({ onStart, className = '' }, ref) {
  const d = useProfile()
  return (
    <div
      ref={ref}
      className={`absolute right-[4.5vw] top-[21svh] z-30 w-[344px] rounded-[32px] border border-white/12 bg-[#04080c]/85 p-5 text-body shadow-[0_40px_90px_-30px_rgb(0_0_0/0.8)] max-md:left-4 max-md:right-4 max-md:top-auto max-md:bottom-4 max-md:w-auto max-md:p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Today · 06:40 · NE face</p>
          <h2 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em]">Couloir Nord</h2>
        </div>
        <button
          type="button"
          onClick={onStart}
          aria-label="Open route details"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 text-body transition-colors duration-200 hover:border-cyan hover:text-cyan"
        >
          <span className="icon-[lucide--arrow-up-right] size-5" />
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 max-md:hidden">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Max slope</dt>
          <dd className="mt-0.5 text-[30px] font-semibold tabular-nums leading-none">38°</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Danger</dt>
          <dd className="mt-1.5 flex items-center gap-2 text-[15px] font-medium">
            <span className="grid size-6 place-items-center rounded-md bg-danger-3 text-[13px] font-bold text-ink">3</span>
            considerable
          </dd>
        </div>
      </dl>
      <svg viewBox="0 0 300 60" className="mt-3 h-14 w-full max-md:hidden" aria-hidden>
        <defs>
          <linearGradient id="prof" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5CE8FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#5CE8FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {d && <path d={`${d} L300,60 L0,60 Z`} fill="url(#prof)" />}
        {d && <path d={d} fill="none" stroke="#5CE8FF" strokeWidth="2" />}
      </svg>
      <button
        type="button"
        onClick={onStart}
        className="group mt-4 flex h-14 w-full items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] pl-1.5 pr-5 text-left max-md:mt-3"
      >
        <span className="grid size-11 place-items-center rounded-full bg-cyan text-ink shadow-[0_0_24px_rgb(92_232_255/0.6)] transition-transform duration-300 ease-[var(--ease-expo)] group-hover:translate-x-2">
          <span className="icon-[lucide--footprints] size-5" />
        </span>
        <span className="flex-1 text-[15px] font-medium">Swipe to start</span>
        <span aria-hidden className="chev font-mono text-lg text-cyan"><span>›</span><span>›</span><span>›</span></span>
      </button>
    </div>
  )
})
