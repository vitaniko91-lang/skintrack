import { useEffect, useState } from 'react'
import { CaseSection } from '../ui/CaseSection'

export const TOKENS = [
  { name: 'ground', role: 'Page', group: 'brand' },
  { name: 'ground-1', role: 'Cards', group: 'brand' },
  { name: 'ground-2', role: 'Chips', group: 'brand' },
  { name: 'body', role: 'Text', group: 'brand' },
  { name: 'muted', role: 'Secondary text', group: 'brand' },
  { name: 'accent', role: 'Only what you can press', group: 'brand' },
  { name: 'slope-30', role: '30–35°', group: 'safety' },
  { name: 'slope-35', role: '35–40°', group: 'safety' },
  { name: 'slope-40', role: '40–45°', group: 'safety' },
  { name: 'slope-45', role: '≥ 45°', group: 'safety' },
] as const

/** Значение читается из CSS-переменной: страница показывает то, что реально собрано, а не копию. */
function Swatch({ name, role }: { name: string; role: string }) {
  const [value, setValue] = useState('')
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim().toUpperCase())
  }, [name])
  return (
    <li className="flex items-center gap-4">
      <span aria-hidden className="size-14 shrink-0 rounded-2xl ring-1 ring-line" style={{ background: `var(--color-${name})` }} />
      <span>
        <span className="block font-mono text-sm">{name}</span>
        <span className="block text-sm text-muted">{role}</span>
        <span className="block font-mono text-xs tabular-nums text-muted">{value}</span>
      </span>
    </li>
  )
}

const TYPE = [
  { sample: 'skintrack', spec: 'Archivo · 125% width · 800 · −0.03em — wordmark', className: 'text-5xl font-extrabold lowercase tracking-[-0.03em]', stretch: '125%' },
  { sample: 'Read the slope', spec: 'Archivo · 115% width · 700 · −0.02em — headings', className: 'text-4xl font-bold tracking-[-0.02em]', stretch: '115%' },
  { sample: 'Space out: one at a time.', spec: 'Archivo · 100% width · 400 — body', className: 'text-xl', stretch: '100%' },
  { sample: '38° · 999 m · 3:18', spec: 'JetBrains Mono · tabular numbers — data, coordinates, labels', className: 'font-mono text-3xl tabular-nums', stretch: '100%' },
]

export function System() {
  return (
    <CaseSection id="system" index={5} label="System" title="A small system: one accent, two type families, contour lines.">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold">Brand</h3>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {TOKENS.filter((t) => t.group === 'brand').map((t) => <Swatch key={t.name} name={t.name} role={t.role} />)}
          </ul>
          <h3 className="mt-12 text-xl font-semibold">Safety data — never used for brand</h3>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {TOKENS.filter((t) => t.group === 'safety').map((t) => <Swatch key={t.name} name={t.name} role={t.role} />)}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Type</h3>
          <ul className="mt-6 space-y-8">
            {TYPE.map((t) => (
              <li key={t.spec}>
                <p className={t.className} style={{ fontStretch: t.stretch }}>{t.sample}</p>
                <p className="mt-2 font-mono text-xs text-muted">{t.spec}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-12 text-xl font-semibold">Contour lines</h3>
          <figure className="mt-6">
            <img
              src="./terrain/map-base.webp"
              width={720}
              height={960}
              alt="Top-down relief of the Matterhorn’s north side drawn with contour lines."
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-[var(--radius-card)] object-cover"
            />
            <figcaption className="mt-3 text-sm text-muted">
              Contours every 50 m, index lines every 250 m. One elevation model feeds the 3D scene, the phone map and the slope layer — so the route lands on the same slope everywhere.
            </figcaption>
          </figure>
        </div>
      </div>
    </CaseSection>
  )
}
