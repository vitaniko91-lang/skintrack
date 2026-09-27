import { buildTerrainGeometry, edgeSink, WORLD_SIZE } from './terrainGeometry'
import type { Heightfield } from '../terrain/decode'

const hf: Heightfield = {
  width: 3, height: 3, cellMeters: 1000,
  heights: new Float32Array([0, 0, 0, 0, 1000, 0, 0, 0, 0]),
  minH: 0, maxH: 1000,
}

describe('buildTerrainGeometry', () => {
  const g = buildTerrainGeometry(hf, 2)
  it('creates (seg+1)² vertices', () => {
    expect(g.attributes.position.count).toBe(9)
  })
  it('puts the peak in the centre and highest', () => {
    const y = g.attributes.position.getY(4)
    expect(y).toBeGreaterThan(0)
    expect(g.attributes.position.getY(0)).toBe(0)
  })
  it('stores normalised height and slope per vertex', () => {
    expect(g.attributes.aHeight.getX(4)).toBe(1)
    expect(g.attributes.aHeight.getX(0)).toBe(0)
    expect(g.attributes.aSlope.getX(1)).toBeGreaterThan(0)
  })
  it('stores distance to the route per vertex (UV units)', () => {
    const r = buildTerrainGeometry(hf, 2, [[0, 0], [1, 1]])
    expect(r.attributes.aRouteDist).toBeDefined()
    expect(r.attributes.aRouteDist.getX(0)).toBe(0) // (0,0) лежит на маршруте
    expect(r.attributes.aRouteDist.getX(4)).toBe(0) // центр — тоже
    expect(r.attributes.aRouteDist.getX(2)).toBeCloseTo(Math.SQRT1_2, 5) // (1,0)
  })
  it('spans WORLD_SIZE on x', () => {
    g.computeBoundingBox()
    expect(g.boundingBox!.max.x - g.boundingBox!.min.x).toBeCloseTo(WORLD_SIZE, 5)
  })
})

describe('edgeSink', () => {
  it('leaves the centre untouched and sinks the corners', () => {
    expect(edgeSink(0.5, 0.5)).toBe(1)
    expect(edgeSink(0, 0)).toBeCloseTo(0.35, 5)
  })
  it('only falls with distance from the centre', () => {
    const d = [0.30, 0.42, 0.46, 0.50, 0.60].map((r) => edgeSink(0.5 + r, 0.5))
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThanOrEqual(d[i - 1])
  })
})
