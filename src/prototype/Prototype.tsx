import { useReducer, useState } from 'react'
import { prefersReducedMotion } from '../lib/env'
import { formatRouteStats, useRouteStats } from '../terrain/routeSummary'
import { initialState, reducer, type ScreenId } from './machine'
import { DEFAULT_CONDITIONS, type Conditions } from './conditions'
import { PhoneFrame } from './PhoneFrame'
import { Stepper } from './Stepper'
import { RouteScreen } from './RouteScreen'
import { SlopeScreen } from './SlopeScreen'
import { GroupScreen } from './GroupScreen'
import { WarningScreen } from './WarningScreen'

const EMPTY_STATS = [
  { label: 'max slope', value: '—' },
  { label: 'gain', value: '—' },
  { label: 'time', value: '—' },
]
/** Замер Плана 1 (routeStats по реальному DEM) — на случай, если карта высот не загрузилась. */
const MEASURED_MAX_SLOPE = 38

interface Props { conditions?: Conditions; initialScreen?: ScreenId }

export function Prototype({ conditions = DEFAULT_CONDITIONS, initialScreen = 'route' }: Props) {
  const [reduced] = useState(prefersReducedMotion)
  const [state, dispatch] = useReducer(reducer, initialScreen, initialState)
  const stats = useRouteStats()
  const rows = stats ? formatRouteStats(stats) : EMPTY_STATS
  const slopeDeg = stats ? Math.round(stats.maxSlopeDeg) : MEASURED_MAX_SLOPE

  const screen = {
    route: <RouteScreen state={state} dispatch={dispatch} stats={rows} reduced={reduced} />,
    slope: <SlopeScreen state={state} dispatch={dispatch} reduced={reduced} />,
    group: <GroupScreen state={state} dispatch={dispatch} conditions={conditions} reduced={reduced} />,
    warning: <WarningScreen state={state} dispatch={dispatch} reduced={reduced} slopeDeg={slopeDeg} />,
  }[state.screen]

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,32rem)_1fr] lg:items-center lg:gap-16">
      <Stepper current={state.screen} onGo={(id) => dispatch({ type: 'go', screen: id })} />
      {/* TryIt's section padding (px-4 below md) would otherwise leave a 16px border around
          the phone on mobile — bleed the wrapper to the viewport edge there, and let md:px-10
          take back over once the phone stops being full-bleed. */}
      <div className="-mx-4 md:mx-0 lg:justify-self-center">
        <PhoneFrame conditions={conditions}>
          <div
            key={state.screen}
            className={`flex min-h-0 flex-1 flex-col ${reduced ? '' : 'animate-[screen-in_200ms_var(--ease-out-strong)]'}`}
          >
            {screen}
          </div>
        </PhoneFrame>
      </div>
    </div>
  )
}
