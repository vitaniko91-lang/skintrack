import { useEffect, useRef, type RefObject } from 'react'
import { sectionProgress } from '../scene/choreography'

/**
 * Пишет прогресс секции в ref без ре-рендеров: читают useFrame и подписи.
 * rAF-цикл идёт только пока секция пересекает viewport (IntersectionObserver) —
 * иначе он молотит кадры на 60Hz для секции, которую никто не видит.
 */
export function useSectionProgress(el: RefObject<HTMLElement | null>) {
  const progress = useRef(0)
  useEffect(() => {
    let raf = 0
    const read = () => {
      const node = el.current
      if (node) {
        const r = node.getBoundingClientRect()
        progress.current = sectionProgress(r.top, r.height, window.innerHeight)
      }
    }
    const loop = () => { read(); raf = requestAnimationFrame(loop) }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }

    read() // читаем один раз сразу, до первого колбэка IntersectionObserver
    const node = el.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      loop()
      return stop
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) loop()
      } else {
        stop()
        read()
      }
    })
    io.observe(node)
    return () => { io.disconnect(); stop() }
  }, [el])
  return progress
}
