import { fireEvent, render, screen } from '@testing-library/react'
import { Prototype } from './Prototype'
import { DEFAULT_CONDITIONS } from './conditions'

vi.mock('../terrain/routeSummary', async (orig) => ({
  ...(await orig<typeof import('../terrain/routeSummary')>()),
  useRouteStats: () => ({ lengthM: 3183, gainM: 999, maxSlopeDeg: 38, minutes: 198 }),
}))

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never
})

describe('Prototype', () => {
  it('walks the whole morning of a tour', () => {
    render(<Prototype />)
    fireEvent.click(screen.getByRole('button', { name: 'Build route' }))
    expect(screen.getByText('3:18')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next · read the slope' }))

    const toggle = screen.getByRole('switch', { name: /slope layer/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Next · check the group' }))

    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Slide to start tour' }), { target: { value: '100' } })
    expect(screen.getByRole('heading', { name: '38°' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Take the safer line' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restart prototype' }))
    expect(screen.getByRole('button', { name: 'Build route' })).toBeInTheDocument()
  })

  it('marks the current step and lets you jump', () => {
    render(<Prototype />)
    expect(screen.getByRole('button', { name: /build a route/i })).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByRole('button', { name: /check the group/i }))
    expect(screen.getByRole('button', { name: /check the group/i })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Run group check' })).toBeInTheDocument()
  })

  it('shows device conditions passed in by the case page', () => {
    render(<Prototype conditions={{ ...DEFAULT_CONDITIONS, battery: 12 }} initialScreen="group" />)
    expect(screen.getByRole('status')).toHaveTextContent(/battery 12%/i)
  })

  it('figure variant shows only the phone, in the requested state', () => {
    render(<Prototype variant="figure" initial={{ screen: 'slope', routeBuilt: true, slopeOn: true }} label="Slope layer on" />)
    expect(screen.queryByRole('button', { name: /build a route/i })).toBeNull() // степпера нет
    expect(screen.getByRole('switch', { name: /slope layer/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('figure', { name: 'Slope layer on' })).toBeInTheDocument()
  })

  it('ignores an explicitly-undefined key in `initial`, keeping the reducer default', () => {
    // Without filtering, `{ ...initialState('group'), ...{ screen: 'group', check: undefined } }`
    // would overwrite the default `check: 'idle'` with `undefined`, which falls through
    // GroupScreen's `visible` ternary to "fully revealed" — items would show their real
    // detail text on mount instead of the idle '—' placeholder.
    render(<Prototype variant="figure" initial={{ screen: 'group', check: undefined }} label="x" />)
    expect(screen.queryByText('3 of 3 sending')).toBeNull()
  })

  it('figure variant can start in a failed group check', () => {
    render(
      <Prototype
        variant="figure"
        conditions={{ ...DEFAULT_CONDITIONS, groupOk: false }}
        initial={{ screen: 'group', check: 'failed' }}
        label="Group check failed"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/lena/i)
  })
})
