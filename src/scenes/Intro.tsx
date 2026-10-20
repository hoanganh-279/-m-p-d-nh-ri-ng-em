import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { startRandomMusic } from '../audio/playlistController'
import { memories } from '../data/memories'
import { recipientName } from '../data/letter'
import { useExperienceStore } from '../store/useExperienceStore'
import { StitchMascot } from '../ui/intro/StitchMascot'
import { TwinkleMascot } from '../ui/intro/TwinkleMascot'

gsap.registerPlugin(useGSAP)

const hero = memories[0]

export function Intro() {
  const root = useRef<HTMLDivElement>(null)
  const entered = useExperienceStore((s) => s.entered)
  const enterExperience = useExperienceStore((s) => s.enterExperience)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)

  useGSAP(
    () => {
      if (entered || !root.current || reducedMotion) return

      const lines = root.current.querySelectorAll('.intro-mask-line')
      lines.forEach((line, i) => {
        gsap.fromTo(
          line,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: 'power3.out', delay: 0.05 + i * 0.11 },
        )
      })
      gsap.fromTo(
        '.intro-support, .intro-cta',
        { y: 12 },
        { y: 0, duration: 0.65, ease: 'power2.out', delay: 0.5, stagger: 0.08 },
      )
      gsap.to('.intro-cta', {
        y: '-=2',
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 1.4,
      })
    },
    { scope: root, dependencies: [entered, reducedMotion] },
  )

  const onExplore = () => {
    // Start inside the click gesture so the browser allows autoplay.
    startRandomMusic()

    if (!root.current || reducedMotion) {
      enterExperience()
      return
    }
    gsap.to(root.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => enterExperience(),
    })
  }

  if (entered) return null

  return (
    <div ref={root} className="absolute inset-0 z-40 overflow-hidden bg-ground">
      <img
        src={hero.src}
        alt={hero.caption}
        width={1600}
        height={2000}
        className="intro-kenburns absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[48%] md:h-[42%]"
        style={{ background: 'rgba(3,2,10,0.82)' }}
        aria-hidden
      />

      <div className="intro-mascots pointer-events-none absolute inset-0 z-[7]" aria-hidden>
        <TwinkleMascot reducedMotion={reducedMotion} />
        <StitchMascot reducedMotion={reducedMotion} />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:px-8 md:pb-10">
        <h1 className="font-display max-w-[14ch] text-[clamp(3.25rem,14vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.03em] text-ink">
          <span className="block overflow-hidden">
            <span className="intro-mask-line block">{recipientName}</span>
          </span>
          <span className="mt-2 block overflow-hidden text-[0.42em] font-semibold text-ink/90">
            <span className="intro-mask-line block">Trái tim kỷ niệm</span>
          </span>
        </h1>

        <p className="intro-support mt-4 max-w-sm text-base text-ink/85 md:mt-5 md:max-w-md md:text-[17px]">
          Ngày 20 tháng 10 — quà nhỏ dành cho {recipientName}
        </p>

        <button
          type="button"
          onClick={onExplore}
          className="intro-cta relative z-20 mt-6 inline-flex h-12 min-h-[48px] items-center px-8 text-base font-semibold text-ink transition-opacity hover:opacity-90 active:opacity-80 md:mt-7"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Chạm để khám phá
        </button>
      </div>
    </div>
  )
}
