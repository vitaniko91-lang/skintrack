import { useEffect, useRef, useState } from 'react'

/**
 * «Свайп-действие» из референса, собранное на нативном range: работает мышью, пальцем
 * и клавиатурой (стрелки, End) без собственной обработки жестов.
 */
export function SlideToConfirm({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [value, setValue] = useState(0)
  const done = useRef(false)
  const dragging = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // This control replaces the check button in the same slot once the check passes —
  // move focus onto it so a keyboard user isn't dropped back to the body.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const onChange = (v: number) => {
    // A tap near the end sets a native range straight to a high value in a single event,
    // defeating the slide. Mid-drag, reject a jump bigger than a real drag step would
    // produce. Keyboard (arrows/End) never sets `dragging`, so it stays unaffected.
    if (dragging.current && v - value > 20) return
    setValue(v)
    if (v >= 100 && !done.current) {
      done.current = true
      onConfirm()
    }
  }
  const startDrag = () => { dragging.current = true }
  const release = () => {
    dragging.current = false
    if (!done.current) setValue(0)
  }

  return (
    <div className="relative h-14 overflow-hidden rounded-full bg-ground-2 ring-1 ring-line has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-solid">
      <div aria-hidden className="absolute inset-y-0 left-0 bg-accent/25" style={{ width: `${value}%` }} />
      <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-body">
        {label}
      </span>
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={startDrag}
        onPointerUp={release}
        onBlur={release}
        className="relative h-full w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing
          [&::-webkit-slider-thumb]:size-12 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
          [&::-moz-range-thumb]:size-12 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent"
      />
    </div>
  )
}
