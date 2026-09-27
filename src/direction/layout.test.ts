import { avoid, edgePoint, formatElevation, formatKm, hazardSpan, manifestoPath, ndcToScreen, placeCard } from './layout'

describe('ndcToScreen', () => {
  it('maps NDC corners to pixel corners with y flipped', () => {
    expect(ndcToScreen(-1, 1, 1440, 900)).toEqual({ x: 0, y: 0 })
    expect(ndcToScreen(1, -1, 1440, 900)).toEqual({ x: 1440, y: 900 })
    expect(ndcToScreen(0, 0, 1440, 900)).toEqual({ x: 720, y: 450 })
  })
})

describe('placeCard', () => {
  const view = { w: 1440, h: 900 }, card = { w: 300, h: 200 }
  it('puts the card on the side the offset points to', () => {
    expect(placeCard({ x: 600, y: 400 }, card, view, { x: 40, y: 20 })).toMatchObject({ x: 640, y: 420 })
    expect(placeCard({ x: 600, y: 400 }, card, view, { x: -40, y: -20 })).toMatchObject({ x: 260, y: 180 })
  })
  it('keeps the card inside the viewport and under the header', () => {
    const r = placeCard({ x: 1400, y: 10 }, card, view, { x: 40, y: -20 }, 16, 80)
    expect(r.x).toBe(1440 - 16 - 300)
    expect(r.y).toBe(96)
  })
})

describe('edgePoint', () => {
  const r = { x: 100, y: 100, w: 200, h: 100 }
  it('clamps an outside anchor to the nearest edge', () => {
    expect(edgePoint(r, { x: 50, y: 150 })).toEqual({ x: 100, y: 150 })
    expect(edgePoint(r, { x: 400, y: 400 })).toEqual({ x: 300, y: 200 })
  })
  it('routes an inside anchor to the closest side', () => {
    expect(edgePoint(r, { x: 110, y: 150 })).toEqual({ x: 100, y: 150 })
  })
})

describe('hazardSpan', () => {
  it('finds the longest run at or above the threshold', () => {
    const s = [10, 36, 20, 30, 35, 38, 37, 12, 5, 0, 0]
    expect(hazardSpan(s, 35)).toEqual([0.4, 0.6])
  })
  it('bridges short dips and picks the run nearest a given point', () => {
    const s = [36, 36, 10, 10, 10, 36, 20, 37, 36, 10, 10]
    expect(hazardSpan(s, 35, { gap: 1, near: 0.7 })).toEqual([0.5, 0.8])
    expect(hazardSpan(s, 35, { gap: 1, near: 0 })).toEqual([0, 0.1])
  })
  it('returns null when nothing is steep enough', () => {
    expect(hazardSpan([10, 20, 30], 35)).toBeNull()
  })
})

describe('format', () => {
  it('formats route numbers like the rest of the page', () => {
    expect(formatKm(3181.4)).toBe('3.18 km')
    expect(formatElevation(3401.2)).toBe('3,401 m')
  })
})

describe('manifestoPath', () => {
  it('enters above the frame and leaves below it', () => {
    const d = manifestoPath(1440, 900, { x: 400, y: 400, w: 300, h: 100 })
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
    expect(nums[1]).toBeLessThan(0)
    expect(nums[nums.length - 1]).toBeGreaterThan(900)
    expect(d.startsWith('M')).toBe(true)
  })
})

describe('avoid', () => {
  const view = { w: 375, h: 812 }
  it('leaves a free card alone', () => {
    const r = { x: 0, y: 0, w: 100, h: 100 }
    expect(avoid(r, [{ x: 200, y: 200, w: 100, h: 100 }], view)).toEqual(r)
  })
  it('moves an overlapping card to the nearest free slot', () => {
    const placed = [{ x: 150, y: 300, w: 200, h: 150 }]
    const r = avoid({ x: 100, y: 280, w: 180, h: 100 }, placed, view, 12)
    expect(r.y).toBe(300 - 12 - 100)
    expect(r.x).toBe(100)
  })
  it('respects the header band', () => {
    const placed = [{ x: 0, y: 120, w: 375, h: 150 }]
    const r = avoid({ x: 0, y: 100, w: 180, h: 100 }, placed, view, 12, 16, 80)
    expect(r.y).toBe(120 + 150 + 12)
  })
})
