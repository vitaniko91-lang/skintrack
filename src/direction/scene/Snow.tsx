import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, type Points } from 'three'
import { stage, span } from '../stage'

/** Позёмка: медленно поднимающиеся искры вокруг горы — ещё один слой движения. */
export function Snow({ count = 700, reduced }: { count?: number; reduced: boolean }) {
  const ref = useRef<Points>(null)
  const geo = useMemo(() => {
    const g = new BufferGeometry()
    const p = new Float32Array(count * 3)
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, r = 2 + rnd() * 7
      p[i * 3] = Math.cos(a) * r
      p[i * 3 + 1] = rnd() * 9 - 1
      p[i * 3 + 2] = Math.sin(a) * r
    }
    g.setAttribute('position', new BufferAttribute(p, 3))
    return g
  }, [count])
  useFrame((s, dt) => {
    const pts = ref.current!
    if (!reduced) pts.rotation.y += dt * 0.03
    pts.position.y = reduced ? 0 : (s.clock.elapsedTime * 0.12) % 1
    ;(pts.material as { opacity: number }).opacity = 0.75 * span(reduced ? 1 : stage.p, 0.15, 0.45)
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} color={[0.7, 2.0, 2.4]} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} sizeAttenuation />
    </points>
  )
}
