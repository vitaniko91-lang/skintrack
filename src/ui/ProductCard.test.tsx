import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  it('renders title and stats with units', () => {
    render(<ProductCard title="Couloir Nord" stats={[{ label: 'max slope', value: '38°' }, { label: 'gain', value: '1140 m' }]} />)
    expect(screen.getByRole('heading', { name: 'Couloir Nord' })).toBeInTheDocument()
    expect(screen.getByText('38°')).toBeInTheDocument()
    expect(screen.getByText('gain')).toBeInTheDocument()
  })
  it('shows the danger level with its text, not colour alone', () => {
    render(<ProductCard title="X" stats={[]} danger={3} />)
    expect(screen.getByText(/danger 3/i)).toBeInTheDocument()
  })
})
