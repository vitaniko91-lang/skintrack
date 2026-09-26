import { ROUTE_UV, WAYPOINTS } from '../terrain/route'
import { MAP_CROP } from './mapCrop'
import { polylinePoints, uvToMap } from './mapCoords'

interface Props { drawn: boolean; slopeOn: boolean; reduced: boolean }

/**
 * Две картинки и SVG одного размера (720×960), все в режиме cover: масштаб у них
 * одинаковый, поэтому трек ложится ровно на склон при любой высоте телефона.
 */
export function RouteMap({ drawn, slopeOn, reduced }: Props) {
  const points = polylinePoints(ROUTE_UV, MAP_CROP)
  return (
    <div
      role="img"
      aria-label={`Map: ascent from Schwarzsee to the shoulder${slopeOn ? ', slope layer on' : ''}`}
      className="relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-ground-1"
    >
      <img src="./terrain/map-base.webp" alt="" className="absolute inset-0 size-full object-cover" />
      <img
        src="./terrain/map-slope.webp"
        alt=""
        className={`absolute inset-0 size-full object-cover ${reduced ? '' : 'transition-opacity duration-200'} ${slopeOn ? 'opacity-100' : 'opacity-0'}`}
      />
      <svg
        viewBox={`0 0 ${MAP_CROP.width} ${MAP_CROP.height}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <polyline
          points={points}
          pathLength={1}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1.01"
          strokeDashoffset={drawn ? 0 : 1}
          style={{ transition: drawn && !reduced ? 'stroke-dashoffset 1200ms var(--ease-out-strong)' : 'none' }}
        />
        {drawn && WAYPOINTS.map((w) => {
          const [x, y] = uvToMap(ROUTE_UV[w.index], MAP_CROP)
          return <circle key={w.name} cx={x} cy={y} r={11} fill="var(--color-ground)" stroke="var(--color-accent)" strokeWidth={5} />
        })}
      </svg>
    </div>
  )
}
