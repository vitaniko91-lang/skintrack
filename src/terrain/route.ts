import { heightAt, type Heightfield } from './decode'
import { slopeGrid } from './slope'

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

const SLOPE_SAMPLE_STEPS = 20

/** Билинейная выборка из сеточного массива (та же схема, что heightAt в decode.ts). */
function sampleGrid(grid: Float32Array, w: number, h: number, u: number, v: number): number {
  const x = Math.min(Math.max(u, 0), 1) * (w - 1)
  const y = Math.min(Math.max(v, 0), 1) * (h - 1)
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1)
  const tx = x - x0, ty = y - y0
  const at = (cx: number, cy: number) => grid[cy * w + cx]
  const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx
  const bottom = at(x0, y1) * (1 - tx) + at(x1, y1) * tx
  return top * (1 - ty) + bottom * ty
}

export function routeStats(hf: Heightfield, pts: readonly UV[]): RouteStats {
  const spanX = (hf.width - 1) * hf.cellMeters
  const spanY = (hf.height - 1) * hf.cellMeters
  const grid = slopeGrid(hf)
  let lengthM = 0, gainM = 0, maxSlopeDeg = 0
  for (let i = 1; i < pts.length; i++) {
    const [u0, v0] = pts[i - 1], [u1, v1] = pts[i]
    const d = Math.hypot((u1 - u0) * spanX, (v1 - v0) * spanY)
    const dh = heightAt(hf, u1, v1) - heightAt(hf, u0, v0)
    lengthM += d
    if (dh > 0) gainM += dh
    // Хорда между точками маршрута (~500 м друг от друга) занижает крутизну —
    // берём максимум terrain-slope сетки, сэмплированный вдоль сегмента.
    for (let s = 0; s <= SLOPE_SAMPLE_STEPS; s++) {
      const t = s / SLOPE_SAMPLE_STEPS
      const u = u0 + (u1 - u0) * t
      const v = v0 + (v1 - v0) * t
      maxSlopeDeg = Math.max(maxSlopeDeg, sampleGrid(grid, hf.width, hf.height, u, v))
    }
  }
  // Метод Мюнтера для лыжного подъёма: базовый темп 4 км/ч, набор высоты
  // переводится в горизонтальный эквивалент (100 м набора ≈ 1 доп. км).
  const hours = (lengthM / 1000 + gainM / 100) / 4
  return { lengthM, gainM, maxSlopeDeg, minutes: Math.round(hours * 60) }
}
