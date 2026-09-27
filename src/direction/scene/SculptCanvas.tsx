import { useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Vector3 } from 'three'
import { loadHeightfieldOnce } from '../../terrain/routeSummary'
import type { Heightfield } from '../../terrain/decode'
import { Sculpture } from './Sculpture'
import { Halo } from './Halo'
import { Snow } from './Snow'
import { stage, span, easeInOut } from '../stage'

const tmp = new Vector3()
const look = new Vector3()

/** Камера с северо-востока (с этой стороны идёт трек), наезд по переходу + параллакс за курсором. */
function Rig({ reduced, narrow }: { reduced: boolean; narrow: boolean }) {
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    const p = reduced ? 1 : stage.p
    const k = easeInOut(span(p, 0, 0.85))
    const dist = 23 - 4 * k + (narrow ? 9 : 0)
    const az = Math.PI * 0.25 + 0.15 - 0.2 * k
    const h = 4 + 5 * k
    tmp.set(Math.sin(az) * dist, h, -Math.cos(az) * dist)
    if (!reduced) tmp.add(look.set(stage.px * 0.8, -stage.py * 0.5, 0))
    camera.position.lerp(tmp, reduced ? 1 : 0.08)
    // центр кадра сдвинут влево от горы: на десктопе гора стоит справа, слева — подпись главы
    const shift = narrow ? 0 : 3.4
    look.set(Math.cos(az) * shift, 1.6 + (narrow ? -0.4 : 0), Math.sin(az) * shift)
    camera.lookAt(look)
  })
  return null
}

export default function SculptCanvas({ reduced }: { reduced: boolean }) {
  const [hf, setHf] = useState<Heightfield | null>(null)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  useEffect(() => { loadHeightfieldOnce().then(setHf).catch(() => {}) }, [])
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 30, near: 0.1, far: 200, position: [14, 6, -14] }}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      aria-hidden
    >
      <color attach="background" args={['#04080C']} />
      <fog attach="fog" args={['#04080C', 26, 48]} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={6} color="#5CE8FF" position={[6, 5, -6]} scale={[10, 2, 1]} rotation-y={Math.PI / 4} />
        <Lightformer form="rect" intensity={2} color="#dff9ff" position={[-6, 8, -2]} scale={[3, 8, 1]} />
        <Lightformer form="ring" intensity={4} color="#9CF6FF" position={[0, 10, 6]} scale={4} />
        <Lightformer form="rect" intensity={1.5} color="#0B6F86" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>
      <Rig reduced={reduced} narrow={narrow} />
      <Halo reduced={reduced} />
      <Snow reduced={reduced} count={narrow ? 350 : 700} />
      {hf && <Sculpture hf={hf} segments={narrow ? 160 : 240} reduced={reduced} />}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.75} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
