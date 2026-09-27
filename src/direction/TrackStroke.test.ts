import { imageToScreen } from './TrackStroke'

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
