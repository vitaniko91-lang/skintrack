import { render } from '@testing-library/react'
import { RouteMap } from './RouteMap'

describe('RouteMap', () => {
  it('animates the route line and waypoints when motion is not reduced', () => {
    const { container } = render(<RouteMap drawn slopeOn={false} reduced={false} />)
    const path = container.querySelector('path')!
    const g = container.querySelector('g')!
    expect(path.getAttribute('class')).toContain('transition-[stroke-dashoffset]')
    expect(g.getAttribute('class')).toContain('transition-[opacity]')
    expect(g.getAttribute('class')).toContain('delay-[900ms]')
  })
  it('has no transition classes when motion is reduced — the change is instant', () => {
    const { container } = render(<RouteMap drawn slopeOn={false} reduced />)
    const path = container.querySelector('path')!
    const g = container.querySelector('g')!
    expect(path.getAttribute('class') ?? '').not.toContain('transition')
    expect(g.getAttribute('class') ?? '').not.toContain('transition')
  })
  it('has no transition classes before the route is drawn', () => {
    const { container } = render(<RouteMap drawn={false} slopeOn={false} reduced={false} />)
    const path = container.querySelector('path')!
    const g = container.querySelector('g')!
    expect(path.getAttribute('class') ?? '').not.toContain('transition')
    expect(g.getAttribute('class') ?? '').not.toContain('transition')
  })
})
