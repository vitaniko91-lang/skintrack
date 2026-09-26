import { formatDuration, formatRouteStats, loadHeightfieldOnce, resetHeightfieldCache } from './routeSummary'
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
      { label: 'gain', value: '999 m' },
      { label: 'time', value: '3:18' },
    ])
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
