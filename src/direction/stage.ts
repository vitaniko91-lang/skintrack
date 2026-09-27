/**
 * Общее изменяемое состояние сцены: DOM-таймлайн GSAP пишет, useFrame читает.
 * Не React-состояние — 60 раз в секунду ререндер не нужен.
 */
export const stage = {
  /** прогресс закреплённого перехода 0..1 */
  p: 0,
  /** указатель, −1..1 — для параллакса камеры */
  px: 0,
  py: 0,
  /** начало 3D-ленты в пикселях экрана — сюда 2D-штрих с фото передаёт эстафету */
  rx: 0,
  ry: 0,
  /** false, пока сцена ни разу не спроецировала точку */
  rReady: false,
}

export const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
/** Прогресс отрезка [a, b] внутри общего 0..1. */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
