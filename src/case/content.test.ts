import { SOURCES, STATS, PERSONA, JOURNEY, DECISIONS } from './content'

const sourceIds = new Set(SOURCES.map((s) => s.id))

describe('case content integrity', () => {
  it('every stat cites an existing source', () => {
    STATS.forEach((s) => expect(sourceIds.has(s.sourceId)).toBe(true))
  })
  it('every source has an https url, an access date and a verbatim quote', () => {
    SOURCES.forEach((s) => {
      expect(s.url).toMatch(/^https:\/\//)
      expect(s.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(s.quotes.length).toBeGreaterThan(0)
    })
  })
  it('the persona is labelled as illustrative', () => {
    expect(PERSONA.disclaimer).toMatch(/not user research/i)
  })
  it('the journey has the five stages from the spec, in order', () => {
    expect(JOURNEY.map((j) => j.stage)).toEqual(['Evening before', 'Parking', 'Ascent', 'Ridge decision', 'Descent'])
  })
  it('each decision compares 2–4 options and chooses exactly one of them', () => {
    expect(DECISIONS).toHaveLength(3)
    DECISIONS.forEach((d) => {
      expect(d.options.length).toBeGreaterThanOrEqual(2)
      expect(d.options.length).toBeLessThanOrEqual(4)
      expect(d.options.filter((o) => o.id === d.chosen)).toHaveLength(1)
      expect(d.tradeoffs.length).toBeGreaterThan(0)
      expect(d.revisit.length).toBeGreaterThan(0)
    })
  })
  it('decision options only cite existing sources', () => {
    DECISIONS.flatMap((d) => d.options).forEach((o) => {
      if (o.sourceId) expect(sourceIds.has(o.sourceId)).toBe(true)
    })
  })
})
