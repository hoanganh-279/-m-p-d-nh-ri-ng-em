import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SECRET_PIN } from '../data/secrets'
import { useExperienceStore } from '../store/useExperienceStore'
import { SecretPhotobooth } from './SecretPhotobooth'

export function SecretVault() {
  const scene = useExperienceStore((s) => s.scene)
  const closeSecret = useExperienceStore((s) => s.closeSecret)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)

  const open = scene === 'secret'
  const root = useRef<HTMLDivElement>(null)
  const pinBox = useRef<HTMLDivElement>(null)

  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  // Mỗi lần đóng / thoát → khóa lại, lần sau phải nhập PIN
  useEffect(() => {
    if (!open) {
      setUnlocked(false)
      setPin('')
      setError(false)
    }
  }, [open])

  useEffect(() => {
    if (!open || !root.current || reducedMotion) return
    gsap.fromTo(
      root.current.querySelector('.secret-panel'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
    )
  }, [open, unlocked, reducedMotion])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSecret()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeSecret])

  const submitPin = () => {
    if (pin === SECRET_PIN) {
      setUnlocked(true)
      setError(false)
      setPin('')
      return
    }
    setError(true)
    if (pinBox.current && !reducedMotion) {
      gsap.fromTo(
        pinBox.current,
        { x: 0 },
        {
          keyframes: [
            { x: -8, duration: 0.06 },
            { x: 8, duration: 0.06 },
            { x: -6, duration: 0.06 },
            { x: 6, duration: 0.06 },
            { x: 0, duration: 0.06 },
          ],
          ease: 'none',
        },
      )
    }
  }

  if (!open) return null

  return (
    <div
      ref={root}
      className="absolute inset-0 z-50 flex items-end justify-center bg-ground/88 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:items-center md:p-8"
      onClick={closeSecret}
    >
      <div
        className="secret-panel relative flex max-h-[min(90vh,760px)] w-full max-w-3xl flex-col overflow-hidden bg-surface text-ink"
        data-ui
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="Bí mật"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Bí mật
            </h2>
            <p className="text-sm text-ink/65">
              {unlocked ? 'Quà dành riêng cho em' : 'Nhập mã để mở hộp quà'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeSecret}
            className="inline-flex min-h-11 min-w-11 items-center justify-center bg-white/10 px-3 text-sm hover:bg-white/15"
          >
            Đóng
          </button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-5"
          style={{ touchAction: 'pan-y' }}
        >
          {!unlocked ? (
            <div ref={pinBox} className="mx-auto flex max-w-xs flex-col items-center gap-4 py-6">
              <p className="text-center text-sm text-ink/75">
                Gợi ý: một ngày đặc biệt của chúng ta
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={12}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''))
                  setError(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitPin()
                }}
                placeholder="••••••••"
                className="w-full bg-ground px-4 py-3 text-center text-2xl tracking-[0.35em] text-ink outline-none ring-1 ring-white/15 focus:ring-accent"
                aria-label="Mã PIN"
                autoFocus
              />
              {error && (
                <p className="text-sm text-rose" role="alert">
                  Thử lại nhé…
                </p>
              )}
              <button
                type="button"
                onClick={submitPin}
                className="inline-flex min-h-12 w-full items-center justify-center bg-accent px-6 text-base font-semibold text-ink hover:opacity-90"
              >
                Mở khóa
              </button>
            </div>
          ) : (
            <SecretPhotobooth />
          )}
        </div>
      </div>
    </div>
  )
}
