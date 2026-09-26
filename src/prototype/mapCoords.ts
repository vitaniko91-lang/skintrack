import type { UV } from '../terrain/route'

export interface MapCrop { u0: number; u1: number; v0: number; v1: number; width: number; height: number }

/** UV всего тайла → пиксели кадра карты (тот же кадр, что вырезал build_map.py). */
export function uvToMap([u, v]: UV, c: MapCrop): [number, number] {
  return [((u - c.u0) / (c.u1 - c.u0)) * c.width, ((v - c.v0) / (c.v1 - c.v0)) * c.height]
}

export function polylinePoints(pts: readonly UV[], c: MapCrop): string {
  return pts.map((p) => uvToMap(p, c).map((n) => n.toFixed(1)).join(',')).join(' ')
}

/**
 * Uniform Catmull-Rom (tension 0.5) through the points, as cubic Béziers: the curve passes
 * through every point, so the route still lands exactly on each waypoint. Endpoints reuse
 * themselves as the phantom neighbour.
 */
export function smoothPath(pts: readonly (readonly [number, number])[]): string {
  const f = (n: number) => n.toFixed(1)
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]
  let d = `M ${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`
  }
  return d
}
