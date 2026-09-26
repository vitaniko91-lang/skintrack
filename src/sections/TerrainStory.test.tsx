import { render, screen } from '@testing-library/react'
import { TerrainStory } from './TerrainStory'

describe('TerrainStory (reduced motion)', () => {
  it('renders the scene plus all three captions in normal document flow', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never
    // canUseWebGL() is false in jsdom (no canvas context) — poster fallback renders.
    render(<TerrainStory />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /avalanches/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Couloir Nord' })).toBeInTheDocument()

    // No absolute positioning / opacity-driven overlap in reduced mode.
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.closest('[style*="opacity"]')).toBeNull()
  })
})
