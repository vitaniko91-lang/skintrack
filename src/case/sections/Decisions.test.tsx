import { render, screen } from '@testing-library/react'
import { Decisions } from './Decisions'
import { DECISIONS } from '../content'

describe('Decisions', () => {
  it('renders each decision as a titled block with its own table', () => {
    render(<Decisions />)
    DECISIONS.forEach((d) => {
      expect(screen.getByRole('heading', { level: 3, name: d.title })).toBeInTheDocument()
      expect(screen.getByRole('table', { name: d.title })).toBeInTheDocument()
    })
  })
  it('names the losses and when to revisit, for every decision', () => {
    render(<Decisions />)
    expect(screen.getAllByText(/tradeoffs accepted/i)).toHaveLength(DECISIONS.length)
    expect(screen.getAllByText(/revisit if/i)).toHaveLength(DECISIONS.length)
  })
})
