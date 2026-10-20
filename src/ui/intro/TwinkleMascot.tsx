import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

const COSTUMES = [
  { id: 'fortune', src: '/mascots/twinkle-fortune.png' },
  { id: 'boat', src: '/mascots/twinkle-boat.png' },
  { id: 'wizard', src: '/mascots/twinkle-wizard.png' },
  { id: 'apple', src: '/mascots/twinkle-apple.png' },
  { id: 'hearts', src: '/mascots/twinkle-hearts.png' },
  { id: 'chef', src: '/mascots/twinkle-chef.png' },
] as const

const CYCLE_MS = 3500
const CROSSFADE = 0.45

type TwinkleMascotProps = {
  reducedMotion?: boolean
}

export function TwinkleMascot({ reducedMotion = false }: TwinkleMascotProps) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!root.current || reducedMotion) return

      const body = root.current.querySelector('.twinkle-figure')
      const frames = Array.from(
        root.current.querySelectorAll<HTMLElement>('.twinkle-frame'),
      )

      frames.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0 }))

      gsap.to(body, {
        y: -8,
        duration: 1.9,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })

      gsap.to(body, {
        rotation: 4.5,
        duration: 2.7,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        transformOrigin: '50% 90%',
        delay: 0.3,
      })

      gsap.to(body, {
        scale: 1.03,
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.5,
      })

      let index = 0
      const cycleTimer = window.setInterval(() => {
        const next = (index + 1) % frames.length
        gsap.to(frames[index], { opacity: 0, duration: CROSSFADE, ease: 'power1.inOut' })
        gsap.to(frames[next], { opacity: 1, duration: CROSSFADE, ease: 'power1.inOut' })
        index = next
      }, CYCLE_MS)

      return () => clearInterval(cycleTimer)
    },
    { scope: root, dependencies: [reducedMotion] },
  )

  const staticId = 'hearts'

  return (
    <div ref={root} className="intro-mascot intro-mascot-twinkle" aria-hidden>
      <div className="twinkle-figure relative h-full w-full">
        {COSTUMES.map((c, i) => {
          const show =
            reducedMotion ? c.id === staticId : i === 0
          return (
            <img
              key={c.id}
              src={c.src}
              alt=""
              draggable={false}
              className="twinkle-frame absolute inset-0 h-full w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
              style={{ opacity: show ? 1 : 0 }}
            />
          )
        })}
      </div>
    </div>
  )
}
