import { decodeTerrarium, heightfieldFromRGBA, heightAt } from './decode'

describe('decodeTerrarium', () => {
  it('128,0,0 is sea level', () => {
    expect(decodeTerrarium(128, 0, 0)).toBe(0)
  })
  it('decodes fractional metres from blue channel', () => {
    expect(decodeTerrarium(135, 160, 128)).toBeCloseTo(1952.5, 5)
  })
})

describe('heightfieldFromRGBA', () => {
  it('reads a 2×1 RGBA buffer row-major', () => {
    const rgba = new Uint8ClampedArray([128, 0, 0, 255, 128, 10, 0, 255])
    const hf = heightfieldFromRGBA(rgba, 2, 1, 100)
    expect(Array.from(hf.heights)).toEqual([0, 10])
    expect(hf.minH).toBe(0)
    expect(hf.maxH).toBe(10)
    expect(hf.cellMeters).toBe(100)
  })
})

describe('heightAt', () => {
  it('bilinearly interpolates between cells', () => {
    const rgba = new Uint8ClampedArray([
      128, 0, 0, 255, 128, 10, 0, 255,
      128, 20, 0, 255, 128, 30, 0, 255,
    ])
    const hf = heightfieldFromRGBA(rgba, 2, 2, 1)
    expect(heightAt(hf, 0.5, 0.5)).toBeCloseTo(15, 5)
    expect(heightAt(hf, 0, 0)).toBe(0)
    expect(heightAt(hf, 1, 1)).toBe(30)
  })
})
