export const SCREENS = [
  { id: 'route', step: 'Build a route', hint: 'Draw the ascent from the valley to the shoulder.' },
  { id: 'slope', step: 'Read the slope', hint: 'Turn on the slope layer: 30–45° is where avalanches start.' },
  { id: 'group', step: 'Check the group', hint: 'Transceivers, signal and plan — before the car door shuts.' },
  { id: 'warning', step: 'Get warned once', hint: 'One alert per slope, big enough to read in gloves.' },
] as const

export type ScreenId = (typeof SCREENS)[number]['id']
export type CheckStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface ProtoState {
  screen: ScreenId
  routeBuilt: boolean
  slopeOn: boolean
  check: CheckStatus
  started: boolean
  acknowledged: boolean
}

export type ProtoEvent =
  | { type: 'go'; screen: ScreenId }
  | { type: 'next' }
  | { type: 'buildRoute' }
  | { type: 'toggleSlope' }
  | { type: 'startCheck' }
  | { type: 'checkDone'; ok: boolean }
  | { type: 'startTour' }
  | { type: 'acknowledge' }
  | { type: 'reset' }

export function initialState(screen: ScreenId = 'route'): ProtoState {
  return { screen, routeBuilt: false, slopeOn: false, check: 'idle', started: false, acknowledged: false }
}

export function reducer(s: ProtoState, e: ProtoEvent): ProtoState {
  switch (e.type) {
    case 'go':
      return { ...s, screen: e.screen }
    case 'next': {
      const i = SCREENS.findIndex((x) => x.id === s.screen)
      return { ...s, screen: SCREENS[Math.min(i + 1, SCREENS.length - 1)].id }
    }
    case 'buildRoute':
      return { ...s, routeBuilt: true }
    case 'toggleSlope':
      return { ...s, slopeOn: !s.slopeOn }
    case 'startCheck':
      return s.check === 'running' ? s : { ...s, check: 'running' }
    case 'checkDone':
      // Стейл-таймер (напр. после reset/go на другой экран) не должен задним числом
      // подтверждать проверку — засчитывается только результат текущего запуска.
      return s.check === 'running' ? { ...s, check: e.ok ? 'passed' : 'failed' } : s
    case 'startTour':
      return s.check === 'passed' ? { ...s, started: true, screen: 'warning' } : s
    case 'acknowledge':
      return { ...s, acknowledged: true }
    case 'reset':
      return initialState()
  }
}
