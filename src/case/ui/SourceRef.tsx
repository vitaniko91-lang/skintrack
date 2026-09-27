import { SOURCES } from '../content'

/** Ссылка на запись в списке источников внизу страницы. 40px зона нажатия — псевдоэлементом. */
export function SourceRef({ sourceId }: { sourceId: string }) {
  const source = SOURCES.find((s) => s.id === sourceId)
  return (
    <a
      href={`#source-${sourceId}`}
      aria-label={source ? `Source: ${source.publisher} — ${source.title}` : 'Source'}
      className="relative inline-flex items-center gap-1 whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cyan underline decoration-cyan/40 underline-offset-4 transition-colors duration-200 before:absolute before:-inset-x-1 before:-inset-y-4 before:content-[''] hover:text-cyan-hot hover:decoration-cyan-hot"
    >
      Source <span aria-hidden className="icon-[lucide--arrow-down-right] size-3" />
    </a>
  )
}
