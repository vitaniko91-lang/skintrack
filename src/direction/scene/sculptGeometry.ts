import { BufferAttribute, PlaneGeometry } from 'three'
import { heightAt, type Heightfield } from '../../terrain/decode'
import { WORLD_SIZE, worldHeight } from '../../scene/terrainGeometry'

/** Радиус, за которым рельеф срезается: гора стоит на круглом постаменте, а не на квадрате тайла. */
export const RIM = 0.5
/** До этого радиуса рельеф настоящий; между INNER и RIM он плавно уходит в ноль. */
export const INNER = 0.4

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Множитель высоты по радиусу от центра тайла: 1 в центре, 0 на кромке. */
export function sculptFalloff(u: number, v: number): number {
  return smooth(RIM, INNER, Math.hypot(u - 0.5, v - 0.5))
}

/** Высота скульптуры в мировых единицах. Одна функция для горы и для ленты-трека. */
export function sculptHeight(hf: Heightfield, u: number, v: number): number {
  return worldHeight(hf, heightAt(hf, u, v)) * sculptFalloff(u, v)
}

export function uvToWorld(u: number, v: number): [number, number] {
  return [(u - 0.5) * WORLD_SIZE, (v - 0.5) * WORLD_SIZE]
}

/**
 * Рельеф-скульптура: плоскость с настоящими высотами DEM, треугольники за RIM выброшены.
 * aH — нормированная высота (0 у подножия, 1 на пике) для светящихся изолиний.
 */
export function buildSculptGeometry(hf: Heightfield, segments: number): PlaneGeometry {
  const g = new PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  const n = pos.count
  const aH = new Float32Array(n)
  const radius = new Float32Array(n)
  let top = 0
  for (let i = 0; i < n; i++) {
    const u = (i % (segments + 1)) / segments
    const v = Math.floor(i / (segments + 1)) / segments
    const y = sculptHeight(hf, u, v)
    pos.setY(i, y)
    top = Math.max(top, y)
    radius[i] = Math.hypot(u - 0.5, v - 0.5)
  }
  for (let i = 0; i < n; i++) aH[i] = top > 0 ? pos.getY(i) / top : 0
  g.setAttribute('aH', new BufferAttribute(aH, 1))

  const src = g.index!.array
  const kept: number[] = []
  for (let t = 0; t < src.length; t += 3) {
    const a = src[t], b = src[t + 1], c = src[t + 2]
    if ((radius[a] + radius[b] + radius[c]) / 3 <= RIM) kept.push(a, b, c)
  }
  g.setIndex(kept)
  g.computeVertexNormals()
  return g
}
