import { useEffect, useState } from 'react'
import { CaseSection } from '../ui/CaseSection'
import { GLASS } from '../ui/glass'

export const TOKENS = [
  { name: 'ground', role: 'Base — page and 3D scene', group: 'brand' },
  { name: 'ground-1', role: 'Glass panels', group: 'brand' },
  { name: 'ground-2', role: 'Chips', group: 'brand' },
  { name: 'body', role: 'Text', group: 'brand' },
  { name: 'muted', role: 'Secondary text', group: 'brand' },
  { name: 'accent', role: 'Ice cyan — what you can press, the ribbon', group: 'brand' },
  { name: 'cyan-hot', role: 'Glow — the italic accent word', group: 'brand' },
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
      <span aria-hidden className="size-14 shrink-0 rounded-[18px] ring-1 ring-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]" style={{ background: `var(--color-${name})` }} />
      <span className="min-w-0">
        <span className="block font-mono text-sm text-white">{name}</span>
        <span className="block text-sm leading-snug text-muted">{role}</span>
        <span className="block font-mono text-xs tabular-nums text-cyan/80">{value}</span>
      </span>
    </li>
  )
}

const TYPE = [
  { sample: 'skintrack', spec: 'Archivo · 112% width · 600 · −0.055em, lowercase — wordmark', className: 'wordmark text-6xl text-white' },
  { sample: 'The route', spec: 'Archivo · 125% width · 800 · caps, −0.03em — chapter titles', className: 'caps-wide text-4xl font-extrabold uppercase tracking-[-0.03em] text-white' },
  { sample: 'Read the slope', spec: 'Instrument Serif italic — the accent word, chapter numbers', className: 'font-serif text-5xl italic text-cyan-hot [text-shadow:0_0_40px_rgb(92_232_255/0.45)]' },
  { sample: 'Space out: one at a time.', spec: 'Archivo · 100% width · 400 — body', className: 'text-xl' },
  { sample: '38° · 1,000 m · 3:18', spec: 'JetBrains Mono · tabular numbers — data, coordinates, labels', className: 'font-mono text-3xl tabular-nums text-cyan' },
]

export function System() {
  return (
    <CaseSection id="system" index={5} accent="A small" label="system" title="A small system: one accent, three type families, contour lines.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${GLASS} p-8 max-md:p-5`}>
          <h3 className="caps-wide text-lg font-extrabold uppercase tracking-[0.02em] text-white">Brand</h3>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {TOKENS.filter((t) => t.group === 'brand').map((t) => <Swatch key={t.name} name={t.name} role={t.role} />)}
          </ul>
          <h3 className="caps-wide mt-12 text-lg font-extrabold uppercase tracking-[0.02em] text-white">Safety data — never used for brand</h3>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {TOKENS.filter((t) => t.group === 'safety').map((t) => <Swatch key={t.name} name={t.name} role={t.role} />)}
          </ul>
        </div>
        <div className={`${GLASS} p-8 max-md:p-5`}>
          <h3 className="caps-wide text-lg font-extrabold uppercase tracking-[0.02em] text-white">Type</h3>
          <ul className="mt-6 space-y-9">
            {TYPE.map((t) => (
              <li key={t.spec}>
                <p className={`leading-none ${t.className}`}>{t.sample}</p>
                <p className="mt-3 font-mono text-xs text-muted">{t.spec}</p>
              </li>
            ))}
          </ul>
          <h3 className="caps-wide mt-12 text-lg font-extrabold uppercase tracking-[0.02em] text-white">Contour lines</h3>
          <figure className="mt-6">
            <img
              src="./terrain/map-base.webp"
              width={720}
              height={960}
              alt="Top-down relief of the Matterhorn’s north side drawn with contour lines."
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full max-w-md rounded-[28px] object-cover ring-1 ring-white/10"
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
