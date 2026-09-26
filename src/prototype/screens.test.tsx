import { act, fireEvent, render, screen } from '@testing-library/react'
import { useReducer } from 'react'
import { initialState, reducer, type ScreenId } from './machine'
import { DEFAULT_CONDITIONS, type Conditions } from './conditions'
import { GroupScreen, CHECK_STEP_MS } from './GroupScreen'
import { WarningScreen } from './WarningScreen'

function Harness({ start, conditions = DEFAULT_CONDITIONS, reduced = false }: { start: ScreenId; conditions?: Conditions; reduced?: boolean }) {
  const [state, dispatch] = useReducer(reducer, start, initialState)
  return state.screen === 'group'
    ? <GroupScreen state={state} dispatch={dispatch} conditions={conditions} reduced={reduced} />
    : <WarningScreen state={state} dispatch={dispatch} reduced={reduced} slopeDeg={38} />
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

  it('moves focus to the slider once the check passes', () => {
    render(<Harness start="group" reduced />)
    fireEvent.click(screen.getByRole('button', { name: 'Run group check' }))
    expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Slide to start tour' }))
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
  it('vibrates once on arrival unless motion is reduced', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    const { unmount } = render(<Harness start="warning" />)
    expect(vibrate).toHaveBeenCalledWith([180, 90, 180])
    unmount()
    vibrate.mockClear()
    render(<Harness start="warning" reduced />)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('states slope, danger and distance in words, then acknowledges once', () => {
    render(<Harness start="warning" reduced />)
    expect(screen.getByRole('alert')).toHaveTextContent(/slope ahead.*danger 3.*considerable/i)
    fireEvent.click(screen.getByRole('button', { name: 'Take the safer line' }))
    expect(screen.getByText(/next alert at the next slope/i)).toBeInTheDocument()
  })
})
