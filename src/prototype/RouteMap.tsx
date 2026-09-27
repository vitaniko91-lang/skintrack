import { ROUTE_UV, WAYPOINTS } from '../terrain/route'
import { MAP_CROP } from './mapCrop'
import { smoothPath, uvToMap } from './mapCoords'

interface Props { drawn: boolean; slopeOn: boolean; reduced: boolean }

/**
 * Две картинки и SVG одного размера (720×960), все в режиме cover/slice с центровкой: карта
 * заполняет карточку без полей, а слои остаются совмещены. На высоких телефонах срезаются
 * края по бокам — точки маршрута лежат в 10–90% ширины и остаются внутри (проверено на 375).
 */
export function RouteMap({ drawn, slopeOn, reduced }: Props) {
  const d = smoothPath(ROUTE_UV.map((p) => uvToMap(p, MAP_CROP)))
  return (
    <div
      role="img"
      aria-label={`Map: ascent from the start to the shoulder${slopeOn ? ', slope layer on' : ''}`}
      className="relative aspect-[3/4] max-h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-ground-1"
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
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1.01"
          strokeDashoffset={drawn ? 0 : 1}
          className={drawn && !reduced ? 'transition-[stroke-dashoffset] duration-[1200ms] ease-[var(--ease-out-strong)]' : ''}
        />
        {/* Waypoints fade in after the line has mostly drawn, instead of popping in with it. */}
        <g
          style={{ opacity: drawn ? 1 : 0 }}
          className={drawn && !reduced ? 'transition-[opacity] duration-[400ms] ease-[var(--ease-out-strong)] delay-[900ms]' : ''}
        >
          {WAYPOINTS.map((w) => {
            const [x, y] = uvToMap(ROUTE_UV[w.index], MAP_CROP)
            return <circle key={w.name} cx={x} cy={y} r={11} fill="var(--color-ground)" stroke="var(--color-accent)" strokeWidth={5} />
          })}
        </g>
      </svg>
    </div>
  )
}
