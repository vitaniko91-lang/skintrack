import { render, screen, within } from '@testing-library/react'
import { TradeoffTable } from './TradeoffTable'
import { DECISIONS } from '../content'

const d = DECISIONS[1]

describe('TradeoffTable', () => {
  it('is a real data table with a caption and column headers', () => {
    render(<TradeoffTable decision={d} />)
    const table = screen.getByRole('table', { name: d.title })
    const headers = within(table).getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual(['Option', 'UX', 'Dev cost', 'Risk'])
  })
  it('has one row per option, with the option name as a row header', () => {
    render(<TradeoffTable decision={d} />)
    expect(screen.getAllByRole('rowheader')).toHaveLength(d.options.length)
  })
  it('marks the chosen option in words, not only colour', () => {
    render(<TradeoffTable decision={d} />)
    const chosen = d.options.find((o) => o.id === d.chosen)!
    const row = screen.getByRole('rowheader', { name: new RegExp(chosen.name) }).closest('tr')!
    expect(row).toHaveTextContent(/chosen/i)
  })
  it('links an option’s source when it has one', () => {
    render(<TradeoffTable decision={d} />)
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute('href', '#source-slf-levels')
  })
  it('is scrollable by keyboard on narrow screens', () => {
    render(<TradeoffTable decision={d} />)
    const region = screen.getByRole('region', { name: `${d.title} — options` })
    expect(region).toHaveAttribute('tabindex', '0')
  })
})
