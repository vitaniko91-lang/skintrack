import { fireEvent, render, screen } from '@testing-library/react'
import { SlideToConfirm } from './SlideToConfirm'

describe('SlideToConfirm', () => {
  it('confirms once when slid to the end', () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm label="Slide to start tour" onConfirm={onConfirm} />)
    const slider = screen.getByRole('slider', { name: 'Slide to start tour' })
    fireEvent.change(slider, { target: { value: '100' } })
    fireEvent.change(slider, { target: { value: '100' } })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
  it('snaps back when released short of the end', () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm label="Slide" onConfirm={onConfirm} />)
    const slider = screen.getByRole('slider', { name: 'Slide' })
    fireEvent.change(slider, { target: { value: '60' } })
    fireEvent.pointerUp(slider)
    expect((slider as HTMLInputElement).value).toBe('0')
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
