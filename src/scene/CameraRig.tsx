import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { scrollState } from './choreography'

export function CameraRig({ progress, reduced }: { progress: RefObject<number>; reduced: boolean }) {
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    const { orbit } = scrollState(progress.current ?? 0, reduced)
    const r = 13
    // −z — север (terrainGeometry: строка 0 → z = −size/2): смотрим на северную стену и маршрут
    camera.position.set(Math.sin(orbit) * r, 7.4, -Math.cos(orbit) * r)
    camera.lookAt(0, 1.3, 0)
  })
  return null
}
