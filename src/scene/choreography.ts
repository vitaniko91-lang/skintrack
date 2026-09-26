/** Такт неподвижности до первого движения (motion-design.md → hold). */
export const HOLD_MS = 900
const CONTOURS_MS = 1600
const RISE_DELAY_MS = 400
const RISE_MS = 1600
export const INTRO_MS = HOLD_MS + RISE_DELAY_MS + RISE_MS

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
const ramp = (p: number, a: number, b: number) => easeOut((p - a) / (b - a))

export interface IntroState { rise: number; contours: number }
export interface ScrollState { slope: number; route: number; orbit: number }

export function introState(ms: number, reduced = false): IntroState {
  if (reduced || ms >= INTRO_MS) return { rise: 1, contours: 1 }
  if (ms < HOLD_MS) return { rise: 0, contours: 0 }
  const t = ms - HOLD_MS
  return {
    contours: ramp(t, 0, CONTOURS_MS),
    rise: ramp(t, RISE_DELAY_MS, RISE_DELAY_MS + RISE_MS),
  }
}

/** p — прогресс sticky-секции 0..1 */
export function scrollState(p: number, reduced = false): ScrollState {
  const orbit = -0.35 + clamp01(p) * 0.7
  if (reduced) return { slope: 1, route: 1, orbit: 0 }
  return { slope: ramp(p, 0.08, 0.42), route: ramp(p, 0.5, 0.88), orbit }
}

export function sectionProgress(top: number, height: number, viewport: number): number {
  const scrollable = height - viewport
  if (scrollable <= 0) return 0
  return clamp01(-top / scrollable)
}

/** Непрозрачность подписи: плавно входит у a, выходит у b (ширина края 0.06). */
export function fade(p: number, a: number, b: number): number {
  const e = 0.06
  return clamp01(Math.min((p - a) / e, (b - p) / e))
}
