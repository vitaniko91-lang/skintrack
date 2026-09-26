import { reducer, initialState, SCREENS } from './machine'

describe('SCREENS', () => {
  it('is the four-step morning of a tour, in order', () => {
    expect(SCREENS.map((s) => s.id)).toEqual(['route', 'slope', 'group', 'warning'])
  })
})

describe('reducer', () => {
  it('starts on the route screen with nothing done', () => {
    expect(initialState()).toEqual({
      screen: 'route', routeBuilt: false, slopeOn: false, check: 'idle', started: false, acknowledged: false,
    })
  })
  it('can start on any screen (case page shows states)', () => {
    expect(initialState('group').screen).toBe('group')
  })
  it('builds the route', () => {
    expect(reducer(initialState(), { type: 'buildRoute' }).routeBuilt).toBe(true)
  })
  it('next walks forward and stops at the last screen', () => {
    let s = initialState()
    for (let i = 0; i < 5; i++) s = reducer(s, { type: 'next' })
    expect(s.screen).toBe('warning')
  })
  it('go jumps to a screen', () => {
    expect(reducer(initialState(), { type: 'go', screen: 'slope' }).screen).toBe('slope')
  })
  it('toggles the slope layer', () => {
    const on = reducer(initialState(), { type: 'toggleSlope' })
    expect(on.slopeOn).toBe(true)
    expect(reducer(on, { type: 'toggleSlope' }).slopeOn).toBe(false)
  })
  it('runs a check once and records the result', () => {
    const running = reducer(initialState('group'), { type: 'startCheck' })
    expect(running.check).toBe('running')
    expect(reducer(running, { type: 'startCheck' })).toBe(running)
    expect(reducer(running, { type: 'checkDone', ok: true }).check).toBe('passed')
    expect(reducer(running, { type: 'checkDone', ok: false }).check).toBe('failed')
  })
  it('ignores checkDone when no check is running', () => {
    const idle = initialState('group')
    expect(reducer(idle, { type: 'checkDone', ok: true })).toBe(idle)
    const passed = { ...idle, check: 'passed' as const }
    expect(reducer(passed, { type: 'checkDone', ok: false })).toBe(passed)
  })
  it('a failed check can be re-run', () => {
    const failed = { ...initialState('group'), check: 'failed' as const }
    expect(reducer(failed, { type: 'startCheck' }).check).toBe('running')
  })
  it('starts the tour only after a passed check, landing on the warning', () => {
    const idle = initialState('group')
    expect(reducer(idle, { type: 'startTour' })).toBe(idle)
    const passed = { ...idle, check: 'passed' as const }
    const s = reducer(passed, { type: 'startTour' })
    expect(s.started).toBe(true)
    expect(s.screen).toBe('warning')
  })
  it('acknowledges the warning and resets', () => {
    const s = reducer(initialState('warning'), { type: 'acknowledge' })
    expect(s.acknowledged).toBe(true)
    expect(reducer(s, { type: 'reset' })).toEqual(initialState())
  })
})
