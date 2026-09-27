import { SOURCES } from '../content'
import { CaseSection } from '../ui/CaseSection'

export function Sources() {
  return (
    <CaseSection id="sources" index={6} label="Sources" title="Every number above, and where it came from.">
      <ol className="space-y-8">
        {SOURCES.map((s) => (
          <li key={s.id} id={`source-${s.id}`} className="max-w-3xl scroll-mt-8 border-t border-line pt-6">
            <a href={s.url} className="text-lg font-semibold underline decoration-line underline-offset-4 hover:text-accent">
              {s.publisher} — {s.title}
            </a>
            <p className="mt-1 font-mono text-xs text-muted">Accessed {s.accessed}</p>
            {s.quotes.map((q) => <blockquote key={q} className="mt-3 border-l border-line pl-4 text-muted">{q}</blockquote>)}
          </li>
        ))}
      </ol>
    </CaseSection>
  )
}
