import { SOURCES } from '../content'

export function Sources() {
  return (
    <section id="sources" aria-labelledby="sources-title" className="px-4 py-20 md:px-10">
      <h2 id="sources-title" className="text-2xl font-bold" style={{ fontStretch: '115%' }}>Sources</h2>
      <ol className="mt-8 space-y-6">
        {SOURCES.map((s) => (
          <li key={s.id} id={`source-${s.id}`} className="max-w-3xl scroll-mt-8">
            <a href={s.url} className="font-semibold underline decoration-line underline-offset-4 hover:text-accent">
              {s.publisher} — {s.title}
            </a>
            <p className="mt-1 font-mono text-xs text-muted">Accessed {s.accessed}</p>
            {s.quotes.map((q) => <blockquote key={q} className="mt-2 border-l border-line pl-4 text-muted">{q}</blockquote>)}
          </li>
        ))}
      </ol>
    </section>
  )
}
