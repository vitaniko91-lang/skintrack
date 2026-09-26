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

/** Крутизна в градусах для каждой ячейки (центральные разности, на краях — односторонние). */
export function slopeGrid(hf: Heightfield): Float32Array {
  const { width: w, height: h, heights, cellMeters: c } = hf
  const out = new Float32Array(w * h)
  const at = (x: number, y: number) => heights[y * w + x]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const xa = Math.max(x - 1, 0), xb = Math.min(x + 1, w - 1)
      const ya = Math.max(y - 1, 0), yb = Math.min(y + 1, h - 1)
      const dzdx = (at(xb, y) - at(xa, y)) / ((xb - xa) * c)
      const dzdy = (at(x, yb) - at(x, ya)) / ((yb - ya) * c)
      out[y * w + x] = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI
    }
  }
  return out
}
