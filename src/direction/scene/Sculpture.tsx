import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshPhysicalMaterial, Vector3, type Group } from 'three'
import type { Heightfield } from '../../terrain/decode'
import { ROUTE_UV } from '../../terrain/route'
import { slopeCell } from '../../terrain/slope'
import { hazardSpan, ndcToScreen } from '../layout'
import { buildFacetedSculpt, FADE_FROM } from './sculptGeometry'
import { buildRibbon } from './ribbonGeometry'
import { makeRibbonMaterial } from './ribbonMaterial'
import { stage, span, easeOut, easeInOut, livePose, type Pose } from '../stage'

export const CYAN = new Color('#5CE8FF')

/** Тонкие гравированные изолинии: ?contours в адресе. По умолчанию — чистый хром. */
const CONTOURS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('contours') ? 1 : 0

/**
 * Тёмный полированный хром, как кольца TLC: металл без собственного цвета отражает
 * почти чёрное окружение с редкими световыми полосами. Циан — только ободок по Френелю
 * и контровой свет; подножие гаснет в темноту по мировой высоте.
 */
function makeChrome() {
  const m = new MeshPhysicalMaterial({
    color: '#7d898f', metalness: 1, roughness: 0.14,
    envMapIntensity: 1.1, transparent: true,
  })
  const uniforms = { uGlow: { value: 0 }, uCyan: { value: CYAN.clone() }, uContours: { value: CONTOURS } }
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uniforms)
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aH;\nattribute float aR;\nvarying float vH;\nvarying float vR;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = aH;\nvR = aR;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow;\nuniform float uContours;\nuniform vec3 uCyan;\nvarying float vH;\nvarying float vR;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float cl = vH * 16.0;
        float d = 0.5 - abs(fract(cl) - 0.5);
        float line = (1.0 - smoothstep(0.0, fwidth(cl) * 0.9, d)) * step(0.02, vH);
        float rim = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 5.0);
        totalEmissiveRadiance += uCyan * uGlow * (rim * 0.55 + line * uContours * 0.22);`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        // кромка растворяется в фоне (альфа), а не лежит чёрным диском поверх ореола
        gl_FragColor.a *= smoothstep(0.47, 0.33, vR);`,
      )
  }
  return { m, uniforms }
}

const w = new Vector3()
const w2 = new Vector3()

/** Поворот горы в главе 02, рад: трек разворачивается к зрителю. */
export const TURN = 0.4

/** Вершины маршрута, у которых в главе 02 выезжают карточки: старт, кулуар, плечо. */
export const CARD_VERTICES = [0, 4, ROUTE_UV.length - 1] as const

/**
 * Настоящая крутизна вдоль ленты → доли длины крутого участка (≥ 30°, полоса опасности
 * на карте) вокруг кулуара — вершины 4. Короткие полки внутри склеиваются.
 */
function hazardT(hf: Heightfield, uv: [number, number][], aT: ArrayLike<number>, near: number): [number, number] {
  const w = hf.width, h = hf.height
  const at = (u: number, v: number) => {
    const x = u * (w - 1), y = v * (h - 1), x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0
    const g = (i: number, j: number) => slopeCell(hf, Math.min(j, h - 1) * w + Math.min(i, w - 1))
    return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty
  }
  const s = hazardSpan(uv.map(([u, v]) => at(u, v)), 30, { gap: 8, near })
  if (!s) return [0, 0]
  const i0 = Math.round(s[0] * (uv.length - 1)), i1 = Math.round(s[1] * (uv.length - 1))
  return [aT[i0 * 2], aT[i1 * 2]]
}

export function Sculpture({ hf, segments, reduced, pose, anchors = true }: { hf: Heightfield; segments: number; reduced: boolean; pose?: Pose; anchors?: boolean }) {
  const group = useRef<Group>(null)
  const facets = useMemo(() => buildFacetedSculpt(hf, segments), [hf, segments])
  const geo = facets.geometry
  const ribbon = useMemo(() => buildRibbon(hf, ROUTE_UV, { surface: facets.heightAt, lift: 0.12 }), [hf, facets])
  const chrome = useMemo(makeChrome, [])
  const ribbonMat = useMemo(makeRibbonMaterial, [])
  const haz = useMemo(() => hazardT(hf, ribbon.routeUV, ribbon.geometry.attributes.aT.array, ribbon.vertexSample(CARD_VERTICES[1]) / (ribbon.routeUV.length - 1)), [hf, ribbon])
  const cardPts = useMemo(() => CARD_VERTICES.map((k) => ribbon.centre[ribbon.vertexSample(k)]), [ribbon])
  /** Эстафета: лента видима с точки, где трек выходит из темноты кромки на освещённый склон. */
  const hand = useMemo(() => {
    const i = Math.max(ribbon.centre.findIndex((c) => Math.hypot(c.x, c.z) / 10 < FADE_FROM - 0.02), 0)
    return { i, t: ribbon.geometry.attributes.aT.array[i * 2] as number }
  }, [ribbon])

  useFrame((state) => {
    const { p, q } = pose ?? (reduced ? { p: 1, q: 0 } : livePose())
    const t = state.clock.elapsedTime
    const rise = easeOut(span(p, 0.08, 0.42))
    const g = group.current!
    g.scale.set(1, Math.max(rise, 0.02), 1)
    g.position.y = (1 - rise) * -1.2
    g.rotation.y = -0.55 + easeInOut(span(p, 0, 1)) * 0.6 + TURN * easeInOut(q) + (reduced ? 0 : Math.sin(t * 0.15) * 0.03)
    chrome.uniforms.uGlow.value = 0.4 + 0.6 * span(p, 0.2, 0.6)
    // 2D-штрих с фото приходит к подножию к 0.3; дальше 3D-лента: склон 0.3–0.78, хвост 0.78–1
    const up = span(p, 0.3, 0.78)
    // глава 02: хвост втягивается к плечу, пока гора поворачивается, и снова вылетает к главе 03
    const tail = span(p, 0.78, 1) * (1 - span(q, 0, 0.16)) + span(q, 0.84, 1)
    ribbonMat.uniforms.uStart.value = hand.t
    ribbonMat.uniforms.uDraw.value = up < 1 ? hand.t + up * (ribbon.routeEnd - hand.t) : ribbon.routeEnd + Math.min(tail, 1) * (1 - ribbon.routeEnd)
    ribbonMat.uniforms.uTime.value = t
    ribbonMat.uniforms.uHaz.value.set(haz[0], haz[1])
    ribbonMat.uniforms.uHazK.value = easeOut(span(q, 0.3, 0.46))

    // эстафета: экранная точка начала ленты
    g.updateMatrixWorld()
    w.copy(ribbon.centre[hand.i]).applyMatrix4(g.matrixWorld).project(state.camera)
    stage.rx = (w.x * 0.5 + 0.5) * state.size.width
    stage.ry = (-w.y * 0.5 + 0.5) * state.size.height
    // экранное направление ленты в точке эстафеты — 2D-дуга входит по касательной
    w2.copy(ribbon.centre[Math.min(hand.i + 8, ribbon.centre.length - 1)]).applyMatrix4(g.matrixWorld).project(state.camera)
    const dx = (w2.x - w.x) * state.size.width, dy = -(w2.y - w.y) * state.size.height
    const len = Math.hypot(dx, dy) || 1
    stage.rdx = dx / len
    stage.rdy = dy / len
    stage.rReady = true

    if (anchors && (q > 0 || pose)) {
      cardPts.forEach((c, i) => {
        w.copy(c).applyMatrix4(g.matrixWorld).project(state.camera)
        const s = ndcToScreen(w.x, w.y, state.size.width, state.size.height)
        stage.anchors[i].x = s.x
        stage.anchors[i].y = s.y
      })
      stage.anchorsReady = true
    }
  })

  return (
    <group ref={group}>
      <mesh geometry={geo} material={chrome.m} />
      <mesh geometry={ribbon.geometry} material={ribbonMat} renderOrder={2} />
    </group>
  )
}
