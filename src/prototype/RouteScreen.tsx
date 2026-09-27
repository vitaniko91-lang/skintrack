import type { Dispatch } from 'react'
import type { ProtoEvent, ProtoState } from './machine'
import { RouteMap } from './RouteMap'
import { PrimaryButton, ScreenShell, StatRow } from './parts'

interface Props {
  state: ProtoState
  dispatch: Dispatch<ProtoEvent>
  stats: { label: string; value: string }[]
  reduced: boolean
}

export function RouteScreen({ state, dispatch, stats, reduced }: Props) {
  return (
    <ScreenShell index={1} title="Build a route">
      <div className="flex min-h-0 flex-1 items-center px-4">
        <RouteMap drawn={state.routeBuilt} slopeOn={false} reduced={reduced} />
      </div>
      <div className="space-y-4 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Start → Shoulder</p>
        {state.routeBuilt ? (
          <>
            <StatRow stats={stats} />
            <PrimaryButton onClick={() => dispatch({ type: 'next' })}>Next · read the slope</PrimaryButton>
          </>
        ) : (
          <PrimaryButton onClick={() => dispatch({ type: 'buildRoute' })}>Build route</PrimaryButton>
        )}
      </div>
    </ScreenShell>
  )
}
