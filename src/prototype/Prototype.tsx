import { useReducer, useState } from 'react'
import { prefersReducedMotion } from '../lib/env'
import { formatRouteStats, useRouteStats } from '../terrain/routeSummary'
import { initialState, reducer, type ProtoState, type ScreenId } from './machine'
import { DEFAULT_CONDITIONS, type Conditions } from './conditions'
import { PhoneFrame, type PhoneVariant } from './PhoneFrame'
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

interface Props {
  conditions?: Conditions
  initialScreen?: ScreenId
  /** Начальное состояние поверх initialScreen — для иллюстраций состояний на странице кейса. */
  initial?: Partial<ProtoState>
  /** 'app' — степпер + телефон (сайт продукта); 'figure' — только телефон в рамке. */
  variant?: PhoneVariant
  /** Подпись иллюстрации (обязательна по смыслу для variant="figure"). */
  label?: string
}

export function Prototype({ conditions = DEFAULT_CONDITIONS, initialScreen = 'route', initial, variant = 'app', label }: Props) {
  const [reduced] = useState(prefersReducedMotion)
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const base = initialState(initial?.screen ?? initialScreen)
    // An explicitly-undefined key in `initial` (e.g. `{ check: undefined }`) must not win over
    // the reducer default when spread — a case-page illustration passing a partial state
    // shouldn't be able to blank out fields it never meant to set.
    const defined = initial
      ? (Object.fromEntries(Object.entries(initial).filter(([, v]) => v !== undefined)) as Partial<ProtoState>)
      : {}
    return { ...base, ...defined }
  })
  const stats = useRouteStats()
  const rows = stats ? formatRouteStats(stats) : EMPTY_STATS
  const slopeDeg = stats ? Math.round(stats.maxSlopeDeg) : MEASURED_MAX_SLOPE

  const screen = {
    route: <RouteScreen state={state} dispatch={dispatch} stats={rows} reduced={reduced} />,
    slope: <SlopeScreen state={state} dispatch={dispatch} reduced={reduced} />,
    group: <GroupScreen state={state} dispatch={dispatch} conditions={conditions} reduced={reduced} />,
    warning: <WarningScreen state={state} dispatch={dispatch} reduced={reduced} slopeDeg={slopeDeg} />,
  }[state.screen]

  const phone = (
    <PhoneFrame conditions={conditions} variant={variant}>
      <div
        key={state.screen}
        className={`flex min-h-0 flex-1 flex-col ${reduced ? '' : 'animate-[screen-in_200ms_var(--ease-out-strong)]'}`}
      >
        {screen}
      </div>
    </PhoneFrame>
  )

  if (variant === 'figure') {
    return (
      <figure aria-label={label} className="flex w-full flex-col items-center gap-4">
        {phone}
        {label && <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">{label}</figcaption>}
      </figure>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,32rem)_1fr] lg:items-center lg:gap-16">
      <Stepper current={state.screen} onGo={(id) => dispatch({ type: 'go', screen: id })} />
      {/* TryIt's section padding (px-4 below md) would otherwise leave a 16px border around
          the phone on mobile — bleed the wrapper to the viewport edge there, and let md:px-10
          take back over once the phone stops being full-bleed. */}
      <div className="-mx-4 md:mx-0 lg:justify-self-center">
        {phone}
      </div>
    </div>
  )
}
