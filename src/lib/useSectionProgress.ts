import { useEffect, useRef, type RefObject } from 'react'
import { sectionProgress } from '../scene/choreography'

/** Пишет прогресс секции в ref без ре-рендеров: читают useFrame и подписи. */
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
      raf = requestAnimationFrame(read)
    }
    raf = requestAnimationFrame(read)
    return () => cancelAnimationFrame(raf)
  }, [el])
  return progress
}
