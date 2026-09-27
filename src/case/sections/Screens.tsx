import { Prototype } from '../../prototype/Prototype'
import { DEFAULT_CONDITIONS, type Conditions } from '../../prototype/conditions'
import type { ProtoState } from '../../prototype/machine'
import { CaseSection } from '../ui/CaseSection'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { ScreenSwitcher } from '../ui/ScreenSwitcher'

export interface Shot { label: string; note: string; initial: Partial<ProtoState>; conditions?: Conditions }

export const FLOW: Shot[] = [
  { label: '1 · Route built', note: 'Stats come from the real elevation model, not mock numbers.', initial: { screen: 'route', routeBuilt: true } },
  { label: '2 · Slope layer on', note: 'Off by default — decision 3.3.', initial: { screen: 'slope', routeBuilt: true, slopeOn: true } },
  { label: '3 · Group ready', note: 'Slide to start: a deliberate gesture, not a tap.', initial: { screen: 'group', check: 'passed' } },
  // без started: true — иначе экран завибрирует при загрузке страницы кейса
  { label: '4 · One alert', note: 'Slope, danger and distance in words — decision 3.2.', initial: { screen: 'warning' } },
]

export const EDGE_STATES: Shot[] = [
  { label: 'No signal', note: 'The forecast is dated, maps are offline, the route still works.', initial: { screen: 'route', routeBuilt: true }, conditions: { ...DEFAULT_CONDITIONS, signal: false } },
  { label: 'Battery 12%', note: 'GPS drops to every 5 minutes to last the tour — said out loud.', initial: { screen: 'route', routeBuilt: true }, conditions: { ...DEFAULT_CONDITIONS, battery: 12 } },
  { label: 'Group check failed', note: 'The app names who, and blocks the start.', initial: { screen: 'group', check: 'failed' }, conditions: { ...DEFAULT_CONDITIONS, groupOk: false } },
]

function Shots({ shots, cols }: { shots: Shot[]; cols: string }) {
  return (
    <ul className={`grid gap-12 ${cols}`}>
      {shots.map((s) => (
        <li key={s.label} className="flex flex-col items-center gap-3">
          <Prototype variant="figure" label={s.label} initial={s.initial} conditions={s.conditions} />
          <p className="max-w-[24.375rem] text-center text-sm text-muted">{s.note}</p>
        </li>
      ))}
    </ul>
  )
}

export function Screens() {
  const wide = useMediaQuery('(min-width: 1024px)')
  return (
    <CaseSection id="screens" index={4} label="Screens" title="The same four screens, including the bad days.">
      <p className="max-w-2xl text-lg text-muted">
        These are the live components from the product page, started in different states — every phone below still works.
      </p>
      <div className="mt-12">
        {wide ? <Shots shots={FLOW} cols="lg:grid-cols-2 2xl:grid-cols-4" /> : <ScreenSwitcher label="Flow" shots={FLOW} />}
      </div>
      <h3 className="mt-24 text-2xl font-bold" style={{ fontStretch: '115%' }}>Edge states</h3>
      <div className="mt-8">
        {wide ? <Shots shots={EDGE_STATES} cols="lg:grid-cols-3" /> : <ScreenSwitcher label="Edge states" shots={EDGE_STATES} />}
      </div>
    </CaseSection>
  )
}
