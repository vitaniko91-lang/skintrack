import { statusNotice, checkItems, checkPasses, DEFAULT_CONDITIONS } from './conditions'

describe('statusNotice', () => {
  it('is quiet in normal conditions', () => {
    expect(statusNotice(DEFAULT_CONDITIONS)).toBeNull()
  })
  it('warns about missing signal first', () => {
    expect(statusNotice({ ...DEFAULT_CONDITIONS, signal: false, battery: 10 })).toMatch(/no signal/i)
  })
  it('warns about low battery below 20%', () => {
    expect(statusNotice({ ...DEFAULT_CONDITIONS, battery: 19 })).toMatch(/battery 19%/i)
    expect(statusNotice({ ...DEFAULT_CONDITIONS, battery: 20 })).toBeNull()
  })
})

describe('group check', () => {
  it('passes with the whole group sending', () => {
    expect(checkItems(DEFAULT_CONDITIONS).map((i) => i.id)).toEqual(['transceivers', 'signal', 'plan'])
    expect(checkPasses(DEFAULT_CONDITIONS)).toBe(true)
  })
  it('fails when a transceiver is off, and says whose', () => {
    const c = { ...DEFAULT_CONDITIONS, groupOk: false }
    expect(checkPasses(c)).toBe(false)
    expect(checkItems(c)[0].detail).toMatch(/lena: off/i)
    expect(checkItems(c)[0].reason).toBe("Lena's transceiver is off")
  })
  it('no cell signal does not block the tour, but is reported', () => {
    const c = { ...DEFAULT_CONDITIONS, signal: false }
    expect(checkPasses(c)).toBe(true)
    expect(checkItems(c)[1].detail).toMatch(/satellite/i)
  })
})
