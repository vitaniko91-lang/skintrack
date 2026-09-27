import { Prototype } from '../../prototype/Prototype'
import { DEFAULT_CONDITIONS, type Conditions } from '../../prototype/conditions'
import type { ProtoState } from '../../prototype/machine'
import { CaseSection } from '../ui/CaseSection'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { ScreenSwitcher } from '../ui/ScreenSwitcher'
import { inDevice } from '../ui/inDevice'

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

/** Наклоны телефонов веером к центру ряда (как тройка на сайте продукта); под курсором телефон выпрямляется. */
// классы выписаны целиком — Tailwind находит только буквальные строки
const TILT4 = [
  'lg:[--tilt:perspective(1600px)_rotateY(10deg)_rotateX(4deg)] 2xl:[--tilt:perspective(1600px)_rotateY(14deg)_rotateX(4deg)]',
  'lg:[--tilt:perspective(1600px)_rotateY(-10deg)_rotateX(4deg)] 2xl:[--tilt:perspective(1600px)_rotateY(5deg)_rotateX(3deg)]',
  'lg:[--tilt:perspective(1600px)_rotateY(10deg)_rotateX(4deg)] 2xl:[--tilt:perspective(1600px)_rotateY(-5deg)_rotateX(3deg)]',
  'lg:[--tilt:perspective(1600px)_rotateY(-10deg)_rotateX(4deg)] 2xl:[--tilt:perspective(1600px)_rotateY(-14deg)_rotateX(4deg)]',
]
const TILT3 = [
  'lg:[--tilt:perspective(1600px)_rotateY(12deg)_rotateX(4deg)]',
  'lg:[--tilt:perspective(1600px)_rotateY(0deg)_rotateX(5deg)]',
  'lg:[--tilt:perspective(1600px)_rotateY(-12deg)_rotateX(4deg)]',
]
const tiltFor = (i: number, n: number) => (n === 3 ? TILT3 : TILT4)[i] ?? ''

function Shots({ shots, cols }: { shots: Shot[]; cols: string }) {
  return (
    <ul className={`grid gap-x-10 gap-y-16 ${cols}`}>
      {shots.map((s, i) => (
        <li key={s.label} className="flex flex-col items-center gap-4">
          <Prototype variant="figure" label={s.label} initial={s.initial} conditions={s.conditions} wrap={inDevice(tiltFor(i, shots.length), i === 0)} />
          <p className="max-w-[24.375rem] text-center text-[15px] leading-snug text-body/75">{s.note}</p>
        </li>
      ))}
    </ul>
  )
}

export function Screens() {
  const wide = useMediaQuery('(min-width: 1024px)')
  return (
    <CaseSection id="screens" index={4} accent="Four" label="screens" title="The same four screens, including the bad days.">
      <p className="max-w-[60ch] text-[17px] leading-relaxed text-body/80">
        These are the live components from the product page, started in different states — every phone below still works.
      </p>
      <div className="mt-16 max-md:mt-10">
        {wide ? <Shots shots={FLOW} cols="lg:grid-cols-2 2xl:grid-cols-4" /> : <ScreenSwitcher label="Flow" shots={FLOW} />}
      </div>
      <h3 className="mt-28 flex items-baseline gap-3 max-md:mt-20">
        <span className="font-serif text-[clamp(2.4rem,4vw,3.6rem)] italic leading-none text-cyan-hot">Edge</span>
        <span className="caps-wide text-[clamp(1.4rem,2.4vw,2.2rem)] font-extrabold uppercase tracking-[-0.02em] text-white">states</span>
      </h3>
      <div className="mt-8">
        {wide ? <Shots shots={EDGE_STATES} cols="lg:grid-cols-3" /> : <ScreenSwitcher label="Edge states" shots={EDGE_STATES} />}
      </div>
    </CaseSection>
  )
}
