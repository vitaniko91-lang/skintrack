import { approach, floatY, gearRibbonPath, tiltFor, finalePhases, mixPose, poseEqual, poseTransform, ROW_POSE, screenRibbonPath, SLOT_POSE, slotOf, tryPhases } from './chapterMath'
import { samplePath } from './layout'

describe('slotOf', () => {
  it('puts the active screen in front and neighbours on the sides', () => {
    expect([0, 1, 2, 3].map((i) => slotOf(i, 0, 4))).toEqual(['front', 'right', 'back', 'left'])
    expect([0, 1, 2, 3].map((i) => slotOf(i, 3, 4))).toEqual(['right', 'back', 'left', 'front'])
  })
  it('keeps exactly one phone in front for every active index', () => {
    for (let a = 0; a < 4; a++) expect([0, 1, 2, 3].filter((i) => slotOf(i, a, 4) === 'front')).toEqual([a])
  })
})

describe('poses', () => {
  it('mixes linearly', () => {
    const m = mixPose(ROW_POSE.front, SLOT_POSE.front, 0.5)
    expect(m.y).toBeCloseTo((ROW_POSE.front.y + SLOT_POSE.front.y) / 2)
    expect(poseEqual(mixPose(ROW_POSE.left, SLOT_POSE.left, 1), SLOT_POSE.left, 1e-9)).toBe(true)
  })
  it('approaches the target and settles regardless of frame rate', () => {
    let a = { ...SLOT_POSE.left }, b = { ...SLOT_POSE.left }
    for (let i = 0; i < 60; i++) a = approach(a, SLOT_POSE.front, 1 / 60)
    for (let i = 0; i < 30; i++) b = approach(b, SLOT_POSE.front, 1 / 30)
    expect(a.x).toBeCloseTo(b.x, 5)
    for (let i = 0; i < 240; i++) a = approach(a, SLOT_POSE.front, 1 / 60)
    expect(poseEqual(a, SLOT_POSE.front)).toBe(true)
  })
  it('side phones sit behind and dimmer than the front one', () => {
    for (const s of ['left', 'right'] as const) {
      expect(SLOT_POSE[s].z).toBeLessThan(SLOT_POSE.front.z)
      expect(SLOT_POSE[s].dim).toBeGreaterThan(SLOT_POSE.front.dim)
    }
    expect(SLOT_POSE.back.op).toBe(0)
  })
  it('writes a transform with translate, rotations and scale', () => {
    const t = poseTransform(SLOT_POSE.front, 390, 800, 0.8)
    expect(t).toMatch(/^translate3d\(0\.0px,0\.0px,0\.0px\) rotateX\(8\.00deg\) rotateY\(-15\.00deg\) rotateZ\(-5\.00deg\) scale\(0\.8000\)$/)
  })
})

describe('floatY', () => {
  it('stays within the amplitude and differs per phone', () => {
    for (let t = 0; t < 10; t += 0.37) expect(Math.abs(floatY(0, t))).toBeLessThanOrEqual(7)
    expect(floatY(0, 1)).not.toBeCloseTo(floatY(1, 1), 2)
  })
})

describe('screenRibbonPath', () => {
  it('starts at the top edge heading down and ends on the target', () => {
    const d = screenRibbonPath({ x: 1000, y: -40 }, { x: 900, y: 420 })
    const pts = samplePath(d, 40)
    expect(pts[0]).toEqual({ x: 1000, y: -40 })
    expect(pts[pts.length - 1].x).toBeCloseTo(900, 1)
    expect(pts[pts.length - 1].y).toBeCloseTo(420, 1)
    expect(pts[3].y).toBeGreaterThan(pts[0].y) // сначала вниз
    // входит в точку сверху: последний отрезок идёт вниз
    expect(pts[pts.length - 1].y).toBeGreaterThan(pts[pts.length - 3].y)
  })
})

describe('phases', () => {
  it('builds the route only once the ribbon has reached the screen', () => {
    expect(tryPhases(0.2).build).toBe(false)
    expect(tryPhases(0.4)).toMatchObject({ draw: 1, build: true, erase: 0 })
    expect(tryPhases(1).erase).toBe(1)
  })
  it('finale: fill follows the outline, buttons follow the fill, ribbon leaves last', () => {
    const f = finalePhases(0.5)
    expect(f.draw).toBe(1)
    expect(f.fill).toBe(0)
    expect(finalePhases(0.66).fill).toBe(1)
    expect(finalePhases(0.6).erase).toBe(0)
    expect(finalePhases(1)).toEqual({ draw: 1, erase: 1, fill: 1, ui: 1 })
  })
})

describe('tiltFor', () => {
  it('is flat in the middle and tilts toward the pointer', () => {
    expect(tiltFor(0.5, 0.5, 8)).toEqual({ rx: 0, ry: 0 })
    expect(tiltFor(1, 0, 8)).toEqual({ rx: 8, ry: 8 })
    expect(tiltFor(-3, 9, 8)).toEqual({ rx: -8, ry: -8 })
  })
})

describe('gearRibbonPath', () => {
  // 1440: шлем 5 колонок на 2 ряда, часы 7, бутылка 3, шапка 4; щели 24
  const rects = [
    { x: 58, y: 300, w: 530, h: 1064 },
    { x: 612, y: 300, w: 770, h: 520 },
    { x: 612, y: 844, w: 318, h: 520 },
    { x: 954, y: 844, w: 428, h: 520 },
  ]
  const pts = samplePath(gearRibbonPath(rects, 1440, 1600).replace(/L([\d.-]+),([\d.-]+)/g, 'C$1,$2 $1,$2 $1,$2'), 30)
  it('enters above the section and leaves below it', () => {
    expect(pts[0].y).toBeLessThan(0)
    expect(pts[pts.length - 1].y).toBeGreaterThan(1600)
  })
  it('runs inside the gutters, not across the photos', () => {
    const inside = (p: { x: number; y: number }, r: typeof rects[0]) => p.x > r.x + 30 && p.x < r.x + r.w - 30 && p.y > r.y + 30 && p.y < r.y + r.h - 30
    expect(pts.filter((p) => rects.some((r) => inside(p, r)))).toEqual([])
  })
})
