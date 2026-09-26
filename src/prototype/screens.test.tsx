import { act, fireEvent, render, screen } from '@testing-library/react'
import { useReducer, type Dispatch } from 'react'
import { initialState, reducer, type ProtoEvent, type ScreenId } from './machine'
import { DEFAULT_CONDITIONS, type Conditions } from './conditions'
import { GroupScreen, CHECK_STEP_MS } from './GroupScreen'
import { WarningScreen } from './WarningScreen'

function Harness({
  start,
  conditions = DEFAULT_CONDITIONS,
  reduced = false,
  dispatchRef,
}: {
  start: ScreenId
  conditions?: Conditions
  reduced?: boolean
  /** Exposes the reducer's dispatch to the test, so it can navigate like the Stepper would. */
  dispatchRef?: { current: Dispatch<ProtoEvent> | null }
}) {
  const [state, dispatch] = useReducer(reducer, start, initialState)
  if (dispatchRef) dispatchRef.current = dispatch
  if (state.screen === 'group') return <GroupScreen state={state} dispatch={dispatch} conditions={conditions} reduced={reduced} />
  if (state.screen === 'warning') return <WarningScreen state={state} dispatch={dispatch} reduced={reduced} slopeDeg={38} />
  return <p>on {state.screen}</p>
}

describe('GroupScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reveals checks one by one, then offers the slide to start', () => {
    render(<Harness start="group" />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    expect(screen.getByRole('button', { name: 'Checking…' })).toHaveAttribute('aria-disabled', 'true')
    act(() => { vi.advanceTimersByTime(CHECK_STEP_MS) })
    expect(screen.getByText('3 of 3 sending')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(CHECK_STEP_MS * 3) })
    expect(screen.getByRole('slider', { name: 'Slide to start tour' })).toBeInTheDocument()
  })

  it('moves focus to the slider once the check passes, when the check button had focus (keyboard-started)', () => {
    render(<Harness start="group" reduced />)
    const button = screen.getByRole('button', { name: 'Run group check' })
    button.focus()
    fireEvent.click(button)
    expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Slide to start tour' }))
  })

  it('leaves focus alone when the check button did not have focus (mouse/touch, scrolled away)', () => {
    render(<Harness start="group" reduced />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    expect(document.activeElement).not.toBe(screen.getByRole('slider', { name: 'Slide to start tour' }))
  })

  it('does not focus the slider when GroupScreen mounts already passed (e.g. jumping back via the Stepper)', () => {
    function PassedHarness() {
      const [state, dispatch] = useReducer(reducer, { ...initialState('group'), check: 'passed' as const })
      return <GroupScreen state={state} dispatch={dispatch} conditions={DEFAULT_CONDITIONS} reduced />
    }
    render(<PassedHarness />)
    expect(document.activeElement).not.toBe(screen.getByRole('slider', { name: 'Slide to start tour' }))
  })

  it('blocks the start and names the problem when a transceiver is off', () => {
    render(<Harness start="group" conditions={{ ...DEFAULT_CONDITIONS, groupOk: false }} reduced />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/lena/i)
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.getByRole('button', { name: 'Re-check' })).toBeInTheDocument()
  })

  it('sliding to the end opens the warning', () => {
    render(<Harness start="group" reduced />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } })
    expect(screen.getByRole('heading', { name: '38°' })).toBeInTheDocument()
  })
})

describe('WarningScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not vibrate when the warning screen is merely shown (e.g. reached directly via the stepper)', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    render(<Harness start="warning" />)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('vibrates on slide-to-start when not reduced', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    render(<Harness start="group" reduced={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    act(() => { vi.advanceTimersByTime(CHECK_STEP_MS * 5) })
    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } })
    expect(vibrate).toHaveBeenCalledWith([180, 90, 180])
  })

  it('never vibrates with reduced motion', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    render(<Harness start="group" reduced />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } })
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('vibrates exactly once for a start, even after navigating away from and back to the warning screen', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    const dispatchRef: { current: Dispatch<ProtoEvent> | null } = { current: null }
    render(<Harness start="group" reduced={false} dispatchRef={dispatchRef} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    act(() => { vi.advanceTimersByTime(CHECK_STEP_MS * 5) })
    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } })
    expect(vibrate).toHaveBeenCalledTimes(1)

    // Jump away (as the Stepper would) and back to the warning screen — no second vibration.
    act(() => { dispatchRef.current!({ type: 'go', screen: 'route' }) })
    act(() => { dispatchRef.current!({ type: 'go', screen: 'warning' }) })
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('states slope, danger and distance in words, then acknowledges once', () => {
    render(<Harness start="warning" reduced />)
    expect(screen.getByRole('alert')).toHaveTextContent(/slope ahead.*danger 3.*considerable/i)
    fireEvent.click(screen.getByRole('button', { name: 'Take the safer line' }))
    expect(screen.getByText(/next alert at the next slope/i)).toBeInTheDocument()
  })
})
