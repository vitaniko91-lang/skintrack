import type { Heightfield } from './decode'

/** Швейцарская конвенция карт крутизны. Это данные безопасности, не бренд. */
export const SLOPE_BANDS = [
  { from: 30, label: '30–35°', color: '#f4d35e' },
  { from: 35, label: '35–40°', color: '#f08a24' },
  { from: 40, label: '40–45°', color: '#d7263d' },
  { from: 45, label: '≥ 45°', color: '#7b4fa3' },
] as const

/** 0 — ниже 30°, 1..4 — индекс полосы + 1 */
export function slopeBand(deg: number): number {
  let band = 0
  SLOPE_BANDS.forEach((b, i) => { if (deg >= b.from) band = i + 1 })
  return band
}

const grids = new WeakMap<Heightfield, Float32Array>()
const cells = new WeakMap<Heightfield, Float32Array>()

/** Крутизна ячейки (x, y) в градусах: центральные разности, на краях — односторонние. */
export function slopeAt(hf: Heightfield, x: number, y: number): number {
  const { width: w, height: h, heights, cellMeters: c } = hf
  const xa = Math.max(x - 1, 0), xb = Math.min(x + 1, w - 1)
  const ya = Math.max(y - 1, 0), yb = Math.min(y + 1, h - 1)
  const dzdx = (heights[y * w + xb] - heights[y * w + xa]) / ((xb - xa) * c)
  const dzdy = (heights[yb * w + x] - heights[ya * w + x]) / ((yb - ya) * c)
  return (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI
}

/**
 * Крутизна ячейки по индексу row-major, с ленивым кешем. Маршрут, карточки и лента читают
 * сотни ячеек из 262 тысяч — полная сетка (~50–100 мс atan) им не нужна.
 */
export function slopeCell(hf: Heightfield, i: number): number {
  let g = cells.get(hf)
  if (!g) { g = new Float32Array(hf.width * hf.height).fill(NaN); cells.set(hf, g) }
  let v = g[i]
  if (Number.isNaN(v)) { g[i] = slopeAt(hf, i % hf.width, Math.floor(i / hf.width)); v = g[i] } // читаем обратно: float32, как в сетке
  return v
}

/** Вся сетка крутизны (для текстур и геометрии). Один расчёт на карту высот; результат общий — не изменять. */
export function slopeGrid(hf: Heightfield): Float32Array {
  let g = grids.get(hf)
  if (!g) {
    g = new Float32Array(hf.width * hf.height)
    for (let y = 0; y < hf.height; y++) for (let x = 0; x < hf.width; x++) g[y * hf.width + x] = slopeAt(hf, x, y)
    grids.set(hf, g)
  }
  return g
}
