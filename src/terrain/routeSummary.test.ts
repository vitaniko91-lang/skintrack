import { formatDuration, formatRouteStats, loadHeightfieldOnce, loadRouteStatsOnce, resetHeightfieldCache, resetRouteStatsCache } from './routeSummary'
import { loadHeightfield } from './loadHeightfield'

vi.mock('./loadHeightfield', () => ({ loadHeightfield: vi.fn() }))
const mockedLoad = vi.mocked(loadHeightfield)

describe('formatDuration', () => {
  it('formats minutes as h:mm', () => {
    expect(formatDuration(198)).toBe('3:18')
    expect(formatDuration(5)).toBe('0:05')
    expect(formatDuration(60)).toBe('1:00')
  })
})

describe('formatRouteStats', () => {
  it('returns max slope, gain and time rows with units', () => {
    const rows = formatRouteStats({ lengthM: 3183, gainM: 999.4, maxSlopeDeg: 37.6, minutes: 198 })
    expect(rows).toEqual([
      { label: 'max slope', value: '38°' },
      { label: 'gain', value: '1,000 m' },
      { label: 'time', value: '3:18' },
    ])
  })

  it('rounds gain to 10 m like a topo map, with a thousands separator', () => {
    const gain = (g: number) => formatRouteStats({ lengthM: 1, gainM: g, maxSlopeDeg: 0, minutes: 0 })[1].value
    expect(gain(994.9)).toBe('990 m')
    expect(gain(1234)).toBe('1,230 m')
    expect(gain(40)).toBe('40 m')
  })
})

describe('loadHeightfieldOnce', () => {
  beforeEach(() => { resetHeightfieldCache(); mockedLoad.mockReset() })

  it('loads the heightfield only once for concurrent callers', async () => {
    const hf = { width: 1, height: 1, heights: new Float32Array(1), minH: 0, maxH: 0, cellMeters: 1 }
    mockedLoad.mockResolvedValue(hf)
    const [a, b] = await Promise.all([loadHeightfieldOnce(), loadHeightfieldOnce()])
    expect(a).toBe(b)
    expect(mockedLoad).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed load instead of caching the failure', async () => {
    mockedLoad.mockRejectedValueOnce(new Error('offline'))
    await expect(loadHeightfieldOnce()).rejects.toThrow('offline')
    mockedLoad.mockResolvedValueOnce({ width: 1, height: 1, heights: new Float32Array(1), minH: 0, maxH: 0, cellMeters: 1 })
    await expect(loadHeightfieldOnce()).resolves.toBeTruthy()
    expect(mockedLoad).toHaveBeenCalledTimes(2)
  })
})

describe('loadRouteStatsOnce', () => {
  beforeEach(() => { resetHeightfieldCache(); resetRouteStatsCache(); mockedLoad.mockReset() })

  const hf = { width: 3, height: 3, heights: new Float32Array(9), minH: 0, maxH: 0, cellMeters: 1 }

  it('computes route stats (routeStats + slopeGrid) only once, reusing the same object, for repeated/concurrent callers', async () => {
    mockedLoad.mockResolvedValue(hf)
    const [a, b] = await Promise.all([loadRouteStatsOnce(), loadRouteStatsOnce()])
    expect(a).toBe(b)
    const c = await loadRouteStatsOnce()
    expect(c).toBe(a)
    expect(mockedLoad).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed computation instead of caching the failure', async () => {
    mockedLoad.mockRejectedValueOnce(new Error('offline'))
    await expect(loadRouteStatsOnce()).rejects.toThrow('offline')
    mockedLoad.mockResolvedValueOnce(hf)
    await expect(loadRouteStatsOnce()).resolves.toBeTruthy()
    expect(mockedLoad).toHaveBeenCalledTimes(2)
  })
})
