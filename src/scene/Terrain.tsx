import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Heightfield } from '../terrain/decode'
import { buildTerrainGeometry } from './terrainGeometry'
import { createTerrainMaterial } from './terrainMaterial'
import { introState, scrollState } from './choreography'

interface Props {
  hf: Heightfield
  segments: number
  progress: RefObject<number>
  startedAt: number
  reduced: boolean
}

export function Terrain({ hf, segments, progress, startedAt, reduced }: Props) {
  const geometry = useMemo(() => buildTerrainGeometry(hf, segments), [hf, segments])
  const material = useMemo(() => createTerrainMaterial(), [])

  useEffect(() => () => { geometry.dispose() }, [geometry])
  useEffect(() => () => { material.dispose() }, [material])

  useFrame(() => {
    const intro = introState(performance.now() - startedAt, reduced)
    const scroll = scrollState(progress.current ?? 0, reduced)
    material.uniforms.uRise.value = intro.rise
    material.uniforms.uContours.value = intro.contours
    material.uniforms.uSlope.value = scroll.slope
  })

  return <mesh geometry={geometry} material={material} />
}
