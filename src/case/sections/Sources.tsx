import { SOURCES } from '../content'
import { CaseSection } from '../ui/CaseSection'

export function Sources() {
  return (
    <CaseSection id="sources" index={6} accent="Every" label="source" title="Every number above, and where it came from.">
      <ol className="grid gap-6 lg:grid-cols-2">
        {SOURCES.map((s, i) => (
          <li key={s.id} id={`source-${s.id}`} className="scroll-mt-24 border-t border-cyan/30 pt-6 target:border-cyan">
            <p className="font-serif text-[2.6rem] italic leading-none text-cyan">0{i + 1}</p>
            <a href={s.url} className="mt-3 inline-block text-[19px] font-semibold leading-snug text-white underline decoration-cyan/40 underline-offset-4 transition-colors duration-200 hover:text-cyan-hot hover:decoration-cyan-hot">
              {s.publisher} — {s.title} <span aria-hidden className="icon-[lucide--arrow-up-right] size-4 align-[-2px]" />
            </a>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">Accessed {s.accessed}</p>
            {s.quotes.map((q) => <blockquote key={q} className="mt-4 border-l-2 border-cyan/40 pl-4 leading-relaxed text-body/80">{q}</blockquote>)}
          </li>
        ))}
      </ol>
    </CaseSection>
  )
}
