import { routeStats, ROUTE_UV, WAYPOINTS } from './route'
import type { Heightfield } from './decode'

function ramp(): Heightfield {
  // 3×3, высота растёт на 100 м за ячейку по x, ячейка 100 м → 45°
  const heights = new Float32Array([0, 100, 200, 0, 100, 200, 0, 100, 200])
  return { width: 3, height: 3, heights, minH: 0, maxH: 200, cellMeters: 100 }
}

describe('routeStats', () => {
  it('sums positive height gain only', () => {
    const s = routeStats(ramp(), [[0, 0.5], [1, 0.5], [0.5, 0.5]])
    expect(s.gainM).toBeCloseTo(200, 3)
  })
  it('measures horizontal length in metres', () => {
    const s = routeStats(ramp(), [[0, 0.5], [1, 0.5]])
    expect(s.lengthM).toBeCloseTo(200, 3)
  })
  it('reports the steepest segment', () => {
    const s = routeStats(ramp(), [[0, 0.5], [1, 0.5]])
    expect(s.maxSlopeDeg).toBeCloseTo(45, 3)
  })
  it('estimates time with Munter: 4 km/h flat + 300 m/h up', () => {
    const s = routeStats(ramp(), [[0, 0.5], [1, 0.5]])
    // 0.2 км / 4 + 200 м / 300 → 0.05 + 0.667 ч
    expect(s.minutes).toBe(Math.round((0.05 + 200 / 300) * 60))
  })
})

describe('route data', () => {
  it('has at least 6 points inside the tile', () => {
    expect(ROUTE_UV.length).toBeGreaterThanOrEqual(6)
    ROUTE_UV.forEach(([u, v]) => {
      expect(u).toBeGreaterThanOrEqual(0); expect(u).toBeLessThanOrEqual(1)
      expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1)
    })
  })
  it('waypoints reference existing route indices', () => {
    WAYPOINTS.forEach((w) => expect(w.index).toBeLessThan(ROUTE_UV.length))
  })
})
