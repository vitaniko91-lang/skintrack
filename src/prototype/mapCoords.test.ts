import { uvToMap, polylinePoints, smoothPath, type MapCrop } from './mapCoords'
import { MAP_CROP } from './mapCrop'
import { ROUTE_UV } from '../terrain/route'

const crop: MapCrop = { u0: 0.5, u1: 1, v0: 0, v1: 0.5, width: 100, height: 200 }

describe('uvToMap', () => {
  it('maps the crop corners to the image corners', () => {
    expect(uvToMap([0.5, 0], crop)).toEqual([0, 0])
    expect(uvToMap([1, 0.5], crop)).toEqual([100, 200])
  })
  it('maps the crop centre to the image centre', () => {
    expect(uvToMap([0.75, 0.25], crop)).toEqual([50, 100])
  })
})

describe('polylinePoints', () => {
  it('formats an SVG points string with one decimal', () => {
    expect(polylinePoints([[0.5, 0], [0.75, 0.25]], crop)).toBe('0.0,0.0 50.0,100.0')
  })
})

describe('real route on the generated map', () => {
  it('keeps every route point inside the map with a margin', () => {
    ROUTE_UV.forEach((p) => {
      const [x, y] = uvToMap(p, MAP_CROP)
      expect(x).toBeGreaterThan(MAP_CROP.width * 0.05)
      expect(x).toBeLessThan(MAP_CROP.width * 0.95)
      expect(y).toBeGreaterThan(MAP_CROP.height * 0.05)
      expect(y).toBeLessThan(MAP_CROP.height * 0.95)
    })
  })
})

describe('smoothPath', () => {
  const pts: [number, number][] = [[0, 0], [10, 20], [30, 25], [50, 60]]
  it('starts at the first point, has n-1 cubic segments and ends at the last point', () => {
    const d = smoothPath(pts)
    expect(d.startsWith('M 0.0,0.0')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(pts.length - 1)
    expect(d.endsWith('50.0,60.0')).toBe(true)
  })
  it('uses Catmull-Rom tangents (tension 0.5): first control point is p1 + (p2 - p0) / 6', () => {
    // segment 0: p0 duplicated as the phantom before it → cp1 = p0 + (p1 - p0) / 6
    expect(smoothPath(pts)).toContain('C 1.7,3.3')
  })
})
