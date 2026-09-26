import { render, screen } from '@testing-library/react'
import { PhotoBand } from './PhotoBand'
import { PHOTO } from '../content/photo'

describe('PhotoBand', () => {
  it('shows the manifesto as a real heading', () => {
    render(<PhotoBand />)
    expect(screen.getByRole('heading', { level: 2, name: /every slope has a number/i })).toBeInTheDocument()
  })
  it('renders the duotone photo with alt text, size and three widths', () => {
    const { container } = render(<PhotoBand />)
    const img = screen.getByRole('img', { name: PHOTO.alt })
    expect(img).toHaveAttribute('width', String(PHOTO.width))
    expect(img).toHaveAttribute('loading', 'lazy')
    const avif = container.querySelector('source[type="image/avif"]')!
    expect(avif.getAttribute('srcset')!.split(',')).toHaveLength(3)
  })
  it('credits the photographer with a link', () => {
    render(<PhotoBand />)
    expect(screen.getByRole('link', { name: PHOTO.credit })).toHaveAttribute('href', PHOTO.creditUrl)
  })
})
