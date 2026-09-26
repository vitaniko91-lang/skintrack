import type { UV } from '../terrain/route'

export interface MapCrop { u0: number; u1: number; v0: number; v1: number; width: number; height: number }

/** UV всего тайла → пиксели кадра карты (тот же кадр, что вырезал build_map.py). */
export function uvToMap([u, v]: UV, c: MapCrop): [number, number] {
  return [((u - c.u0) / (c.u1 - c.u0)) * c.width, ((v - c.v0) / (c.v1 - c.v0)) * c.height]
}

export function polylinePoints(pts: readonly UV[], c: MapCrop): string {
  return pts.map((p) => uvToMap(p, c).map((n) => n.toFixed(1)).join(',')).join(' ')
}
