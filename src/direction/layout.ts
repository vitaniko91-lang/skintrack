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

/**
 * Путь 2D-ленты через манифест: входит сверху справа (оттуда уходит 3D-хвост главы 02),
 * делает петлю вокруг акцентного слова и уходит вниз к главе 04. Всё — за краями кадра.
 */
export function manifestoPath(w: number, h: number, t: Rect): string {
  const f = (n: number) => n.toFixed(1)
  const cx = t.x + t.w / 2, cy = t.y + t.h / 2
  const rx = t.w / 2 + Math.max(24, t.h * 0.35), ry = t.h / 2 + Math.max(18, t.h * 0.3)
  const s = { x: w * 0.9, y: -h * 0.2 }
  const a = { x: cx + rx, y: cy - ry * 0.2 } // вход в петлю справа
  const e = { x: w * 0.62, y: h * 1.2 }
  return [
    `M${f(s.x)},${f(s.y)}`,
    // вниз по диагонали к правому краю слова
    `C${f(w * 0.98)},${f(h * 0.3)} ${f(a.x + rx * 0.9)},${f(a.y - ry * 1.6)} ${f(a.x)},${f(a.y)}`,
    // петля: под словом влево, вокруг левого края, над словом назад
    `C${f(a.x - rx * 0.1)},${f(cy + ry * 1.25)} ${f(cx - rx * 1.25)},${f(cy + ry * 1.1)} ${f(cx - rx)},${f(cy)}`,
    `C${f(cx - rx * 0.9)},${f(cy - ry * 1.35)} ${f(cx + rx * 0.7)},${f(cy - ry * 1.4)} ${f(cx + rx * 0.95)},${f(cy + ry * 0.2)}`,
    // и вниз, к следующей главе
    `C${f(cx + rx * 1.2)},${f(cy + ry * 2.6)} ${f(w * 0.5)},${f(h * 0.8)} ${f(e.x)},${f(e.y)}`,
  ].join(' ')
}
