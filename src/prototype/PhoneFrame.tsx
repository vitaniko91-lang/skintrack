import type { ReactNode } from 'react'
import { statusNotice, type Conditions } from './conditions'

function StatusBar({ conditions }: { conditions: Conditions }) {
  const low = conditions.battery < 20
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-4 font-mono text-xs tabular-nums">
      <span>07:12</span>
      <span className="flex items-center gap-2">
        <span aria-hidden className={`size-4 ${conditions.signal ? 'icon-[lucide--signal]' : 'icon-[lucide--signal-zero]'}`} />
        <span className="sr-only">{conditions.signal ? 'Signal' : 'No signal'}</span>
        <span aria-hidden className={`size-4 ${low ? 'icon-[lucide--battery-low]' : 'icon-[lucide--battery-medium]'}`} />
        <span>{conditions.battery}%</span>
      </span>
    </div>
  )
}

/** На десктопе — телефон в рамке; на мобиле рамка исчезает и экран занимает весь viewport. */
export function PhoneFrame({ conditions, children }: { conditions: Conditions; children: ReactNode }) {
  const notice = statusNotice(conditions)
  return (
    <div className="relative mx-auto flex h-[100svh] w-full flex-col overflow-hidden bg-ground md:h-[50rem] md:w-[24.375rem] md:rounded-[48px] md:shadow-[0_40px_80px_rgb(0_0_0/0.45)] md:ring-1 md:ring-line">
      <StatusBar conditions={conditions} />
      {notice && (
        <p role="status" className="mx-4 mt-1 rounded-2xl bg-ground-2 px-3 py-2 text-sm ring-1 ring-accent/30">
          {notice}
        </p>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
