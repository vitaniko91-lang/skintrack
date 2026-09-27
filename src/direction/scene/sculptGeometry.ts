import { BufferAttribute, PlaneGeometry } from 'three'
import { heightAt, type Heightfield } from '../../terrain/decode'
import { WORLD_SIZE, worldHeight } from '../../scene/terrainGeometry'

/** Радиус, за которым рельеф срезается: гора стоит на круглом постаменте, а не на квадрате тайла. */
export const RIM = 0.5
/** До этого радиуса рельеф настоящий; между INNER и RIM он плавно уходит в ноль. */
export const INNER = 0.3
/** С этого радиуса поверхность гаснет в чёрное (шейдер): кромки не видно, «торта» нет. */
export const FADE_FROM = 0.36

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

/**
 * Сглаженная копия карты высот (два прохода box-blur радиуса r).
 * Хром отражает каждую ступеньку DEM как блик-крошку; сглаживание оставляет форму
 * и снимает «серые пятна» на отражении.
 */
export function smoothHeightfield(hf: Heightfield, r = 2, passes = 2): Heightfield {
  const { width: w, height: h } = hf
  let src = Float32Array.from(hf.heights)
  let dst = new Float32Array(w * h)
  for (let pass = 0; pass < passes; pass++) {
    for (const horiz of [true, false]) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let sum = 0, n = 0
        for (let k = -r; k <= r; k++) {
          const xx = horiz ? Math.min(Math.max(x + k, 0), w - 1) : x
          const yy = horiz ? y : Math.min(Math.max(y + k, 0), h - 1)
          sum += src[yy * w + xx]; n++
        }
        dst[y * w + x] = sum / n
      }
      ;[src, dst] = [dst, src]
    }
  }
  return { ...hf, heights: src }
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
  for (let i = 0; i < n; i++) aH[i] = top > 0 ? Math.max(pos.getY(i), 0) / top : 0
  g.setAttribute('aH', new BufferAttribute(aH, 1))
  g.setAttribute('aR', new BufferAttribute(radius, 1))

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
