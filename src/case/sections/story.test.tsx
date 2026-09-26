import { render, screen, within } from '@testing-library/react'
import { Problem } from './Problem'
import { User } from './User'
import { STATS, JOURNEY, PERSONA } from '../content'

describe('Problem', () => {
  it('shows every sourced stat with a link to its source', () => {
    render(<Problem />)
    expect(screen.getByRole('heading', { level: 2, name: /dangerous days look ordinary/i })).toBeInTheDocument()
    expect(screen.getAllByRole('figure')).toHaveLength(STATS.length)
    expect(screen.getAllByRole('link', { name: /source/i })).toHaveLength(STATS.length)
  })
})

describe('User', () => {
  it('labels the persona as illustrative', () => {
    render(<User />)
    expect(screen.getByText(PERSONA.disclaimer)).toBeInTheDocument()
  })
  it('lists the five journey stages in order', () => {
    render(<User />)
    const list = screen.getByRole('list', { name: /journey/i })
    const stages = within(list).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(stages).toEqual(JOURNEY.map((j) => j.stage))
  })
})
