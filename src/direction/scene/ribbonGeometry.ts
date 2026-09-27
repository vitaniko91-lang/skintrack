import { BufferAttribute, BufferGeometry, CatmullRomCurve3, CubicBezierCurve3, Vector3 } from 'three'
import type { Heightfield } from '../../terrain/decode'
import type { UV } from '../../terrain/route'
import { sculptHeight, uvToWorld } from './sculptGeometry'

export interface RibbonOptions {
  /** точек вдоль трека по склону */
  routeSamples?: number
  /** точек вдоль «хвоста», уходящего к следующей главе */
  tailSamples?: number
  /** ширина ленты на склоне, мировые единицы */
  width?: number
  /** ширина в конце хвоста: лента раскрывается, как шёлк Orlina, подлетая к камере */
  tailWidth?: number
  /** подъём над рельефом, чтобы лента не тонула в нём */
  lift?: number
  /** конец хвоста в мировых координатах */
  tailEnd?: Vector3
}

export interface Ribbon {
  geometry: BufferGeometry
  /** доля длины (0..1), на которой кончается трек по склону и начинается хвост */
  routeEnd: number
  /** центральная линия — для «головы» ленты и тестов */
  centre: Vector3[]
}

/**
 * Лента-трек: настоящий ROUTE_UV, посаженный на рельеф скульптуры, плюс хвост,
 * который отрывается от плеча, закручивается и уходит за кадр к следующей главе.
 * Атрибуты: aT — доля длины (0..1, по ней лента «рисуется»), aSide — −1..1 поперёк.
 */
export function buildRibbon(hf: Heightfield, route: readonly UV[], o: RibbonOptions = {}): Ribbon {
  const routeSamples = o.routeSamples ?? 260
  const tailSamples = o.tailSamples ?? 140
  const width = o.width ?? 0.2
  const tailWidth = o.tailWidth ?? 0.9
  const lift = o.lift ?? 0.05

  const uvCurve = new CatmullRomCurve3(route.map(([u, v]) => new Vector3(u, 0, v)), false, 'centripetal')
  const centre: Vector3[] = []
  for (let i = 0; i <= routeSamples; i++) {
    const p = uvCurve.getPoint(i / routeSamples)
    const [x, z] = uvToWorld(p.x, p.z)
    centre.push(new Vector3(x, sculptHeight(hf, p.x, p.z) + lift, z))
  }

  const last = centre[centre.length - 1]
  const prev = centre[centre.length - 8]
  const dir = last.clone().sub(prev).setY(0).normalize()
  const end = o.tailEnd ?? last.clone().add(new Vector3(-3.5, 6.5, -9))
  const tail = new CubicBezierCurve3(
    last.clone(),
    last.clone().addScaledVector(dir, 1.6).add(new Vector3(0, 0.9, 0)),
    end.clone().add(new Vector3(2.5, -3.2, 3)),
    end,
  )
  for (let i = 1; i <= tailSamples; i++) centre.push(tail.getPoint(i / tailSamples))

  // длина по дуге — по ней лента рисуется равномерно, а не по индексам
  const len = [0]
  for (let i = 1; i < centre.length; i++) len.push(len[i - 1] + centre[i].distanceTo(centre[i - 1]))
  const total = len[len.length - 1]
  const routeEnd = len[routeSamples] / total

  const n = centre.length
  const pos = new Float32Array(n * 2 * 3)
  const aT = new Float32Array(n * 2)
  const aSide = new Float32Array(n * 2)
  const up = new Vector3(0, 1, 0)
  const tan = new Vector3()
  const side = new Vector3()
  for (let i = 0; i < n; i++) {
    const a = centre[Math.max(i - 1, 0)], b = centre[Math.min(i + 1, n - 1)]
    tan.subVectors(b, a).normalize()
    side.crossVectors(tan, up)
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
    side.normalize()
    const t = len[i] / total
    // на хвосте лента закручивается на пол-оборота и раскрывается
    const k = t <= routeEnd ? 0 : (t - routeEnd) / (1 - routeEnd)
    const ease = k * k * (3 - 2 * k)
    side.applyAxisAngle(tan, ease * Math.PI * 0.85)
    const w = (width + (tailWidth - width) * ease) / 2
    for (let s = 0; s < 2; s++) {
      const sign = s === 0 ? -1 : 1
      const j = i * 2 + s
      pos[j * 3] = centre[i].x + side.x * w * sign
      pos[j * 3 + 1] = centre[i].y + side.y * w * sign
      pos[j * 3 + 2] = centre[i].z + side.z * w * sign
      aT[j] = t
      aSide[j] = sign
    }
  }
  const index: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3
    index.push(a, c, b, b, c, d)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('aT', new BufferAttribute(aT, 1))
  g.setAttribute('aSide', new BufferAttribute(aSide, 1))
  g.setIndex(index)
  return { geometry: g, routeEnd, centre }
}
