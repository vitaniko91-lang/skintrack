import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'
import { stage, span } from '../stage'

/** Радиальный ореол за скульптурой (приём TLC): аддитивный, растёт с переходом. */
export function Halo({ reduced }: { reduced: boolean }) {
  const mat = useMemo(() => new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
    uniforms: { uI: { value: 0 }, uColor: { value: new Color('#5CE8FF') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uI; uniform vec3 uColor; varying vec2 vUv;
      void main(){ float r = length(vUv - 0.5) * 2.0;
        float g = exp(-r * r * 7.0) * 0.28 + exp(-r * r * 30.0) * 0.55;
        gl_FragColor = vec4(uColor * g * uI, 1.0); }`,
  }), [])
  useFrame((s) => {
    const p = reduced ? 1 : stage.p
    mat.uniforms.uI.value = span(p, 0.05, 0.5) * (0.9 + (reduced ? 0 : 0.1 * Math.sin(s.clock.elapsedTime * 0.8)))
  })
  return (
    <>
      <Billboard position={[0, 2.2, 0]}>
        <mesh material={mat} renderOrder={-1}>
          <planeGeometry args={[22, 22]} />
        </mesh>
      </Billboard>
    </>
  )
}
