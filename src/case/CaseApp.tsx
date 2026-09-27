import { Wordmark } from '../ui/Wordmark'
import { MonoLabel } from '../ui/MonoLabel'
import { SiteFooter } from '../ui/SiteFooter'
import { Problem } from './sections/Problem'
import { User } from './sections/User'
import { Decisions } from './sections/Decisions'
import { Screens } from './sections/Screens'
import { System } from './sections/System'
import { Sources } from './sections/Sources'

export default function CaseApp() {
  return (
    <>
      <header className="px-4 pt-8 md:px-10">
        <a
          href="./"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-accent"
        >
          <span aria-hidden className="icon-[lucide--arrow-left] size-4" />
          Back to <Wordmark />
        </a>
      </header>
      <main>
        <div className="grid items-end gap-12 px-4 pb-8 pt-24 md:px-10 md:pt-40 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
          <div>
            <MonoLabel>Case study · concept</MonoLabel>
            <h1
              className="mt-4 max-w-5xl text-[clamp(2.75rem,8vw,7.5rem)] font-bold leading-[0.9] tracking-[-0.02em] [text-wrap:balance]"
              style={{ fontStretch: '115%' }}
            >
              How skintrack was designed
            </h1>
            <p className="mt-8 max-w-2xl text-xl text-muted [text-wrap:pretty]">
              A concept for an avalanche-aware ski-touring navigator: route, slope angle and danger level on one map.
              Three decisions shaped it.
            </p>
          </div>
          <img
            src="./terrain/poster.webp"
            width={1600}
            height={1000}
            alt="The skintrack terrain scene: the Matterhorn drawn in contour lines, the ascent route highlighted."
            fetchPriority="high"
            className="hidden aspect-[4/3] w-full rounded-[40px] object-cover ring-1 ring-line lg:block"
          />
        </div>
        <Problem />
        <User />
        <Decisions />
        <Screens />
        <System />
        <Sources />
      </main>
      <SiteFooter />
    </>
  )
}
