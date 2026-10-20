import { useEffect, useState } from 'react'
import { memories } from '../data/memories'
import { PhotoCard } from './PhotoCard'
import { useExperienceStore } from '../store/useExperienceStore'

export function OrbitField() {
  const entered = useExperienceStore((s) => s.entered)
  const [appear, setAppear] = useState(0)

  useEffect(() => {
    if (!entered) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 2200)
      setAppear(1 - Math.pow(1 - t, 3))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [entered])

  if (!entered) return null

  return (
    <group>
      {memories.map((memory, index) => (
        <PhotoCard
          key={memory.id}
          memory={memory}
          index={index}
          total={memories.length}
          appear={appear}
        />
      ))}
    </group>
  )
}
