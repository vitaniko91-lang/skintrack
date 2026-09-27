import { arcPath, imageToScreen } from './TrackStroke'

describe('imageToScreen', () => {
  it('maps image corners with object-fit cover (wider box crops top/bottom)', () => {
    const r = { left: 0, top: 0, width: 1600, height: 900 }
    const s = 1600 / 1280 // 1.25 → высота 1066, обрезано 166 поровну
    const [x0, y0] = imageToScreen(r, 0, 0)
    expect(x0).toBeCloseTo(0)
    expect(y0).toBeCloseTo((900 - 853 * s) / 2)
    const [x1] = imageToScreen(r, 1280, 853)
    expect(x1).toBeCloseTo(1600)
  })

  it('respects object-position 28% on the cropped axis', () => {
    const r = { left: 10, top: 0, width: 400, height: 900 }
    const s = 900 / 853
    const [x0] = imageToScreen(r, 0, 0)
    expect(x0).toBeCloseTo(10 + (400 - 1280 * s) * 0.28)
  })
})

describe('arcPath', () => {
  const nums = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number)

  it('ends tangent to the 3D ribbon direction (no kink at the handoff)', () => {
    const [, , , , c2x, c2y, sx, sy] = nums(arcPath([100, 600], [900, 500], [0.6, -0.8]))
    const tx = sx - c2x, ty = sy - c2y, l = Math.hypot(tx, ty)
    expect(tx / l).toBeCloseTo(0.6, 3)
    expect(ty / l).toBeCloseTo(-0.8, 3)
  })

  it('leaves the boot rising, never dipping below it first', () => {
    const [bx, by, c1x, c1y] = nums(arcPath([100, 600], [900, 620], [1, 0]))
    expect(c1y).toBeLessThan(by)
    expect(c1x).toBeGreaterThan(bx)
  })
})
