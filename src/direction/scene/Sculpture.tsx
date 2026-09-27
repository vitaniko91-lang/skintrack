import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshPhysicalMaterial, type Group } from 'three'
import type { Heightfield } from '../../terrain/decode'
import { ROUTE_UV } from '../../terrain/route'
import { buildSculptGeometry } from './sculptGeometry'
import { buildRibbon } from './ribbonGeometry'
import { makeRibbonMaterial } from './ribbonMaterial'
import { stage, span, easeOut, easeInOut } from '../stage'

export const CYAN = new Color('#5CE8FF')

/**
 * Хромированная гора: физический металл отражает световые панели Environment,
 * поверх — светящиеся изолинии и циановый ободок по Френелю (их ловит Bloom).
 */
function makeChrome() {
  const m = new MeshPhysicalMaterial({
    color: '#0c2a33', metalness: 1, roughness: 0.3,
    clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1,
  })
  const uniforms = { uGlow: { value: 0 }, uCyan: { value: CYAN.clone() } }
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uniforms)
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aH;\nvarying float vH;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = aH;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow;\nuniform vec3 uCyan;\nvarying float vH;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float cl = vH * 18.0;
        float d = 0.5 - abs(fract(cl) - 0.5);
        float line = 1.0 - smoothstep(0.0, fwidth(cl) * 1.3, d);
        float rim = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 4.0);
        totalEmissiveRadiance += uCyan * uGlow * (line * (0.35 + 1.6 * vH) + rim * 0.9);`,
      )
  }
  return { m, uniforms }
}

export function Sculpture({ hf, segments, reduced }: { hf: Heightfield; segments: number; reduced: boolean }) {
  const group = useRef<Group>(null)
  const geo = useMemo(() => buildSculptGeometry(hf, segments), [hf, segments])
  const ribbon = useMemo(() => buildRibbon(hf, ROUTE_UV), [hf])
  const chrome = useMemo(makeChrome, [])
  const ribbonMat = useMemo(makeRibbonMaterial, [])

  useFrame((state) => {
    const p = reduced ? 1 : stage.p
    const t = state.clock.elapsedTime
    const rise = easeOut(span(p, 0.08, 0.42))
    const g = group.current!
    g.scale.set(1, Math.max(rise, 0.02), 1)
    g.position.y = (1 - rise) * -1.2
    g.rotation.y = -0.55 + easeInOut(span(p, 0, 1)) * 0.6 + (reduced ? 0 : Math.sin(t * 0.15) * 0.03)
    chrome.uniforms.uGlow.value = 0.35 + 0.65 * span(p, 0.2, 0.6)
    // трек по склону рисуется в 0.32–0.78, хвост к следующей главе — в 0.78–1
    const up = span(p, 0.32, 0.78)
    const tail = span(p, 0.78, 1)
    ribbonMat.uniforms.uDraw.value = up < 1 ? up * ribbon.routeEnd : ribbon.routeEnd + tail * (1 - ribbon.routeEnd)
    ribbonMat.uniforms.uTime.value = t
  })

  return (
    <group ref={group}>
      <mesh geometry={geo} material={chrome.m} />
      <mesh geometry={ribbon.geometry} material={ribbonMat} renderOrder={2} />
    </group>
  )
}
