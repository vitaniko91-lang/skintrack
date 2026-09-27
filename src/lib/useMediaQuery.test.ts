import { renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

describe('useMediaQuery', () => {
  it('returns the current match', () => {
    window.matchMedia = ((q: string) => ({ matches: q === '(min-width: 1024px)' })) as never
    expect(renderHook(() => useMediaQuery('(min-width: 1024px)')).result.current).toBe(true)
    expect(renderHook(() => useMediaQuery('(min-width: 1536px)')).result.current).toBe(false)
  })
  it('is false when matchMedia is missing', () => {
    const saved = window.matchMedia
    // @ts-expect-error — окружение без matchMedia
    delete window.matchMedia
    expect(renderHook(() => useMediaQuery('(min-width: 1px)')).result.current).toBe(false)
    window.matchMedia = saved
  })
})
