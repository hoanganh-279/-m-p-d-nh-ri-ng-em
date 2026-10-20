import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { memories } from '../data/memories'
import { useExperienceStore } from '../store/useExperienceStore'

export function MemoryLightbox() {
  const scene = useExperienceStore((s) => s.scene)
  const selectedPhotoId = useExperienceStore((s) => s.selectedPhotoId)
  const closeLightbox = useExperienceStore((s) => s.closeLightbox)
  const selectNextPhoto = useExperienceStore((s) => s.selectNextPhoto)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const root = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const [visible, setVisible] = useState(false)

  const memory = memories.find((m) => m.id === selectedPhotoId)
  const open = scene === 'lightbox' && !!memory

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    setVisible(true)
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.lb-panel',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
      )
    }, root)
    return () => ctx.revert()
  }, [open, selectedPhotoId, reducedMotion])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') selectNextPhoto(1)
      if (e.key === 'ArrowLeft') selectNextPhoto(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeLightbox, selectNextPhoto])

  if (!visible || !memory) return null

  return (
    <div
      ref={root}
      className="absolute inset-0 z-50 flex items-center justify-center bg-ground/85 p-4 md:p-8"
      onClick={closeLightbox}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) selectNextPhoto(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div
        className="lb-panel relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={memory.caption}
      >
        <div className="bg-paper p-3 pb-8 text-paper-ink md:p-4 md:pb-10">
          <img
            src={memory.src}
            alt={memory.caption}
            width={1200}
            height={1500}
            className="max-h-[70vh] w-full object-contain"
            draggable={false}
          />
          <div className="mt-4 px-1">
            <p className="font-display text-xl md:text-2xl">{memory.caption}</p>
            {memory.date && (
              <p className="mt-1 font-body text-sm text-paper-ink/60">{memory.date}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="min-h-11 bg-surface px-4 py-2 text-ink transition-opacity hover:opacity-90"
            onClick={() => selectNextPhoto(-1)}
          >
            Trước
          </button>
          <button
            type="button"
            className="min-h-11 bg-surface px-4 py-2 text-ink transition-opacity hover:opacity-90"
            onClick={closeLightbox}
          >
            Đóng
          </button>
          <button
            type="button"
            className="min-h-11 bg-surface px-4 py-2 text-ink transition-opacity hover:opacity-90"
            onClick={() => selectNextPhoto(1)}
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  )
}
