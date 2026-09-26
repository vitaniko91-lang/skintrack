import { SOURCES } from '../content'

/** Ссылка на запись в списке источников внизу страницы. 40px зона нажатия — псевдоэлементом. */
export function SourceRef({ sourceId }: { sourceId: string }) {
  const source = SOURCES.find((s) => s.id === sourceId)
  return (
    <a
      href={`#source-${sourceId}`}
      aria-label={source ? `Source: ${source.publisher} — ${source.title}` : 'Source'}
      className="relative font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted underline decoration-line underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-4 before:content-[''] hover:text-accent"
    >
      Source
    </a>
  )
}
