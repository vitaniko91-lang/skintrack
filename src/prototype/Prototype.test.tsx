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
})
