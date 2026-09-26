export interface Heightfield {
  width: number
  height: number
  /** высоты в метрах, row-major, строка 0 — север */
  heights: Float32Array
  minH: number
  maxH: number
  /** расстояние между соседними ячейками, м */
  cellMeters: number
}

export function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768
}

export function heightfieldFromRGBA(
  rgba: Uint8ClampedArray, width: number, height: number, cellMeters: number,
): Heightfield {
  const heights = new Float32Array(width * height)
  let minH = Infinity
  let maxH = -Infinity
  for (let i = 0; i < width * height; i++) {
    const h = decodeTerrarium(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2])
    heights[i] = h
    if (h < minH) minH = h
    if (h > maxH) maxH = h
  }
  return { width, height, heights, minH, maxH, cellMeters }
}

/** u, v в [0,1]; u — запад→восток, v — север→юг */
export function heightAt(hf: Heightfield, u: number, v: number): number {
  const x = Math.min(Math.max(u, 0), 1) * (hf.width - 1)
  const y = Math.min(Math.max(v, 0), 1) * (hf.height - 1)
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, hf.width - 1), y1 = Math.min(y0 + 1, hf.height - 1)
  const tx = x - x0, ty = y - y0
  const at = (cx: number, cy: number) => hf.heights[cy * hf.width + cx]
  const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx
  const bottom = at(x0, y1) * (1 - tx) + at(x1, y1) * tx
  return top * (1 - ty) + bottom * ty
}
