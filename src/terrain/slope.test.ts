import { slopeGrid, slopeBand, SLOPE_BANDS } from './slope'
import type { Heightfield } from './decode'

function plane(deg: number, n = 5, cell = 10): Heightfield {
  const heights = new Float32Array(n * n)
  const rise = Math.tan((deg * Math.PI) / 180) * cell
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) heights[y * n + x] = x * rise
  return { width: n, height: n, heights, minH: 0, maxH: (n - 1) * rise, cellMeters: cell }
}

describe('slopeGrid', () => {
  it('measures a 35° plane as 35° in the interior', () => {
    const s = slopeGrid(plane(35))
    expect(s[2 * 5 + 2]).toBeCloseTo(35, 3)
  })
  it('flat ground is 0°', () => {
    const s = slopeGrid(plane(0))
    expect(s[12]).toBe(0)
  })
  it('edges use one-sided differences, not zero', () => {
    const s = slopeGrid(plane(30))
    expect(s[0]).toBeCloseTo(30, 3)
  })
})

describe('slopeBand', () => {
  it.each([
    [29.9, 0], [30, 1], [34.9, 1], [35, 2], [39.9, 2], [40, 3], [44.9, 3], [45, 4], [60, 4],
  ])('%f° → band %i', (deg, band) => {
    expect(slopeBand(deg)).toBe(band)
  })
  it('has four coloured bands', () => {
    expect(SLOPE_BANDS).toHaveLength(4)
  })
})
