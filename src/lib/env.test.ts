import { prefersReducedMotion, canUseWebGL } from './env'

describe('prefersReducedMotion', () => {
  it('reads matchMedia', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never
    expect(prefersReducedMotion()).toBe(true)
  })
  it('honours ?static for poster capture', () => {
    window.matchMedia = (() => ({ matches: false })) as never
    expect(prefersReducedMotion('?static')).toBe(true)
    expect(prefersReducedMotion('')).toBe(false)
  })
})

describe('canUseWebGL', () => {
  it('is false when no context can be created (jsdom)', () => {
    expect(canUseWebGL()).toBe(false)
  })
})
