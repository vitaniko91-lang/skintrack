import { render, screen } from '@testing-library/react'
import CaseApp from './CaseApp'
import { SOURCES } from './content'

vi.mock('../terrain/routeSummary', async (orig) => ({
  ...(await orig<typeof import('../terrain/routeSummary')>()),
  useRouteStats: () => null,
}))

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never
})

describe('CaseApp', () => {
  it('has exactly one h1 and a way back to the product', () => {
    render(<CaseApp />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /back to skintrack/i })).toHaveAttribute('href', './')
  })
  it('has the five spec sections in order, then sources', () => {
    render(<CaseApp />)
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.closest('section')!.id)
    expect(h2).toEqual(['problem', 'user', 'decisions', 'screens', 'system', 'sources'])
  })
  it('every source link target exists on the page', () => {
    const { container } = render(<CaseApp />)
    SOURCES.forEach((s) => expect(container.querySelector(`#source-${s.id}`)).not.toBeNull())
  })
})
