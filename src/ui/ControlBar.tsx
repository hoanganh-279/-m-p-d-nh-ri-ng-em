import { useState } from 'react'
import { useExperienceStore } from '../store/useExperienceStore'
import { MusicPlayer } from './MusicPlayer'

const btnSecondary =
  'inline-flex min-h-11 items-center justify-center bg-surface px-3 py-2 text-sm text-ink transition-opacity hover:opacity-90'

export function ControlBar() {
  const entered = useExperienceStore((s) => s.entered)
  const scene = useExperienceStore((s) => s.scene)
  const isFreeMode = useExperienceStore((s) => s.isFreeMode)
  const setFreeMode = useExperienceStore((s) => s.setFreeMode)
  const orbitSpeed = useExperienceStore((s) => s.orbitSpeed)
  const setOrbitSpeed = useExperienceStore((s) => s.setOrbitSpeed)
  const orbitRadius = useExperienceStore((s) => s.orbitRadius)
  const setOrbitRadius = useExperienceStore((s) => s.setOrbitRadius)
  const zoom = useExperienceStore((s) => s.zoom)
  const setZoom = useExperienceStore((s) => s.setZoom)
  const zoomBy = useExperienceStore((s) => s.zoomBy)
  const fxOn = useExperienceStore((s) => s.fxOn)
  const toggleFx = useExperienceStore((s) => s.toggleFx)
  const openLetter = useExperienceStore((s) => s.openLetter)
  const openSecret = useExperienceStore((s) => s.openSecret)
  const resetHeart = useExperienceStore((s) => s.resetHeart)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [musicOpen, setMusicOpen] = useState(false)

  if (!entered || scene === 'intro' || scene === 'secret') return null

  const zoomSliderValue = 20.5 - zoom

  const openMusic = (open: boolean) => {
    setMusicOpen(open)
    if (open) setCustomizeOpen(false)
  }

  const openCustomize = (open: boolean) => {
    setCustomizeOpen(open)
    if (open) setMusicOpen(false)
  }

  const goSecret = () => {
    setMusicOpen(false)
    setCustomizeOpen(false)
    openSecret()
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5">
      <div className="pointer-events-auto mx-auto flex w-full max-w-lg flex-col gap-2">
        {customizeOpen && (
          <div className="bg-surface p-3 text-ink md:p-4" data-ui>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => zoomBy(-0.8)}
                className={btnSecondary}
                aria-label="Phóng to"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => zoomBy(0.8)}
                className={btnSecondary}
                aria-label="Thu nhỏ"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setFreeMode(!isFreeMode)}
                className={`${btnSecondary} ${isFreeMode ? 'bg-accent text-ink' : ''}`}
              >
                {isFreeMode ? 'Tự do: Bật' : 'Tự do'}
              </button>
              <button type="button" onClick={toggleFx} className={btnSecondary}>
                {fxOn ? 'Hạt sáng' : 'FX tắt'}
              </button>
              <button type="button" onClick={resetHeart} className={btnSecondary}>
                Reset tim
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm text-ink/80">
              <label className="flex w-full flex-col gap-1">
                <span>Tốc độ</span>
                <input
                  type="range"
                  min={0}
                  max={1.2}
                  step={0.02}
                  value={orbitSpeed}
                  disabled={isFreeMode}
                  onChange={(e) => setOrbitSpeed(Number(e.target.value))}
                  className="h-8 w-full accent-rose disabled:opacity-40"
                />
              </label>
              <label className="flex w-full flex-col gap-1">
                <span>Khoảng cách ảnh</span>
                <input
                  type="range"
                  min={0.55}
                  max={1.8}
                  step={0.02}
                  value={orbitRadius}
                  onChange={(e) => setOrbitRadius(Number(e.target.value))}
                  className="h-8 w-full accent-rose"
                />
              </label>
              <label className="flex w-full flex-col gap-1">
                <span>Thu phóng giao diện</span>
                <input
                  type="range"
                  min={4.5}
                  max={16}
                  step={0.1}
                  value={zoomSliderValue}
                  onChange={(e) => setZoom(20.5 - Number(e.target.value))}
                  className="h-8 w-full accent-rose"
                  aria-label="Thu phóng giao diện"
                />
              </label>
            </div>
          </div>
        )}

        <MusicPlayer open={musicOpen} onOpenChange={openMusic}>
          <button
            type="button"
            onClick={() => openCustomize(!customizeOpen)}
            className={btnSecondary}
            aria-expanded={customizeOpen}
          >
            {customizeOpen ? 'Đóng tùy chỉnh' : 'Tùy chỉnh'}
          </button>
          <button
            type="button"
            onClick={goSecret}
            className={`${btnSecondary} ring-1 ring-accent/70`}
          >
            Bí mật
          </button>
          <button
            type="button"
            onClick={openLetter}
            className="inline-flex min-h-11 items-center justify-center bg-accent px-5 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Mở lời chúc
          </button>
        </MusicPlayer>
      </div>
    </div>
  )
}
