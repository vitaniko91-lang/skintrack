import { useEffect, useState, type Dispatch } from 'react'
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

  useEffect(() => {
    if (state.check !== 'running') return
    const count = checkItems(conditions).length
    const ok = checkPasses(conditions)
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
  }, [state.check, conditions, reduced, dispatch])

  const visible = state.check === 'idle' ? 0 : state.check === 'running' ? shown : items.length
  const failed = items.find((i) => !i.ok)

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
            {failed.detail.replace(/^.*· /, '')}. Nobody leaves until every transceiver is sending.
          </p>
        )}
        {state.check === 'idle' && <PrimaryButton onClick={() => dispatch({ type: 'startCheck' })}>Run group check</PrimaryButton>}
        {state.check === 'running' && <PrimaryButton disabled>Checking…</PrimaryButton>}
        {state.check === 'failed' && <PrimaryButton onClick={() => dispatch({ type: 'startCheck' })}>Re-check</PrimaryButton>}
        {state.check === 'passed' && <SlideToConfirm label="Slide to start tour" onConfirm={() => dispatch({ type: 'startTour' })} />}
      </div>
    </ScreenShell>
  )
}
