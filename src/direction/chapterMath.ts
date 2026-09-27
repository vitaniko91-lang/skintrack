/**
 * Чистая логика глав 04 и 06: место телефона в «карусели», его 3D-поза, путь ленты
 * в экран и фазы финала. Без DOM — тестируется отдельно.
 */
import type { Pt } from './layout'

export type Slot = 'front' | 'left' | 'right' | 'back'

/** Место телефона i при активном экране `active` из n: впереди, слева (предыдущий), справа (следующий), сзади. */
export function slotOf(i: number, active: number, n: number): Slot {
  const d = (((i - active) % n) + n) % n
  if (d === 0) return 'front'
  if (d === 1) return 'right'
  if (d === n - 1) return 'left'
  return 'back'
}

/**
 * Поза телефона: сдвиг в долях его ширины/высоты, глубина (px), повороты (deg),
 * масштаб, затемнение 0..1, непрозрачность.
 */
export interface Pose { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; dim: number; op: number }

/** Наклонная тройка (RideOn): активный впереди почти анфас, соседи уходят вглубь с разворотом. */
export const SLOT_POSE: Record<Slot, Pose> = {
  front: { x: 0, y: 0, z: 0, rx: 8, ry: -15, rz: -5, s: 1, dim: 0, op: 1 },
  left: { x: -0.86, y: 0.1, z: -380, rx: 12, ry: 34, rz: -22, s: 1, dim: 0.22, op: 1 },
  right: { x: 0.8, y: -0.08, z: -420, rx: 6, ry: -36, rz: 16, s: 1, dim: 0.12, op: 1 },
  back: { x: 0, y: -0.06, z: -700, rx: 0, ry: 0, rz: 0, s: 0.9, dim: 0.8, op: 0 },
}

/** Исходная поза въезда: ровный ряд экранов (как ряд из четырёх у RideOn), ниже кадра. */
export const ROW_POSE: Record<Slot, Pose> = {
  front: { x: 0, y: 0.34, z: 0, rx: 0, ry: 0, rz: 0, s: 0.86, dim: 0, op: 0 },
  left: { x: -1.08, y: 0.4, z: 0, rx: 0, ry: 0, rz: 0, s: 0.86, dim: 0.3, op: 0 },
  right: { x: 1.08, y: 0.46, z: 0, rx: 0, ry: 0, rz: 0, s: 0.86, dim: 0.3, op: 0 },
  back: { x: 0, y: 0.5, z: -700, rx: 0, ry: 0, rz: 0, s: 0.86, dim: 0.8, op: 0 },
}

const KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'dim', 'op'] as const

export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const o = {} as Pose
  for (const key of KEYS) o[key] = a[key] + (b[key] - a[key]) * k
  return o
}

/** Шаг к цели с независимой от частоты кадров скоростью (экспоненциальное сглаживание). */
export function approach(cur: Pose, target: Pose, dt: number, rate = 7): Pose {
  return mixPose(cur, target, 1 - Math.exp(-rate * dt))
}

export function poseEqual(a: Pose, b: Pose, eps = 0.002): boolean {
  return KEYS.every((k) => Math.abs(a[k] - b[k]) < (k === 'z' ? 0.5 : eps))
}

/** Лёгкое парение: смещение по y (px) для телефона i в момент t (с); у каждого своя фаза. */
export function floatY(i: number, t: number, amp = 7): number {
  return Math.sin(t * 0.9 + i * 1.9) * amp
}

/** CSS transform телефона шириной w и высотой h (px) при общем масштабе fit. */
export function poseTransform(p: Pose, w: number, h: number, fit: number, tilt: Pt = { x: 0, y: 0 }, lift = 0): string {
  const f = (n: number, d = 2) => n.toFixed(d)
  return `translate3d(${f(p.x * w * fit, 1)}px,${f(p.y * h * fit + lift, 1)}px,${f(p.z * fit, 1)}px) `
    + `rotateX(${f(p.rx - tilt.y)}deg) rotateY(${f(p.ry + tilt.x)}deg) rotateZ(${f(p.rz)}deg) scale(${f(p.s * fit, 4)})`
}

/**
 * Путь ленты сверху кадра в экран телефона: уходит из `from` вертикально вниз
 * (продолжение хвоста главы 03) и входит в точку старта маршрута сверху-справа.
 */
export function screenRibbonPath(from: Pt, to: Pt): string {
  const d = Math.hypot(to.x - from.x, to.y - from.y)
  const f = (n: number) => n.toFixed(1)
  const c1 = { x: from.x, y: from.y + d * 0.55 }
  const c2 = { x: to.x + d * 0.3, y: to.y - d * 0.42 }
  return `M${f(from.x)},${f(from.y)} C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(to.x)},${f(to.y)}`
}

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

/**
 * Фазы главы 04 по прогрессу закреплённой части r (0..1): лента рисуется, в момент
 * касания экрана маршрут строится, лента втягивается в точку старта.
 */
export function tryPhases(r: number) {
  return {
    draw: span(r, 0.02, 0.4),
    erase: span(r, 0.46, 0.66),
    /** лента коснулась экрана — пора строить маршрут в живом прототипе */
    build: r >= 0.4,
  }
}

/**
 * Фазы финала по прогрессу r: лента влетает и ведёт по вордмарку (её голова открывает
 * контур букв), затем буквы заливаются, лента уходит с хвоста, появляются кнопки.
 */
export function finalePhases(r: number) {
  const draw = span(r, 0, 0.5)
  return {
    draw,
    erase: span(r, 0.62, 0.86),
    fill: span(r, 0.5, 0.66),
    ui: span(r, 0.58, 0.74),
  }
}

/** Наклон карточки за курсором: u, v — положение указателя в карточке 0..1. */
export function tiltFor(u: number, v: number, max: number) {
  const c = (n: number) => Math.min(Math.max(n, 0), 1)
  return { rx: (0.5 - c(v)) * 2 * max, ry: (c(u) - 0.5) * 2 * max }
}

interface Box { x: number; y: number; w: number; h: number }

/**
 * Лента главы 05 по щелям доски: [шлем (высокая слева), часы (широкая справа сверху),
 * бутылка, шапка (нижний ряд справа)]. Входит сверху по щели шлем|часы, поворачивает
 * в щель между рядами, уходит вниз между бутылкой и шапкой — к финалу.
 */
export function gearRibbonPath(r: readonly Box[], w: number, h: number): string {
  const [helmet, watch, bottle, beanie] = r
  const x1 = (helmet.x + helmet.w + watch.x) / 2
  const gy = (watch.y + watch.h + bottle.y) / 2
  const x2 = (bottle.x + bottle.w + beanie.x) / 2
  // поворот концентричен скруглению карточек (40) плюс полщели — лента огибает угол, а не режет его
  const turn = Math.min(52, (x2 - x1) / 2.5)
  const f = (n: number) => n.toFixed(1)
  void w
  return [
    `M${f(x1)},${f(-60)}`,
    `L${f(x1)},${f(gy - turn)}`,
    `C${f(x1)},${f(gy - turn * 0.35)} ${f(x1 + turn * 0.35)},${f(gy)} ${f(x1 + turn)},${f(gy)}`,
    `L${f(x2 - turn)},${f(gy)}`,
    `C${f(x2 - turn * 0.35)},${f(gy)} ${f(x2)},${f(gy + turn * 0.35)} ${f(x2)},${f(gy + turn)}`,
    `L${f(x2)},${f(h + 60)}`,
  ].join(' ')
}
