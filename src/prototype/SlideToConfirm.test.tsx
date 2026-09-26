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
  it('ignores a tap-to-jump mid-drag — a pointerDown then straight to 100 does not confirm', () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm label="Slide" onConfirm={onConfirm} />)
    const slider = screen.getByRole('slider', { name: 'Slide' })
    fireEvent.pointerDown(slider)
    fireEvent.change(slider, { target: { value: '100' } })
    expect(onConfirm).not.toHaveBeenCalled()
  })
  it('confirms when dragged in steps of 10 up to 100', () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm label="Slide" onConfirm={onConfirm} />)
    const slider = screen.getByRole('slider', { name: 'Slide' })
    fireEvent.pointerDown(slider)
    for (let v = 10; v <= 100; v += 10) {
      fireEvent.change(slider, { target: { value: String(v) } })
    }
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
  it('confirms a quick real drag — pointer moves in steps bigger than 20', () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm label="Slide" onConfirm={onConfirm} />)
    const slider = screen.getByRole('slider', { name: 'Slide' })
    fireEvent.pointerDown(slider)
    for (const v of [22, 44, 66, 89, 100]) {
      fireEvent.pointerMove(slider)
      fireEvent.change(slider, { target: { value: String(v) } })
    }
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
  it('a jump bigger than 20 via keyboard (no pointer gesture) still confirms', () => {
    const onConfirm = vi.fn()
    render(<SlideToConfirm label="Slide" onConfirm={onConfirm} />)
    const slider = screen.getByRole('slider', { name: 'Slide' })
    fireEvent.change(slider, { target: { value: '100' } })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
