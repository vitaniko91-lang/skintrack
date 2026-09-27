import type { ReactNode } from 'react'
import { Device } from '../../direction/Device'

/** Телефон в корпусе главы 04 (Device); ширина фиксирована сверху, чтобы рамка не схлопнулась. */
export const inDevice = (tilt = '', glow = false) => (phone: ReactNode) => (
  <Device glow={glow} className={`w-[min(100%,calc(24.375rem+22px))] [transform:var(--tilt,none)] transition-transform duration-500 ease-[var(--ease-expo)] hover:[transform:none] focus-within:[transform:none] motion-reduce:transition-none ${tilt}`}>{phone}</Device>
)
