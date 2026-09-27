import { render, screen } from '@testing-library/react'
import { System, TOKENS } from './System'

describe('System', () => {
  it('lists every colour token by name', () => {
    render(<System />)
    TOKENS.forEach((t) => expect(screen.getByText(t.name)).toBeInTheDocument())
  })
  it('reads token values from CSS, not from a copy in JS', () => {
    // jsdom не считает каскад Tailwind — подменяем getComputedStyle и проверяем, что значение берётся оттуда
    const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (n: string) => (n === '--color-accent' ? ' #5ce8ff' : ''),
    } as unknown as CSSStyleDeclaration)
    render(<System />)
    expect(screen.getByText('#5CE8FF')).toBeInTheDocument()
    spy.mockRestore()
  })
  it('separates safety colours from brand colours', () => {
    render(<System />)
    expect(screen.getByRole('heading', { level: 3, name: /safety data/i })).toBeInTheDocument()
  })
})
