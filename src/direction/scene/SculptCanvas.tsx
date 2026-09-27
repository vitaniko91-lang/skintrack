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

/** active=false — сцена целиком закрыта фото первого экрана: не рендерим впустую. */
export default function SculptCanvas({ reduced, active = true }: { reduced: boolean; active?: boolean }) {
  const [hf, setHf] = useState<Heightfield | null>(null)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  useEffect(() => { loadHeightfieldOnce().then(setHf).catch(() => {}) }, [])
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 30, near: 0.1, far: 200, position: [14, 6, -14] }}
      frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
      gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      aria-hidden
    >
      <color attach="background" args={['#04080C']} />
      <fog attach="fog" args={['#04080C', 26, 48]} />
      {/* студия для тёмного хрома: чёрное окружение, редкие узкие полосы белого, циан — контровой сзади */}
      <Environment resolution={512} frames={1} background={false}>
        <color attach="background" args={['#000000']} />
        <Lightformer form="rect" intensity={10} color="#ffffff" position={[-6, 7, -6]} scale={[0.35, 14, 1]} rotation-y={-Math.PI / 4} />
        <Lightformer form="rect" intensity={7} color="#ffffff" position={[7, 6, 2]} scale={[0.25, 12, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={4} color="#f2fdff" position={[0, 12, 0]} scale={[14, 0.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={9} color="#5CE8FF" position={[-8, 3, 8]} scale={[16, 1.2, 1]} rotation-y={-Math.PI * 0.75} />
      </Environment>
      <directionalLight position={[-8, 6, 8]} intensity={3} color="#5CE8FF" />
      <directionalLight position={[6, 10, -4]} intensity={1.2} color="#ffffff" />
      <Rig reduced={reduced} narrow={narrow} />
      <Halo reduced={reduced} />
      <Snow reduced={reduced} count={narrow ? 350 : 700} />
      {hf && <Sculpture hf={hf} segments={narrow ? 160 : 240} reduced={reduced} />}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.78} luminanceSmoothing={0.15} radius={0.7} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
