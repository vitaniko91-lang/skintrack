import type { ReactNode } from 'react'

/**
 * Глава кейса в манере Orlina (как главы сайта продукта): крупная курсивная цифра,
 * подпись главы — курсивное слово + широкий капс, под ней — заголовок-утверждение.
 */
export function CaseSection({ id, index, accent, label, title, children }: {
  id: string; index: number; accent: string; label: string; title: string; children: ReactNode
}) {
  const num = String(index).padStart(2, '0')
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative px-[5vw] py-[14svh] max-md:px-4 max-md:py-20">
      {/* подпись главы слева, утверждение справа по нижней линии — как «The gear» на сайте продукта */}
      <div className="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
      <div>
      <div className="flex items-baseline gap-4">
        <span aria-hidden className="font-serif text-[clamp(3.5rem,7vw,7.5rem)] italic leading-none text-cyan">{num}</span>
        <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">Chapter {num} · of 06</span>
      </div>
      <p className="mt-2 leading-[0.86]">
        <span className="block font-serif text-[clamp(3rem,6.4vw,7rem)] italic text-cyan-hot [text-shadow:0_0_40px_rgb(92_232_255/0.45)]">{accent}</span>
        <span className="caps-wide block text-[clamp(2.2rem,5vw,5.4rem)] font-extrabold uppercase tracking-[-0.03em] text-white">{label}</span>
      </p>
      </div>
      <h2
        id={`${id}-title`}
        className="mt-10 max-w-[20ch] lg:mt-0 lg:pb-2 text-[clamp(1.75rem,3.2vw,3rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-white [font-variation-settings:'wdth'_112] [text-wrap:balance]"
      >
        {title}
      </h2>
      </div>
      <div className="mt-14 max-md:mt-10">{children}</div>
    </section>
  )
}
