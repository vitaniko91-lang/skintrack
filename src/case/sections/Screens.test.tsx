import { render, screen } from '@testing-library/react'
import { Screens, FLOW, EDGE_STATES } from './Screens'

vi.mock('../../terrain/routeSummary', async (orig) => ({
  ...(await orig<typeof import('../../terrain/routeSummary')>()),
  useRouteStats: () => ({ lengthM: 3183, gainM: 999, maxSlopeDeg: 38, minutes: 198 }),
}))

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') || q.includes('min-width') })) as never
})

describe('Screens', () => {
  it('shows the four flow screens and three edge states as labelled figures', () => {
    render(<Screens />)
    ;[...FLOW, ...EDGE_STATES].forEach((s) => {
      expect(screen.getByRole('figure', { name: s.label })).toBeInTheDocument()
    })
  })
  it('edge states surface the problem in the UI, in words', () => {
    render(<Screens />)
    const notices = screen.getAllByRole('status').map((n) => n.textContent)
    expect(notices.some((t) => /no signal/i.test(t ?? ''))).toBe(true)
    expect(notices.some((t) => /battery 12%/i.test(t ?? ''))).toBe(true)
    expect(screen.getAllByText(/lena/i).length).toBeGreaterThan(0)
  })
  it('does not vibrate on page load', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    window.matchMedia = (() => ({ matches: false })) as never
    render(<Screens />)
    expect(vibrate).not.toHaveBeenCalled()
  })
  it('screens are frozen illustrations, not live UI: no alert role, no slope-degree heading', () => {
    render(<Screens />)
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
    expect(screen.queryByRole('heading', { name: '38°' })).toBeNull()
  })
  it('on narrow screens shows two switchers instead of seven phones', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never
    render(<Screens />)
    expect(screen.getAllByRole('figure')).toHaveLength(2)
    expect(screen.getAllByRole('tablist')).toHaveLength(2)
  })
})
