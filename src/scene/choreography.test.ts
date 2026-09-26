import { introState, scrollState, sectionProgress, fade, HOLD_MS, INTRO_MS } from './choreography'

describe('introState', () => {
  it('holds still for the whole hold beat', () => {
    expect(introState(0)).toEqual({ rise: 0, contours: 0 })
    expect(introState(HOLD_MS - 1)).toEqual({ rise: 0, contours: 0 })
  })
  it('is complete after the intro', () => {
    expect(introState(INTRO_MS)).toEqual({ rise: 1, contours: 1 })
  })
  it('contours lead, the mountain follows', () => {
    const mid = introState(HOLD_MS + 600)
    expect(mid.contours).toBeGreaterThan(mid.rise)
  })
  it('reduced motion skips straight to the end', () => {
    expect(introState(0, true)).toEqual({ rise: 1, contours: 1 })
  })
})

describe('scrollState', () => {
  it('starts with no slope layer and no route', () => {
    expect(scrollState(0)).toMatchObject({ slope: 0, route: 0 })
  })
  it('slope finishes before the route starts', () => {
    const s = scrollState(0.45)
    expect(s.slope).toBe(1)
    expect(s.route).toBe(0)
  })
  it('ends fully revealed', () => {
    expect(scrollState(1)).toMatchObject({ slope: 1, route: 1 })
  })
  it('orbit angle moves monotonically', () => {
    expect(scrollState(0.8).orbit).toBeGreaterThan(scrollState(0.2).orbit)
  })
  it('reduced motion shows everything regardless of progress', () => {
    expect(scrollState(0, true)).toMatchObject({ slope: 1, route: 1 })
  })
})

describe('sectionProgress', () => {
  it('is 0 when the section top is at the viewport top', () => {
    expect(sectionProgress(0, 4000, 1000)).toBe(0)
  })
  it('is 1 when the section bottom meets the viewport bottom', () => {
    expect(sectionProgress(-3000, 4000, 1000)).toBe(1)
  })
  it('clamps', () => {
    expect(sectionProgress(500, 4000, 1000)).toBe(0)
    expect(sectionProgress(-9000, 4000, 1000)).toBe(1)
  })
})

describe('fade', () => {
  it('is 1 inside the window and 0 outside', () => {
    expect(fade(0.5, 0.2, 0.8)).toBe(1)
    expect(fade(0.0, 0.2, 0.8)).toBe(0)
    expect(fade(1.0, 0.2, 0.8)).toBe(0)
  })
})
