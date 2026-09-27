import { Fragment } from 'react'
import { Credits } from '../direction/Finale'
import { Problem } from './sections/Problem'
import { User } from './sections/User'
import { Decisions } from './sections/Decisions'
import { Screens } from './sections/Screens'
import { System } from './sections/System'
import { Sources } from './sections/Sources'
import { RibbonDivider } from './ui/RibbonDivider'

const CHAPTERS = [Problem, User, Decisions, Screens, System, Sources]
const set = (ext: string) => `./case/chrome-800.${ext} 800w, ./case/chrome-1600.${ext} 1600w`

/** Первый экран кейса: гигантский заголовок (курсив + вордмарк + широкий капс) и кадр хромовой горы. */
function Hero() {
  return (
    <div className="relative isolate flex min-h-[min(100svh,1000px)] items-end overflow-hidden px-[5vw] pb-[10svh] pt-40 max-md:min-h-0 max-md:px-4 max-md:pb-14 max-md:pt-[46svh]">
      {/* статичный кадр сцены главы 01 — без WebGL на странице кейса */}
      <picture>
        <source type="image/avif" srcSet={set('avif')} sizes="(max-width: 767px) 100vw, 62vw" />
        <img
          src="./case/chrome-1600.webp"
          srcSet={set('webp')}
          sizes="(max-width: 767px) 100vw, 62vw"
          width={1600}
          height={1483}
          alt="The skintrack sculpture: the Matterhorn as faceted chrome, a glowing skin track climbing its face."
          fetchPriority="high"
          className="absolute right-0 top-0 -z-10 h-full w-[62vw] object-cover object-[40%_40%] [mask-image:linear-gradient(to_right,transparent,black_28%)] max-md:h-[62svh] max-md:w-full max-md:object-[45%_30%] max-md:[mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        />
      </picture>
      <div className="relative">
        <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">Case study · concept</p>
        <h1 aria-label="How skintrack was designed" className="mt-4 leading-[0.8]">
          <span aria-hidden className="block font-serif text-[clamp(4.5rem,11vw,11.5rem)] italic text-cyan-hot [text-shadow:0_0_60px_rgb(92_232_255/0.5)]">How</span>
          <span aria-hidden className="wordmark block text-[clamp(4.6rem,17vw,17rem)] text-white">skintrack</span>
          <span aria-hidden className="caps-wide mt-[0.35em] block text-[clamp(1.9rem,5vw,5.4rem)] font-extrabold uppercase tracking-[-0.03em] text-white">was designed</span>
        </h1>
        <p className="mt-10 max-w-[46ch] text-[19px] leading-relaxed text-body/85 [text-wrap:pretty] max-md:text-[17px]">
          A concept for an avalanche-aware ski-touring navigator: route, slope angle and danger level on one map.
          <span className="font-serif text-[1.25em] italic text-cyan-hot"> Three decisions shaped it.</span>
        </p>
      </div>
    </div>
  )
}

export default function CaseApp() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-[4.5vw] pt-6 max-md:px-4 max-md:pt-4">
        <a
          href="./"
          className="group flex h-11 items-center gap-3 rounded-full border border-white/15 bg-[rgb(4_8_12/0.55)] pl-2 pr-5 text-[14px] font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:border-cyan"
        >
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-cyan text-ink">
            <span className="icon-[lucide--arrow-left] size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </span>
          Back to <span className="wordmark text-[20px] leading-none">skintrack</span>
        </a>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 max-md:hidden">45°58′35″N · 7°39′31″E · 4 478 m</p>
      </header>
      <main>
        <Hero />
        {CHAPTERS.map((Chapter, i) => (
          <Fragment key={i}>
            <RibbonDivider flip={i % 2 === 1} />
            <Chapter />
          </Fragment>
        ))}
      </main>
      <Credits />
    </>
  )
}
