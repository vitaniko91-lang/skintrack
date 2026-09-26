/** Ссылка на запись в списке источников внизу страницы. 40px зона нажатия — псевдоэлементом. */
export function SourceRef({ sourceId }: { sourceId: string }) {
  return (
    <a
      href={`#source-${sourceId}`}
      className="relative font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted underline decoration-line underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] hover:text-accent"
    >
      Source
    </a>
  )
}
