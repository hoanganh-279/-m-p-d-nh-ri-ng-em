import { useEffect } from 'react'
import { Intro } from './scenes/Intro'
import { HeartSpace } from './scenes/HeartSpace'
import { MemoryLightbox } from './scenes/MemoryLightbox'
import { SecretLetter } from './scenes/SecretLetter'
import { SecretVault } from './scenes/SecretVault'
import { ControlBar } from './ui/ControlBar'
import { HintOverlay } from './ui/HintOverlay'
import { useExperienceStore } from './store/useExperienceStore'

export default function App() {
  const setReducedMotion = useExperienceStore((s) => s.setReducedMotion)
  const setIsMobile = useExperienceStore((s) => s.setIsMobile)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const narrow = window.matchMedia('(max-width: 768px)')
    const coarse = window.matchMedia('(pointer: coarse)')
    const short = window.matchMedia('(max-height: 500px)')
    const apply = () => {
      setReducedMotion(motion.matches)
      setIsMobile(narrow.matches || (coarse.matches && short.matches))
    }
    apply()
    motion.addEventListener('change', apply)
    narrow.addEventListener('change', apply)
    coarse.addEventListener('change', apply)
    short.addEventListener('change', apply)
    return () => {
      motion.removeEventListener('change', apply)
      narrow.removeEventListener('change', apply)
      coarse.removeEventListener('change', apply)
      short.removeEventListener('change', apply)
    }
  }, [setReducedMotion, setIsMobile])

  return (
    <main className="relative h-full w-full overflow-hidden bg-ground text-ink">
      <HeartSpace />
      <Intro />
      <HintOverlay />
      <ControlBar />
      <MemoryLightbox />
      <SecretLetter />
      <SecretVault />
    </main>
  )
}
