import type { ReactNode } from 'react'

/**
 * Корпус телефона главы 04: графитовая рамка 11 px, «остров», блик по кромке.
 * Экран внутри — PhoneFrame прототипа (радиус 40 + рамка 11 ≈ внешние 52).
 */
export function Device({ children, glow = false, className = '' }: { children: ReactNode; glow?: boolean; className?: string }) {
  return (
    <div className={`relative rounded-[52px] bg-[linear-gradient(150deg,#2a3a44,#0b141b_45%,#1a2730)] p-[11px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_1px_0_rgb(255_255_255/0.3),0_50px_90px_-30px_rgb(0_0_0/0.9)] ${glow ? 'ring-1 ring-cyan/40 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_1px_0_rgb(255_255_255/0.3),0_0_90px_-10px_rgb(92_232_255/0.45),0_50px_90px_-30px_rgb(0_0_0/0.9)]' : ''} ${className}`}>
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[19px] z-10 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
      {children}
    </div>
  )
}
