import { heightAt, type Heightfield } from './decode'

export type UV = readonly [number, number]

/**
 * Трек подъёма с северо-востока (со стороны Церматта) к плечу под вершиной.
 * Координаты UV окна: u — запад→восток, v — север→юг. Пик около (0.48, 0.49).
 * Точки подбираются глазами в Task 10, Step 4; тесты проверяют только границы.
 */
export const ROUTE_UV: readonly UV[] = [
  [0.88, 0.16], [0.82, 0.21], [0.76, 0.26], [0.70, 0.31],
  [0.64, 0.36], [0.59, 0.40], [0.55, 0.44], [0.52, 0.47],
]

export const WAYPOINTS = [
  { index: 0, name: 'Start · Schwarzsee', kind: 'start' },
  { index: 4, name: 'Couloir Nord', kind: 'hazard' },
  { index: 7, name: 'Shoulder', kind: 'summit' },
] as const

export interface RouteStats {
  lengthM: number
  gainM: number
  maxSlopeDeg: number
  minutes: number
}

export function routeStats(hf: Heightfield, pts: readonly UV[]): RouteStats {
  const spanX = (hf.width - 1) * hf.cellMeters
  const spanY = (hf.height - 1) * hf.cellMeters
  let lengthM = 0, gainM = 0, maxSlopeDeg = 0
  for (let i = 1; i < pts.length; i++) {
    const [u0, v0] = pts[i - 1], [u1, v1] = pts[i]
    const d = Math.hypot((u1 - u0) * spanX, (v1 - v0) * spanY)
    const dh = heightAt(hf, u1, v1) - heightAt(hf, u0, v0)
    lengthM += d
    if (dh > 0) gainM += dh
    if (d > 0) maxSlopeDeg = Math.max(maxSlopeDeg, (Math.atan(Math.abs(dh) / d) * 180) / Math.PI)
  }
  const hours = lengthM / 1000 / 4 + gainM / 300
  return { lengthM, gainM, maxSlopeDeg, minutes: Math.round(hours * 60) }
}
