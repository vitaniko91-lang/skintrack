import { useContext, type Dispatch } from 'react'
import type { ProtoEvent, ProtoState } from './machine'
import { FigureContext } from './figureContext'
import { PrimaryButton, SecondaryButton } from './parts'

interface Props { state: ProtoState; dispatch: Dispatch<ProtoEvent>; reduced: boolean; slopeDeg: number }

/**
 * Одно предупреждение на участок: крупно, словами, с вибрацией — читается в перчатках
 * и на ярком снегу. После подтверждения следующее будет только на следующем склоне.
 * Сама вибрация — не здесь: она срабатывает в момент настоящего старта тура
 * (GroupScreen, slide-to-confirm), а не при показе этого экрана — иначе застывшая
 * иллюстрация на странице кейса или переход сюда через степпер вибрировали бы тоже.
 */
export function WarningScreen({ state, dispatch, slopeDeg }: Props) {
  // A frozen illustration on the case page isn't a live alert or heading — drop both, keep the text.
  const isFigure = useContext(FigureContext)
  const SlopeTitle = isFigure ? 'p' : 'h3'

  if (state.acknowledged) {
    return (
      <div className="flex flex-1 flex-col justify-between p-6">
        <p className="text-2xl font-semibold [text-wrap:balance]">Noted. Next alert at the next slope, not before.</p>
        <SecondaryButton onClick={() => dispatch({ type: 'reset' })}>Restart prototype</SecondaryButton>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-ground-1 p-6 max-md:mx-4 max-md:mb-4 max-md:rounded-[var(--radius-card)]">
      <div role={isFigure ? undefined : 'alert'} className="flex flex-1 flex-col justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">In 120 m · Couloir Nord</p>
        <SlopeTitle className="mt-4 text-[7rem] font-extrabold leading-[0.8] tabular-nums" style={{ fontStretch: '125%' }}>
          {slopeDeg}°
        </SlopeTitle>
        <p className="mt-4 text-2xl font-semibold [text-wrap:balance]">Slope ahead · Danger 3 · considerable</p>
        <p className="mt-3 text-muted">Space out: one at a time, the next person waits at the rock.</p>
      </div>
      <div className="space-y-3">
        <PrimaryButton onClick={() => dispatch({ type: 'acknowledge' })}>Take the safer line</PrimaryButton>
        <SecondaryButton onClick={() => dispatch({ type: 'acknowledge' })}>Assessed · continue</SecondaryButton>
      </div>
    </div>
  )
}
