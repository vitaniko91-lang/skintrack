/**
 * Чистая геометрия глав 02–03: проекция якорей маршрута в пиксели, раскладка карточек
 * у своих точек, участок опасной крутизны по настоящей сетке и путь 2D-ленты манифеста.
 */

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

/** NDC (−1..1, y вверх) → пиксели экрана (y вниз). */
export function ndcToScreen(nx: number, ny: number, w: number, h: number): Pt {
  return { x: (nx * 0.5 + 0.5) * w, y: (-ny * 0.5 + 0.5) * h }
}

/**
 * Карточка у своей точки: смещение (dx, dy) от якоря до ближайшего угла карточки —
 * знак задаёт сторону. Карточка остаётся в кадре с полем `margin`; `top` — высота,
 * которую занимает шапка (карточка под неё не заходит).
 */
export function placeCard(anchor: Pt, card: { w: number; h: number }, view: { w: number; h: number },
  off: Pt, margin = 16, top = 0): Rect {
  let x = off.x >= 0 ? anchor.x + off.x : anchor.x + off.x - card.w
  let y = off.y >= 0 ? anchor.y + off.y : anchor.y + off.y - card.h
  x = Math.min(Math.max(x, margin), view.w - margin - card.w)
  y = Math.min(Math.max(y, margin + top), view.h - margin - card.h)
  return { x, y, w: card.w, h: card.h }
}

const overlap = (a: Rect, b: Rect, gap: number) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap

/**
 * Разводит карточку с уже поставленными: сдвигает по вертикали на ближайшее свободное место
 * (вверх или вниз), не выходя из кадра. Если места нет — оставляет как было.
 */
export function avoid(r: Rect, placed: readonly Rect[], view: { w: number; h: number }, gap = 12, margin = 16, top = 0): Rect {
  const hits = placed.filter((p) => overlap(r, p, gap))
  if (!hits.length) return r
  const cands: number[] = []
  for (const p of placed) cands.push(p.y - gap - r.h, p.y + p.h + gap)
  const ok = cands
    .filter((y) => y >= margin + top && y + r.h <= view.h - margin)
    .map((y) => ({ ...r, y }))
    .filter((c) => !placed.some((p) => overlap(c, p, gap - 0.5)))
    .sort((a, b) => Math.abs(a.y - r.y) - Math.abs(b.y - r.y))
  return ok[0] ?? r
}

/** Точка на кромке прямоугольника, ближайшая к p, — туда приходит выноска от якоря. */
export function edgePoint(r: Rect, p: Pt): Pt {
  const x = Math.min(Math.max(p.x, r.x), r.x + r.w)
  const y = Math.min(Math.max(p.y, r.y), r.y + r.h)
  if (x !== p.x || y !== p.y) return { x, y }
  // якорь внутри карточки — ведём к ближайшей стороне
  const d = [p.x - r.x, r.x + r.w - p.x, p.y - r.y, r.y + r.h - p.y]
  const i = d.indexOf(Math.min(...d))
  return [{ x: r.x, y: p.y }, { x: r.x + r.w, y: p.y }, { x: p.x, y: r.y }, { x: p.x, y: r.y + r.h }][i]
}

/**
 * Непрерывный участок, где крутизна ≥ threshold, в долях 0..1 вдоль выборки.
 * Провалы короче `gap` точек склеиваются (кулуар не рвётся на полке).
 * `near` (доля 0..1) — берём участок, содержащий эту точку или ближайший к ней;
 * без него — самый длинный. null — такого участка нет.
 */
export function hazardSpan(slopes: readonly number[], threshold: number, opts: { gap?: number; near?: number } = {}): [number, number] | null {
  const n = slopes.length
  if (n < 2) return null
  const gap = opts.gap ?? 0
  const runs: [number, number][] = []
  let start = -1
  for (let i = 0; i <= n; i++) {
    const on = i < n && slopes[i] >= threshold
    if (on && start < 0) start = i
    if (!on && start >= 0) { runs.push([start, i - 1]); start = -1 }
  }
  const merged: [number, number][] = []
  for (const r of runs) {
    const last = merged[merged.length - 1]
    if (last && r[0] - last[1] - 1 <= gap) last[1] = r[1]
    else merged.push([r[0], r[1]])
  }
  if (!merged.length) return null
  let best = merged[0]
  if (opts.near !== undefined) {
    const k = opts.near * (n - 1)
    const dist = (r: [number, number]) => (k < r[0] ? r[0] - k : k > r[1] ? k - r[1] : 0)
    for (const r of merged) if (dist(r) < dist(best)) best = r
  } else {
    for (const r of merged) if (r[1] - r[0] > best[1] - best[0]) best = r
  }
  return [best[0] / (n - 1), best[1] / (n - 1)]
}

export function formatKm(m: number): string {
  return `${(m / 1000).toFixed(2)} km`
}

export function formatElevation(m: number): string {
  return `${Math.round(m).toLocaleString('en-US')} m`
}

/** Отрезок Эрмита (точка + касательная на концах) → кубическая Безье. */
export interface Knot { x: number; y: number; tx: number; ty: number; k?: number }

export function hermite(pts: Knot[]): string {
  const f = (n: number) => n.toFixed(1)
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    const L = Math.hypot(b.x - a.x, b.y - a.y) / 3
    const na = Math.hypot(a.tx, a.ty) || 1, nb = Math.hypot(b.tx, b.ty) || 1
    const la = L * (a.k ?? 1), lb = L * (b.k ?? 1)
    d += ` C${f(a.x + (a.tx / na) * la)},${f(a.y + (a.ty / na) * la)} ${f(b.x - (b.tx / nb) * lb)},${f(b.y - (b.ty / nb) * lb)} ${f(b.x)},${f(b.y)}`
  }
  return d
}

/** Точки вдоль пути из M + C-сегментов (только то, что строит этот модуль): n точек на сегмент. */
export function samplePath(d: string, n: number): Pt[] {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const out: Pt[] = [{ x: nums[0], y: nums[1] }]
  for (let i = 2; i + 5 < nums.length; i += 6) {
    const [x0, y0] = [out[out.length - 1].x, out[out.length - 1].y]
    const [x1, y1, x2, y2, x3, y3] = nums.slice(i, i + 6)
    for (let j = 1; j <= n; j++) {
      const t = j / n, u = 1 - t
      out.push({
        x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      })
    }
  }
  return out
}

/**
 * Длина пути и n+1 точек через равные доли длины — то же, что getTotalLength +
 * getPointAtLength(i / n · L), но в чистом JS: 400 вызовов getPointAtLength на
 * длинном пути стоили ~300 мс главного потока при загрузке.
 */
export function arcLut(d: string, n: number, perSeg = 96): { L: number; pts: [number, number][] } {
  const poly = samplePath(d, perSeg)
  const cum = new Float64Array(poly.length)
  for (let i = 1; i < poly.length; i++) cum[i] = cum[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y)
  const L = cum[poly.length - 1]
  const pts: [number, number][] = []
  let j = 1
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * L
    while (j < poly.length - 1 && cum[j] < s) j++
    const seg = cum[j] - cum[j - 1] || 1, t = Math.min(Math.max((s - cum[j - 1]) / seg, 0), 1)
    pts.push([poly[j - 1].x + (poly[j].x - poly[j - 1].x) * t, poly[j - 1].y + (poly[j].y - poly[j - 1].y) * t])
  }
  return { L, pts }
}

/**
 * Путь 2D-ленты через манифест: входит сверху справа (оттуда уходит 3D-хвост главы 02),
 * проходит НАД фразой справа налево, огибает её левый край и уходит под строками
 * вниз, к главе 04. Буквы не пересекает ни в одной точке — ленту видно, текст читается.
 * `t` — габарит всей фразы (все строки).
 */
export function manifestoPath(w: number, h: number, t: Rect): string {
  const g = Math.max(22, Math.min(64, t.h * 0.16)) // зазор от текста
  const r = Math.max(18, g * 0.8) // вылет петли за левый край
  const top = t.y - g, bot = t.y + t.h + g
  return hermite([
    { x: w * 0.9, y: -h * 0.2, tx: -0.35, ty: 1 },
    { x: Math.max(t.x + t.w * 0.55, w * 0.6), y: top, tx: -1, ty: 0.06 },
    { x: t.x - r * 0.55, y: t.y - g * 0.45, tx: -0.8, ty: 1, k: 0.8 },
    { x: t.x - r, y: t.y + t.h / 2, tx: 0, ty: 1, k: 0.8 },
    { x: t.x - r * 0.55, y: t.y + t.h + g * 0.45, tx: 0.8, ty: 1, k: 0.8 },
    { x: t.x + Math.min(t.w * 0.18, 140), y: bot, tx: 1, ty: 0.05 },
    { x: w * 0.7, y: h * 1.2, tx: 0.55, ty: 1 },
  ])
}
