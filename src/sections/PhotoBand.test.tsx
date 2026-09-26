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
  it('extends the credit link hit area to at least 40px tall via a pseudo-element, without resizing the visible text', () => {
    render(<PhotoBand />)
    const link = screen.getByRole('link', { name: PHOTO.credit })
    // jsdom doesn't compute real layout, so the ≥40px target-size floor (design.md) is
    // verified by the utility classes that produce it: `before:-inset-y-3` gives 24px of
    // extra height around the ~11px/line-height text, clearing 40px without touching the
    // link's own box (no padding/margin change that would alter its visible size).
    expect(link.className).toContain('relative')
    expect(link.className).toContain("before:content-['']")
    expect(link.className).toContain('before:absolute')
    expect(link.className).toContain('before:-inset-y-3')
    expect(link.className).toContain('before:-inset-x-1')
  })
})
