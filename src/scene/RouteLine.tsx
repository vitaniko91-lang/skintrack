import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Color, ShaderMaterial, TubeGeometry, Vector3 } from 'three'
import { heightAt, type Heightfield } from '../terrain/decode'
import { ROUTE_UV } from '../terrain/route'
import { WORLD_SIZE, worldHeight } from './terrainGeometry'
import { introState, scrollState } from './choreography'

const LIFT = 0.04

export function uvToWorld(hf: Heightfield, u: number, v: number): Vector3 {
  return new Vector3((u - 0.5) * WORLD_SIZE, worldHeight(hf, heightAt(hf, u, v)) + LIFT, (v - 0.5) * WORLD_SIZE)
}

/** Трубка гаснет у края тайла той же маской, что и рельеф (terrainMaterial) — старт из долины не висит в пустоте. */
function createRouteMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color('#bfe0ee') },
      uBg: { value: new Color('#0a0f15') },
      uSize: { value: WORLD_SIZE },
    },
    vertexShader: /* glsl */ `
      uniform float uSize;
      varying vec2 vUv;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vUv = w.xz / uSize + 0.5;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uBg;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.5, 0.36, length(vUv - 0.5));
        gl_FragColor = vec4(mix(uBg, uColor, edge), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
}

interface Props { hf: Heightfield; progress: RefObject<number>; startedAt: number; reduced: boolean }

export function RouteLine({ hf, progress, startedAt, reduced }: Props) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(ROUTE_UV.map(([u, v]) => uvToWorld(hf, u, v)))
    return new TubeGeometry(curve, 240, 0.028, 6, false)
  }, [hf])
  const material = useMemo(() => createRouteMaterial(), [])

  useEffect(() => () => { geometry.dispose() }, [geometry])
  useEffect(() => () => { material.dispose() }, [material])

  useFrame(() => {
    const rise = introState(performance.now() - startedAt, reduced).rise
    const route = scrollState(progress.current ?? 0, reduced).route * (rise >= 1 ? 1 : 0)
    const count = geometry.index!.count
    geometry.setDrawRange(0, Math.floor((route * count) / 6) * 6)
  })

  return <mesh geometry={geometry} material={material} />
}
