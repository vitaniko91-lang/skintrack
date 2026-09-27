import { useEffect, useState } from 'react'
import type { Heightfield } from './decode'
import { loadHeightfield } from './loadHeightfield'
import { routeStats, ROUTE_UV, type RouteStats } from './route'

let cached: Promise<Heightfield> | null = null

/** Одна загрузка карты высот на страницу: её читают и 3D-сцена, и телефон. */
export function loadHeightfieldOnce(): Promise<Heightfield> {
  cached ??= loadHeightfield().catch((error: unknown) => {
    cached = null
    throw error
  })
  return cached
}

/** Только для тестов. */
export function resetHeightfieldCache() {
  cached = null
}

let statsCache: Promise<RouteStats> | null = null

/**
 * Одна расчёт статистики маршрута (и, внутри неё, slopeGrid по всей карте высот) на страницу —
 * телефон, 3D-сцена и что угодно ещё видят один и тот же промис, а не пересчитывают его каждый
 * при собственном рендере.
 */
export function loadRouteStatsOnce(): Promise<RouteStats> {
  statsCache ??= loadHeightfieldOnce()
    .then((hf) => routeStats(hf, ROUTE_UV))
    .catch((error: unknown) => {
      statsCache = null
      throw error
    })
  return statsCache
}

/** Только для тестов. */
export function resetRouteStatsCache() {
  statsCache = null
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}

export function formatRouteStats(s: RouteStats): { label: string; value: string }[] {
  return [
    { label: 'max slope', value: `${Math.round(s.maxSlopeDeg)}°` },
    // до 10 м, как на топокартах: «999 m» читается как заглушка, а точнее 10 м DEM не даёт
    { label: 'gain', value: `${(Math.round(s.gainM / 10) * 10).toLocaleString('en-US')} m` },
    { label: 'time', value: formatDuration(s.minutes) },
  ]
}

/** Статистика маршрута по реальной карте высот; null, пока карта грузится или не загрузилась. */
export function useRouteStats(): RouteStats | null {
  const [stats, setStats] = useState<RouteStats | null>(null)
  useEffect(() => {
    let alive = true
    loadRouteStatsOnce()
      .then((s) => { if (alive) setStats(s) })
      .catch(() => { /* сводка просто остаётся пустой — сцена показывает свой фолбэк */ })
    return () => { alive = false }
  }, [])
  return stats
}
