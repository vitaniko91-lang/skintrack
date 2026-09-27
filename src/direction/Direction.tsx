import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { prefersReducedMotion } from '../lib/env'
import { HeroPhoto } from './HeroPhoto'
import { Wordmark } from './Wordmark'
import { SwipeCard } from './SwipeCard'
import { ChapterLabel } from './ChapterLabel'
import { stage } from './stage'
import { TrackStroke } from './TrackStroke'

gsap.registerPlugin(ScrollTrigger)
const SculptCanvas = lazy(() => import('./scene/SculptCanvas'))

function Nav({ logoRef }: { logoRef?: React.Ref<HTMLSpanElement> }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-[4.5vw] pt-6 max-md:px-4 max-md:pt-4">
      <span ref={logoRef} data-logo className="wordmark text-[28px] text-white opacity-0">skintrack</span>
      <div className="flex items-center gap-8">
        <p data-meta className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/85 max-md:hidden">
          45°58′35″N · 7°39′31″E · 4 478 m
        </p>
        <a
          data-meta
          href="#chapter-01"
          className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-ink transition-colors duration-200 hover:bg-cyan-hot"
        >
          Get the beta <span className="icon-[lucide--arrow-right] size-4" />
        </a>
      </div>
    </header>
  )
}

function Copy() {
  return (
    <p data-meta className="absolute bottom-[calc(21.9vw*0.82+28px)] right-[4.5vw] z-30 max-w-[30ch] text-right text-[19px] font-medium leading-snug text-white [text-shadow:0_1px_24px_rgb(2_16_22/0.6)] max-md:bottom-auto max-md:left-4 max-md:right-4 max-md:top-[13svh] max-md:text-left max-md:text-[17px]">
      Avalanche-aware ski touring.<br />
      <span className="font-serif text-[1.3em] italic text-cyan-hot">Read the slope</span> before it reads you.
    </p>
  )
}

function NextChapter() {
  return (
    <section className="relative flex h-svh items-center bg-ground px-[5vw]">
      <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-muted">
        02 · <span className="font-serif text-2xl normal-case italic tracking-normal text-cyan">Plan</span> the ascent — next chapter (outside this prototype)
      </p>
    </section>
  )
}

/** Прототип направления: первый экран + закреплённый переход «фото → скульптура + лента». */
export default function Direction() {
  const reduced = useMemo(() => prefersReducedMotion(), [])
  return reduced ? <Static /> : <Motion />
}

function Static() {
  useEffect(() => { stage.p = 1 }, [])
  return (
    <main>
      <section className="relative h-svh min-h-[640px] overflow-hidden bg-ground">
        <HeroPhoto />
        <Nav />
        <Copy />
        <Wordmark />
        <SwipeCard onStart={() => document.getElementById('chapter-01')?.scrollIntoView()} />
      </section>
      <section className="relative h-svh min-h-[640px] overflow-hidden bg-ground">
        <div className="absolute inset-0" aria-hidden>
          <Suspense fallback={null}><SculptCanvas reduced /></Suspense>
        </div>
        <ChapterLabel />
      </section>
      <NextChapter />
    </main>
  )
}

function Motion() {
  const track = useRef<HTMLDivElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLHeadingElement>(null)
  const logo = useRef<HTMLSpanElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const chapter = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)

  useEffect(() => {
    const l = new Lenis({ lerp: 0.085 })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const raf = (t: number) => l.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const onMove = (e: PointerEvent) => {
      stage.px = (e.clientX / innerWidth) * 2 - 1
      stage.py = (e.clientY / innerHeight) * 2 - 1
    }
    addEventListener('pointermove', onMove)

    const narrow = innerWidth < 768
    const ctx = gsap.context(() => {
      const letters = word.current!.querySelectorAll('[data-letter]')
      const metas = document.querySelectorAll('[data-meta]')
      const img = photo.current!.querySelector('[data-photo-img]')

      // ── Вход: удержание → сборка вордмарка → карточка въезжает ──
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
      intro
        .fromTo(photo.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
        .fromTo(img, { scale: 1.14 }, { scale: 1.04, duration: 2.6, ease: 'expo.out' }, 0)
        .fromTo(letters, { yPercent: 118, rotate: 9, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.1, stagger: 0.055 }, 0.85)
        .fromTo(metas, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 1.35)
        .fromTo(card.current, { xPercent: 70, x: 60, rotate: 7, opacity: 0 }, { xPercent: 0, x: 0, rotate: 0, opacity: 1, duration: 1.0 }, 1.55)

      // ── Переход по скроллу (scrub): прогресс timeline = stage.p для 3D ──
      const dock = () => {
        const w = word.current!.getBoundingClientRect(), g = logo.current!.getBoundingClientRect()
        return { x: g.left - w.left, y: g.top - w.top - g.height * 0.05, s: g.width / w.width }
      }
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track.current, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true,
        },
        onUpdate() {
          stage.p = tl.progress()
          const on = stage.p > 0.002
          if (on !== activeRef.current) { activeRef.current = on; setActive(on) }
        },
      })
      tl.to({}, { duration: 1 }, 0)
        .to(photo.current, {
          clipPath: narrow ? 'inset(34% 8% 28% 8% round 28px)' : 'inset(20% 58% 7% 5% round 40px)',
          y: narrow ? 0 : -120,
          duration: 0.3, ease: 'power2.inOut',
        }, 0)
        .to(img, { scale: 1.0, duration: 0.3 }, 0)
        .to(photo.current, { yPercent: -95, autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0.34)
        .to(word.current, { x: () => dock().x, y: () => dock().y, scale: () => dock().s, duration: 0.26, ease: 'power3.inOut' }, 0.02)
        .to(word.current, { autoAlpha: 0, duration: 0.02 }, 0.28)
        .to(logo.current, { opacity: 1, duration: 0.02 }, 0.28)
        .to('[data-meta]:not(header [data-meta])', { opacity: 0, y: -20, duration: 0.1 }, 0)
        .to(card.current, { x: () => innerWidth * 0.5, rotate: 10, autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0.02)
        .fromTo(chapter.current!.querySelector('[data-ch="num"]'), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power3.out' }, 0.5)
        .fromTo(chapter.current!.querySelector('[data-ch="kicker"]'), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.54)
        .fromTo(chapter.current!.querySelector('[data-ch="read"]'), { opacity: 0, x: -50, filter: 'blur(14px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.14, ease: 'power3.out' }, 0.55)
      // стаггер внутри scrub-таймлайна задаёт начальное состояние только первой цели —
      // поэтому по твину на букву
      chapter.current!.querySelectorAll('[data-ch="caps"]').forEach((el, i) => {
        tl.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.1, ease: 'power3.out' }, 0.6 + i * 0.008)
      })
      chapter.current!.querySelectorAll('[data-ch="body"], [data-ch="stats"]').forEach((el, i) => {
        tl.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.72 + i * 0.04)
      })
    })

    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      removeEventListener('pointermove', onMove)
      l.destroy()
    }
  }, [])

  const start = () => lenis.current?.scrollTo(track.current!.offsetTop + (track.current!.offsetHeight - innerHeight) * 0.8, { duration: 2.4 })

  return (
    <main>
      <div ref={track} className="relative h-[480vh]">
        <div className="sticky top-0 h-svh overflow-hidden bg-ground">
          <div className="absolute inset-0" aria-hidden>
            <Suspense fallback={null}><SculptCanvas reduced={false} active={active} /></Suspense>
          </div>
          <ChapterLabel ref={chapter} />
          <HeroPhoto ref={photo} className="z-20 [clip-path:inset(0%_0%_0%_0%_round_0px)]" />
          <TrackStroke imgSelector="[data-photo-img]" />
          <Nav logoRef={logo} />
          <Copy />
          <Wordmark ref={word} />
          <SwipeCard ref={card} onStart={start} />
        </div>
      </div>
      <NextChapter />
    </main>
  )
}
