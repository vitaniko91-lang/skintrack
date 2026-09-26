import { useEffect, useState, type RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { loadHeightfield } from '../terrain/loadHeightfield'
import type { Heightfield } from '../terrain/decode'
import { Terrain } from './Terrain'
import { RouteLine } from './RouteLine'
import { CameraRig } from './CameraRig'

interface Props { progress: RefObject<number>; reduced: boolean; onReady?: (hf: Heightfield) => void }

export default function TerrainCanvas({ progress, reduced, onReady }: Props) {
  const [hf, setHf] = useState<Heightfield | null>(null)
  const [startedAt, setStartedAt] = useState(0)
  const segments = typeof window !== 'undefined' && window.innerWidth < 768 ? 128 : 256

  useEffect(() => {
    loadHeightfield().then((h) => {
      setHf(h)
      setStartedAt(performance.now())
      onReady?.(h)
    })
  }, [onReady])

  if (!hf) return null
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 32, near: 0.1, far: 100 }}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      aria-hidden
    >
      <color attach="background" args={['#0a0f15']} />
      <fog attach="fog" args={['#0a0f15', 12, 24]} />
      <CameraRig progress={progress} reduced={reduced} />
      <Terrain hf={hf} segments={segments} progress={progress} startedAt={startedAt} reduced={reduced} />
      <RouteLine hf={hf} progress={progress} startedAt={startedAt} reduced={reduced} />
    </Canvas>
  )
}
