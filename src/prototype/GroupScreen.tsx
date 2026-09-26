import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { ProtoEvent, ProtoState } from './machine'
import { checkItems, checkPasses, type Conditions } from './conditions'
import { PrimaryButton, ScreenShell } from './parts'
import { SlideToConfirm } from './SlideToConfirm'

/** Пауза между пунктами проверки: проверка должна читаться как проверка, а не как мгновенный вердикт. */
export const CHECK_STEP_MS = 350

interface Props { state: ProtoState; dispatch: Dispatch<ProtoEvent>; conditions: Conditions; reduced: boolean }

export function GroupScreen({ state, dispatch, conditions, reduced }: Props) {
  const items = checkItems(conditions)
  const [shown, setShown] = useState(0)
  const { groupOk, signal } = conditions
  const btnRef = useRef<HTMLButtonElement>(null)
  // Earned focus only: the slide-to-confirm that replaces this button should steal focus
  // only from the person who was actually on the button when the check ran — not from a
  // mouse/touch user who has since scrolled away, and not on a re-render of an
  // already-passed state (e.g. jumping back here via the Stepper).
  const btnHadFocus = useRef(false)

  useEffect(() => {
    if (state.check !== 'running') return
    btnHadFocus.current = document.activeElement === btnRef.current
    // Depend on the two fields the check result actually reads, not the whole conditions
    // object — a battery tick shouldn't restart the check's reveal timers mid-run.
    const runConditions: Conditions = { groupOk, signal, battery: 0 }
    const count = checkItems(runConditions).length
    const ok = checkPasses(runConditions)
    if (reduced) {
      setShown(count)
      dispatch({ type: 'checkDone', ok })
      return
    }
    setShown(0)
    const timers = Array.from({ length: count }, (_, i) =>
      setTimeout(() => setShown(i + 1), (i + 1) * CHECK_STEP_MS))
    timers.push(setTimeout(() => dispatch({ type: 'checkDone', ok }), (count + 1) * CHECK_STEP_MS))
    return () => timers.forEach(clearTimeout)
  }, [state.check, groupOk, signal, reduced, dispatch])

  const visible = state.check === 'idle' ? 0 : state.check === 'running' ? shown : items.length
  const failed = items.find((i) => !i.ok)

  // Reset the reveal count in the same event as the (re)start dispatch, so a re-check
  // never paints a frame where the rows still show the previous run as done.
  const startCheck = () => {
    setShown(0)
    dispatch({ type: 'startCheck' })
  }

  return (
    <ScreenShell index={3} title="Check the group">
      <ul aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4">
        {items.map((item, i) => {
          const done = i < visible
          return (
            <li key={item.id} className="flex items-center gap-4 rounded-[20px] bg-ground-1 p-4 ring-1 ring-line">
              <span
                aria-hidden
                className={`size-6 shrink-0 ${!done ? 'opacity-30 icon-[lucide--check]' : item.ok ? 'text-accent icon-[lucide--check]' : 'icon-[lucide--x]'}`}
              />
              <span className="min-w-0">
                <span className="block font-semibold">{item.label}</span>
                <span className="block font-mono text-sm text-muted">{done ? item.detail : '—'}</span>
              </span>
            </li>
          )
        })}
      </ul>
      <div className="space-y-4 p-4">
        {state.check === 'failed' && failed && (
          <p role="alert" className="text-base">
            {failed.reason}. Nobody leaves until every transceiver is sending.
          </p>
        )}
        {state.check !== 'passed' && (
          // One button element across idle/running/failed — only its label and aria-disabled
          // change, so a keyboard user's focus stays put instead of dropping to body when the
          // state (and previously, the JSX slot) changed underneath them.
          <PrimaryButton onClick={startCheck} ariaDisabled={state.check === 'running'} buttonRef={btnRef}>
            {state.check === 'failed' ? 'Re-check' : state.check === 'running' ? 'Checking…' : 'Run group check'}
          </PrimaryButton>
        )}
        {state.check === 'passed' && (
          <SlideToConfirm
            label="Slide to start tour"
            onConfirm={() => {
              // Вибрация — здесь, в момент настоящего старта тура, а не в эффекте монтирования
              // WarningScreen: иначе застывшая иллюстрация на странице кейса или переход на
              // экран через степпер вибрировали бы тоже.
              if (!reduced) navigator.vibrate?.([180, 90, 180])
              dispatch({ type: 'startTour' })
            }}
            autoFocus={btnHadFocus.current}
          />
        )}
      </div>
    </ScreenShell>
  )
}
