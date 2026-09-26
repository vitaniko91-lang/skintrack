import { BufferAttribute, PlaneGeometry } from 'three'
import { heightAt, type Heightfield } from '../terrain/decode'
import { slopeGrid } from '../terrain/slope'
import { distanceToPolyline, ROUTE_UV, type UV } from '../terrain/route'

export const WORLD_SIZE = 10
/** Вертикальное преувеличение: на экране горы читаются плоскими без него. */
export const EXAGGERATION = 1.35

export function worldHeight(hf: Heightfield, meters: number): number {
  const spanMeters = (hf.width - 1) * hf.cellMeters
  return ((meters - hf.minH) / spanMeters) * WORLD_SIZE * EXAGGERATION
}

export function buildTerrainGeometry(
  hf: Heightfield, segments: number, route: readonly UV[] = ROUTE_UV,
): PlaneGeometry {
  const g = new PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments)
  g.rotateX(-Math.PI / 2) // строка 0 PlaneGeometry (верх) → z = -size/2 → север
  const slopes = slopeGrid(hf)
  const pos = g.attributes.position
  const n = pos.count
  const aHeight = new Float32Array(n)
  const aSlope = new Float32Array(n)
  /** расстояние до маршрута в UV — коридор, где слой крутизны горит в полную силу */
  const aRouteDist = new Float32Array(n)
  const range = hf.maxH - hf.minH || 1

  for (let i = 0; i < n; i++) {
    const col = i % (segments + 1)
    const row = Math.floor(i / (segments + 1))
    const u = col / segments
    const v = row / segments
    const h = heightAt(hf, u, v)
    pos.setY(i, worldHeight(hf, h))
    aHeight[i] = (h - hf.minH) / range
    const sx = Math.round(u * (hf.width - 1))
    const sy = Math.round(v * (hf.height - 1))
    aSlope[i] = slopes[sy * hf.width + sx]
    aRouteDist[i] = distanceToPolyline(u, v, route)
  }
  g.setAttribute('aHeight', new BufferAttribute(aHeight, 1))
  g.setAttribute('aSlope', new BufferAttribute(aSlope, 1))
  g.setAttribute('aRouteDist', new BufferAttribute(aRouteDist, 1))
  g.computeVertexNormals()
  return g
}
