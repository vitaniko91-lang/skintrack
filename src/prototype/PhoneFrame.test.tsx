import { render, screen } from '@testing-library/react'
import { PhoneFrame } from './PhoneFrame'
import { DEFAULT_CONDITIONS } from './conditions'

describe('PhoneFrame', () => {
  it('shows battery as text and no notice in normal conditions', () => {
    render(<PhoneFrame conditions={DEFAULT_CONDITIONS}><p>screen</p></PhoneFrame>)
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByText('screen')).toBeInTheDocument()
  })
  it('announces missing signal', () => {
    render(<PhoneFrame conditions={{ ...DEFAULT_CONDITIONS, signal: false }}><p>x</p></PhoneFrame>)
    expect(screen.getByRole('status')).toHaveTextContent(/no signal/i)
    expect(screen.getByText('No signal', { selector: '.sr-only' })).toBeInTheDocument()
  })
})
