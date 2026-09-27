import { buildFacetedSculpt, buildSculptGeometry, sculptFalloff, sculptHeight, smoothHeightfield, RIM } from './sculptGeometry'
import { buildRibbon } from './ribbonGeometry'
import { ROUTE_UV } from '../../terrain/route'
import type { Heightfield } from '../../terrain/decode'

/** Синтетический конус: пик в центре — достаточно, чтобы проверить посадку ленты. */
function cone(size = 65): Heightfield {
  const heights = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x / (size - 1) - 0.5, y / (size - 1) - 0.5)
    heights[y * size + x] = 2000 + 2000 * Math.max(0, 1 - d * 2)
  }
  return { width: size, height: size, heights, minH: 2000, maxH: 4000, cellMeters: 100 }
}

describe('sculpt', () => {
  it('falls to zero at the rim and stays whole in the middle', () => {
    expect(sculptFalloff(0.5, 0.5)).toBe(1)
    expect(sculptFalloff(0.5 + RIM, 0.5)).toBe(0)
  })

  it('meets the ground at the rim', () => {
    expect(sculptHeight(cone(), 0.5 + RIM, 0.5)).toBeCloseTo(0, 5)
  })

  it('smoothing keeps size and mean height', () => {
    const hf = cone()
    const s = smoothHeightfield(hf)
    const mean = (a: Float32Array) => a.reduce((x, y) => x + y, 0) / a.length
    expect(s.heights.length).toBe(hf.heights.length)
    expect(Math.abs(mean(s.heights) - mean(hf.heights))).toBeLessThan(15)
    expect(Math.max(...s.heights)).toBeLessThan(Math.max(...hf.heights))
  })

  it('drops every triangle outside the rim', () => {
    const g = buildSculptGeometry(cone(), 32)
    const pos = g.attributes.position
    const idx = g.index!.array
    for (let i = 0; i < idx.length; i++) {
      const x = pos.getX(idx[i]), z = pos.getZ(idx[i])
      expect(Math.hypot(x, z)).toBeLessThan(10 * RIM + 0.5)
    }
    expect(idx.length).toBeLessThan(32 * 32 * 6)
  })
})

describe('ribbon', () => {
  const hf = cone()
  const r = buildRibbon(hf, ROUTE_UV, { routeSamples: 60, tailSamples: 30, lift: 0.05 })

  it('sits on the sculpture along the route', () => {
    const uv = ROUTE_UV[ROUTE_UV.length - 1]
    const lastRoute = r.centre[60]
    expect(lastRoute.y).toBeCloseTo(sculptHeight(hf, uv[0], uv[1]) + 0.05, 5)
  })

  it('tail leaves the mountain upward, and routeEnd splits the length', () => {
    expect(r.centre[r.centre.length - 1].y).toBeGreaterThan(r.centre[60].y + 3)
    expect(r.routeEnd).toBeGreaterThan(0.2)
    expect(r.routeEnd).toBeLessThan(0.9)
  })

  it('draw parameter runs 0 → 1 monotonically', () => {
    const t = r.geometry.attributes.aT.array
    expect(t[0]).toBe(0)
    expect(t[t.length - 1]).toBeCloseTo(1, 6)
    for (let i = 2; i < t.length; i += 2) expect(t[i]).toBeGreaterThanOrEqual(t[i - 2])
  })
})

describe('faceted sculpt', () => {
  const hf = cone()
  const f = buildFacetedSculpt(hf, 16, 0)

  it('is coarse: a few hundred triangles, flat per-face normals', () => {
    const tris = f.geometry.attributes.position.count / 3
    expect(tris).toBeGreaterThan(200)
    expect(tris).toBeLessThan(16 * 16 * 2)
    const nrm = f.geometry.attributes.normal
    expect(nrm.getX(0)).toBeCloseTo(nrm.getX(1), 5)
    expect(nrm.getY(0)).toBeCloseTo(nrm.getY(2), 5)
  })

  it('puts the peak exactly on a vertex', () => {
    const top = f.heightAt(f.peak[0], f.peak[1])
    expect(top).toBeCloseTo(sculptHeight(hf, f.peak[0], f.peak[1]), 4)
  })

  it('heightAt matches mesh vertices', () => {
    const pos = f.geometry.attributes.position
    for (let k = 0; k < 30; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k)
      expect(f.heightAt(x / 10 + 0.5, z / 10 + 0.5)).toBeCloseTo(y, 3)
    }
  })
})

describe('ribbon anchors', () => {
  it('vertexSample lands within one sample of the route vertices', () => {
    const r = buildRibbon(cone(), ROUTE_UV)
    for (const k of [0, 4, ROUTE_UV.length - 1]) {
      const [u, v] = r.routeUV[r.vertexSample(k)]
      expect(u).toBeCloseTo(ROUTE_UV[k][0], 2)
      expect(v).toBeCloseTo(ROUTE_UV[k][1], 2)
    }
  })
})
