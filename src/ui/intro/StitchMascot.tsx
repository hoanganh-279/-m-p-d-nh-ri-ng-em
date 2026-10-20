import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { HeartParticle } from './HeartParticle'

gsap.registerPlugin(useGSAP)

type StitchMascotProps = {
  reducedMotion?: boolean
}

export function StitchMascot({ reducedMotion = false }: StitchMascotProps) {
  const root = useRef<HTMLDivElement>(null)
  const hearts = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!root.current || reducedMotion) return

      const body = root.current.querySelector('.stitch-figure')

      gsap.to(body, {
        y: -8,
        duration: 2.1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })

      gsap.to(body, {
        rotation: 3.5,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        transformOrigin: '50% 90%',
        delay: 0.15,
      })

      // Soft wave-like sway on the raised-hand side
      gsap.to(body, {
        scaleX: 1.02,
        scaleY: 0.98,
        duration: 1.15,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        transformOrigin: '50% 100%',
      })

      const spawnHeart = () => {
        if (!hearts.current) return
        const el = document.createElement('div')
        el.className = 'stitch-heart-fly'
        el.innerHTML =
          '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="var(--accent)" d="M12 21s-7.2-4.35-9.6-8.4C.6 9.3 1.8 5.7 5.1 4.5c1.95-.7 4.05.15 5.1 1.8 1.05-1.65 3.15-2.5 5.1-1.8 3.3 1.2 4.5 4.8 2.7 8.1C19.2 16.65 12 21 12 21z"/></svg>'
        hearts.current.appendChild(el)

        gsap.fromTo(
          el,
          { opacity: 1, scale: 0.5, x: 0, y: 0 },
          {
            opacity: 0,
            scale: 1.2,
            x: 12 + Math.random() * 28,
            y: -(70 + Math.random() * 55),
            duration: 1.4,
            ease: 'power1.out',
            onComplete: () => el.remove(),
          },
        )
      }

      const heartTimer = window.setInterval(() => {
        spawnHeart()
        if (Math.random() > 0.4) window.setTimeout(spawnHeart, 160)
      }, 2500)

      return () => clearInterval(heartTimer)
    },
    { scope: root, dependencies: [reducedMotion] },
  )

  return (
    <div ref={root} className="intro-mascot intro-mascot-stitch" aria-hidden>
      <div className="stitch-figure relative h-full w-full">
        <img
          src="/mascots/stitch-wave.png"
          alt=""
          draggable={false}
          className="h-full w-full object-contain"
          style={{
            // Avoid milky white plate behind the cutout
            mixBlendMode: 'normal',
            filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.4))',
          }}
        />
        <div
          ref={hearts}
          className="stitch-hearts pointer-events-none absolute left-[68%] top-[28%]"
        />
        {reducedMotion ? (
          <HeartParticle className="absolute right-[12%] top-[20%] opacity-80" />
        ) : null}
      </div>
    </div>
  )
}
