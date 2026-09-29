import { slopeGrid, slopeBand, slopeCell, SLOPE_BANDS } from './slope'
import type { Heightfield } from './decode'

function plane(deg: number, n = 5, cell = 10): Heightfield {
  const heights = new Float32Array(n * n)
  const rise = Math.tan((deg * Math.PI) / 180) * cell
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) heights[y * n + x] = x * rise
  return { width: n, height: n, heights, minH: 0, maxH: (n - 1) * rise, cellMeters: cell }
}

describe('slopeGrid', () => {
  it('slopeCell reads the same numbers as the full grid, one cell at a time', () => {
    const hf = plane(0, 6)
    hf.heights.forEach((_, i) => { hf.heights[i] = Math.sin(i * 1.7) * 40 + (i % 6) * 9 })
    const g = slopeGrid(hf)
    for (let i = 0; i < g.length; i++) expect(slopeCell(hf, i)).toBe(g[i])
  })
  it('computes a heightfield once: the page asks for it from three places', () => {
    const hf = plane(20)
    expect(slopeGrid(hf)).toBe(slopeGrid(hf))
    expect(slopeGrid(plane(20))).not.toBe(slopeGrid(hf))
  })
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
