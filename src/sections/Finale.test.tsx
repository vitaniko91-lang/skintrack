import { render, screen } from '@testing-library/react'
import { Finale } from './Finale'

describe('Finale', () => {
  it('has a closing heading and two real links', () => {
    render(<Finale />)
    expect(screen.getByRole('heading', { level: 2, name: /plan the line/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try the prototype' })).toHaveAttribute('href', '#prototype')
    expect(screen.getByRole('link', { name: /how it was designed/i })).toHaveAttribute('href', './case.html')
  })
  it('keeps the giant watermark out of the accessibility tree', () => {
    const { container } = render(<Finale />)
    const mark = container.querySelector('[data-watermark]')!
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark).toHaveTextContent('skintrack')
  })
})
