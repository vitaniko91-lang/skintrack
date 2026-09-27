import { BufferAttribute, BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three'
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

export interface Faceted {
  geometry: BufferGeometry
  /** высота граней в точке (u, v) — по ней сажается лента, чтобы не тонуть и не парить */
  heightAt: (u: number, v: number) => number
  /** uv вершины-пика (сетка сдвинута так, чтобы пик попал ровно в вершину) */
  peak: [number, number]
}

/**
 * Гранёный хром: грубая сетка seg×seg (крупные плоские треугольники), пик ровно в вершине,
 * плоские нормали на каждый треугольник — отражения ложатся длинными чистыми полосами,
 * как на кольцах TLC, вместо ряби на каждом бугре DEM.
 */
export function buildFacetedSculpt(hf: Heightfield, seg: number, soften = 0.4): Faceted {
  let pi = 0
  for (let i = 1; i < hf.heights.length; i++) if (hf.heights[i] > hf.heights[pi]) pi = i
  const peak: [number, number] = [(pi % hf.width) / (hf.width - 1), Math.floor(pi / hf.width) / (hf.height - 1)]
  const ou = peak[0] - Math.round(peak[0] * seg) / seg
  const ov = peak[1] - Math.round(peak[1] * seg) / seg
  const n = seg + 1
  const H = new Float32Array(n * n)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u = i / seg + ou, v = j / seg + ov
    H[j * n + i] = sculptHeight(hf, Math.min(Math.max(u, 0), 1), Math.min(Math.max(v, 0), 1))
  }
  const pos: number[] = []
  const aR: number[] = []
  const aH: number[] = []
  const top = Math.max(...H)
  const push = (i: number, j: number) => {
    const u = i / seg + ou, v = j / seg + ov
    const [x, z] = uvToWorld(u, v)
    const y = H[j * n + i]
    pos.push(x, y, z)
    aR.push(Math.hypot(u - 0.5, v - 0.5))
    aH.push(Math.max(y, 0) / top)
  }
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const cu = (i + 0.5) / seg + ou, cv = (j + 0.5) / seg + ov
    if (Math.hypot(cu - 0.5, cv - 0.5) > RIM) continue
    // та же раскладка, что у PlaneGeometry: a(i,j) b(i,j+1) c(i+1,j+1) d(i+1,j)
    push(i, j); push(i, j + 1); push(i + 1, j)
    push(i, j + 1); push(i + 1, j + 1); push(i + 1, j)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aR', new Float32BufferAttribute(aR, 1))
  g.setAttribute('aH', new Float32BufferAttribute(aH, 1))
  g.computeVertexNormals() // неиндексированная геометрия → нормаль на грань
  // Чуть подмешиваем гладкую нормаль сетки: грань остаётся плоской по силуэту, но блик
  // скользит по ней градиентом — длинная полоса, а не белая плитка «диско-шара».
  if (soften > 0) {
    const cell = WORLD_SIZE / seg
    const nrm = g.attributes.normal as Float32BufferAttribute
    const at = (i: number, j: number) => H[Math.min(Math.max(j, 0), seg) * n + Math.min(Math.max(i, 0), seg)]
    for (let k = 0; k < nrm.count; k++) {
      const x = pos[k * 3], z = pos[k * 3 + 2]
      const i = Math.round(((x / WORLD_SIZE + 0.5) - ou) * seg), j = Math.round(((z / WORLD_SIZE + 0.5) - ov) * seg)
      let sx = -(at(i + 1, j) - at(i - 1, j)) / (2 * cell), sz = -(at(i, j + 1) - at(i, j - 1)) / (2 * cell), sy = 1
      const l = Math.hypot(sx, sy, sz); sx /= l; sy /= l; const szn = sz / l
      let nx = nrm.getX(k) * (1 - soften) + sx * soften
      let ny = nrm.getY(k) * (1 - soften) + sy * soften
      let nz = nrm.getZ(k) * (1 - soften) + szn * soften
      const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m
      nrm.setXYZ(k, nx, ny, nz)
    }
  }

  const heightAt = (u: number, v: number) => {
    const x = Math.min(Math.max((u - ou) * seg, 0), seg - 1e-6)
    const y = Math.min(Math.max((v - ov) * seg, 0), seg - 1e-6)
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j
    const a = H[j * n + i], b = H[(j + 1) * n + i], c = H[(j + 1) * n + i + 1], d = H[j * n + i + 1]
    return fx + fy <= 1 ? a + (d - a) * fx + (b - a) * fy : c + (b - c) * (1 - fx) + (d - c) * (1 - fy)
  }
  return { geometry: g, heightAt, peak }
}
