import { useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { heightAt, type Heightfield } from '../terrain/decode'
import { ROUTE_UV } from '../terrain/route'
import { WORLD_SIZE, worldHeight } from './terrainGeometry'
import { introState, scrollState } from './choreography'

const LIFT = 0.04

export function uvToWorld(hf: Heightfield, u: number, v: number): Vector3 {
  return new Vector3((u - 0.5) * WORLD_SIZE, worldHeight(hf, heightAt(hf, u, v)) + LIFT, (v - 0.5) * WORLD_SIZE)
}

interface Props { hf: Heightfield; progress: RefObject<number>; startedAt: number; reduced: boolean }

export function RouteLine({ hf, progress, startedAt, reduced }: Props) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(ROUTE_UV.map(([u, v]) => uvToWorld(hf, u, v)))
    return new TubeGeometry(curve, 240, 0.028, 6, false)
  }, [hf])

  useFrame(() => {
    const rise = introState(performance.now() - startedAt, reduced).rise
    const route = scrollState(progress.current ?? 0, reduced).route * (rise >= 1 ? 1 : 0)
    const count = geometry.index!.count
    geometry.setDrawRange(0, Math.floor((route * count) / 6) * 6)
  })

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#bfe0ee" toneMapped={false} />
    </mesh>
  )
}
