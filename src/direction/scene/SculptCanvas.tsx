import { useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { HalfFloatType, Vector3, WebGLRenderTarget } from 'three'
import { loadHeightfieldOnce } from '../../terrain/routeSummary'
import type { Heightfield } from '../../terrain/decode'
import { Sculpture } from './Sculpture'
import { Halo } from './Halo'
import { Snow } from './Snow'
import { idle, stage, span, easeInOut, livePose, type Pose } from '../stage'

const tmp = new Vector3()
/** Глава 02: насколько камера наезжает, опускается, сдвигает центр кадра к горе и поднимает взгляд. */
const Q = { dist: 1, drop: 0.5, shift: 0.4, lift: 0.9 }
const look = new Vector3()

/** Камера с северо-востока (с этой стороны идёт трек), наезд по переходу + параллакс за курсором. */
function Rig({ reduced, narrow, pose }: { reduced: boolean; narrow: boolean; pose?: Pose }) {
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    const { p, q } = pose ?? (reduced ? { p: 1, q: 0 } : livePose())
    const k = easeInOut(span(p, 0, 0.85))
    // глава 02: камера ниже и ближе, гора встаёт в центр — вокруг неё карточки маршрута
    const k2 = easeInOut(span(q, 0, 0.5))
    const dist = 23 - 4 * k - Q.dist * k2 + (narrow ? 9 : 0)
    const az = Math.PI * 0.25 + 0.15 - 0.2 * k
    const h = 4 + 5 * k - Q.drop * k2
    tmp.set(Math.sin(az) * dist, h, -Math.cos(az) * dist)
    if (!reduced) tmp.add(look.set(stage.px * 0.8, -stage.py * 0.5, 0))
    camera.position.lerp(tmp, reduced || pose ? 1 : 0.08)
    // центр кадра сдвинут влево от горы: на десктопе гора стоит справа, слева — подпись главы
    const shift = narrow ? 0 : 3.4 + (Q.shift - 3.4) * k2
    look.set(Math.cos(az) * shift, 1.6 + (narrow ? -0.4 : 0) + Q.lift * k2, Math.sin(az) * shift)
    camera.lookAt(look)
  })
  return null
}

/**
 * Прогрев, пока сцену закрывает фото: шейдеры компилируются параллельно (KHR_parallel_shader_compile),
 * затем один скрытый кадр — PMREM окружения, программы постобработки, загрузка буферов.
 * Без этого всё это случалось на первом кадре скролла: ~200–600 мс стоп на переходе от фото к горе.
 */
function Prewarm() {
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene), camera = useThree((s) => s.camera)
  const advance = useThree((s) => s.advance), frameloop = useThree((s) => s.frameloop)
  useEffect(() => {
    if (frameloop !== 'never') return // сцена уже рисуется — греть нечего
    let alive = true
    idle(() => {
      // сцена рисуется в HalfFloat-буфер композера, а не в холст: ключ программы (tone mapping,
      // цветовое пространство) зависит от цели, поэтому компилируем под такую же цель
      const rt = new WebGLRenderTarget(1, 1, { type: HalfFloatType }), prev = gl.getRenderTarget()
      gl.setRenderTarget(rt)
      const ready = gl.compileAsync(scene, camera)
      gl.setRenderTarget(prev)
      ready.catch(() => {}).then(() => { rt.dispose(); if (alive) idle(() => { if (alive) advance(performance.now()) }) })
    })
    return () => { alive = false }
    // только при монтировании: смена frameloop дальше — обычный рендер
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

/** active=false — сцена целиком закрыта фото первого экрана: не рендерим впустую. */
export default function SculptCanvas({ reduced, active = true, pose, anchors = true }: { reduced: boolean; active?: boolean; pose?: Pose; anchors?: boolean }) {
  const [hf, setHf] = useState<Heightfield | null>(null)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  useEffect(() => { loadHeightfieldOnce().then(setHf).catch(() => {}) }, [])
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 30, near: 0.1, far: 200, position: [14, 6, -14] }}
      frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <color attach="background" args={['#04080C']} />
      <fog attach="fog" args={['#04080C', 26, 48]} />
      {/* студия для тёмного хрома: чёрное окружение, редкие узкие полосы белого, циан — контровой сзади */}
      <Environment resolution={512} frames={1} background={false}>
        <color attach="background" args={['#000000']} />
        <Lightformer form="rect" intensity={10} color="#ffffff" position={[-6, 7, -6]} scale={[0.35, 14, 1]} rotation-y={-Math.PI / 4} />
        <Lightformer form="rect" intensity={7} color="#ffffff" position={[7, 6, 2]} scale={[0.25, 12, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.5} color="#f2fdff" position={[0, 12, 0]} scale={[14, 0.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={9} color="#5CE8FF" position={[-8, 3, 8]} scale={[16, 1.2, 1]} rotation-y={-Math.PI * 0.75} />
      </Environment>
      <directionalLight position={[-8, 6, 8]} intensity={3} color="#5CE8FF" />
      <directionalLight position={[6, 10, -4]} intensity={1.2} color="#ffffff" />
      <Rig reduced={reduced} narrow={narrow} pose={pose} />
      <Halo reduced={reduced} />
      <Snow reduced={reduced} count={narrow ? 350 : 700} />
      {hf && <Sculpture hf={hf} segments={17} reduced={reduced} pose={pose} anchors={anchors} />}
      {hf && !reduced && <Prewarm />}
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur levels={6} resolutionScale={0.5} intensity={1.1} luminanceThreshold={0.78} luminanceSmoothing={0.15} radius={0.7} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  )
}
