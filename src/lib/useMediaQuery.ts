import { useSyncExternalStore } from 'react'

/** Совпадение медиа-запроса, живое: пересчитывается при смене ширины. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia?.(query)
      mql?.addEventListener?.('change', onChange)
      return () => mql?.removeEventListener?.('change', onChange)
    },
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  )
}
