import type { Dispatch } from 'react'
import { SLOPE_BANDS } from '../terrain/slope'
import type { ProtoEvent, ProtoState } from './machine'
import { RouteMap } from './RouteMap'
import { PrimaryButton, ScreenShell } from './parts'

interface Props { state: ProtoState; dispatch: Dispatch<ProtoEvent>; reduced: boolean }

export function SlopeScreen({ state, dispatch, reduced }: Props) {
  const on = state.slopeOn
  return (
    <ScreenShell index={2} title="Read the slope">
      <div className="flex min-h-0 flex-1 items-center px-4">
        <RouteMap drawn slopeOn={on} reduced={reduced} />
      </div>
      <div className="space-y-4 p-4">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => dispatch({ type: 'toggleSlope' })}
          className="flex h-14 w-full items-center justify-between rounded-2xl bg-ground-1 px-4 text-base font-semibold ring-1 ring-line"
        >
          Slope layer
          <span aria-hidden className={`relative h-7 w-12 rounded-full ${reduced ? '' : 'transition-colors duration-200'} ${on ? 'bg-accent' : 'bg-ground-2'}`}>
            <span className={`absolute left-0 top-1 size-5 rounded-full bg-body ${reduced ? '' : 'transition-[translate] duration-200'} ${on ? 'translate-x-6' : 'translate-x-1'}`} />
          </span>
        </button>
        {on && (
          <ul className="grid grid-cols-4 gap-2 font-mono text-[0.6875rem]">
            {SLOPE_BANDS.map((b) => (
              <li key={b.label} className="flex flex-col gap-1">
                <span aria-hidden className="h-1.5 rounded-full" style={{ background: b.color }} />
                {b.label}
              </li>
            ))}
          </ul>
        )}
        <PrimaryButton onClick={() => dispatch({ type: 'next' })}>Next · check the group</PrimaryButton>
      </div>
    </ScreenShell>
  )
}
