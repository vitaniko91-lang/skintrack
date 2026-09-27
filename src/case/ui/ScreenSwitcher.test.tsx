import { fireEvent, render, screen } from '@testing-library/react'
import { ScreenSwitcher } from './ScreenSwitcher'
import { EDGE_STATES } from '../sections/Screens'

vi.mock('../../terrain/routeSummary', async (orig) => ({
  ...(await orig<typeof import('../../terrain/routeSummary')>()),
  useRouteStats: () => null,
}))

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never
})

describe('ScreenSwitcher', () => {
  it('shows one phone at a time, chosen by tabs', () => {
    render(<ScreenSwitcher label="Edge states" shots={EDGE_STATES} />)
    expect(screen.getAllByRole('figure')).toHaveLength(1)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(EDGE_STATES.length)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(tabs[2])
    expect(screen.getByRole('figure', { name: EDGE_STATES[2].label })).toBeInTheDocument()
  })
  it('moves between tabs with the arrow keys', () => {
    render(<ScreenSwitcher label="Edge states" shots={EDGE_STATES} />)
    const tabs = screen.getAllByRole('tab')
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1])
  })
  it('labels the tab list and links the panel to its tab', () => {
    render(<ScreenSwitcher label="Edge states" shots={EDGE_STATES} />)
    expect(screen.getByRole('tablist', { name: 'Edge states' })).toBeInTheDocument()
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', screen.getAllByRole('tab')[0].id)
  })
})
