import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SECRET_PIN, secretItems, type SecretItem } from '../data/secrets'
import { useExperienceStore } from '../store/useExperienceStore'

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
  const [active, setActive] = useState<SecretItem | null>(null)

  // Mỗi lần đóng / thoát → khóa lại, lần sau phải nhập PIN
  useEffect(() => {
    if (!open) {
      setUnlocked(false)
      setPin('')
      setError(false)
      setActive(null)
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
      if (e.key === 'Escape') {
        if (active) setActive(null)
        else closeSecret()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, active, closeSecret])

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
        className="secret-panel relative flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden bg-surface text-ink"
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-5" style={{ touchAction: 'pan-y' }}>
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
            <SecretGallery items={secretItems} onOpen={setActive} />
          )}
        </div>
      </div>

      {active && (
        <SecretViewer item={active} onClose={() => setActive(null)} />
      )}
    </div>
  )
}

function SecretGallery({
  items,
  onOpen,
}: {
  items: SecretItem[]
  onOpen: (item: SecretItem) => void
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-4 text-sm text-ink/75">
        <p className="text-base text-ink">Hộp quà đang chờ được lấp đầy.</p>
        <p>
          Thêm ảnh (webp/jpg/png) hoặc video (mp4) vào thư mục{' '}
          <code className="text-blush">public/secrets/</code>, rồi khai báo trong{' '}
          <code className="text-blush">src/data/secrets.ts</code>.
        </p>
        <pre className="overflow-x-auto bg-ground p-3 text-xs leading-relaxed text-ink/80">
{`{
  id: '1',
  type: 'image',
  src: '/secrets/ten-file.webp',
  title: 'Quà nhỏ',
  caption: 'Ghi chú…'
}`}
        </pre>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onOpen(item)}
            className="group relative aspect-square w-full overflow-hidden bg-ground text-left"
          >
            {item.type === 'video' ? (
              <>
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt=""
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-ground text-ink/50">
                    Video
                  </div>
                )}
                <span className="absolute bottom-2 right-2 bg-accent px-2 py-0.5 text-xs font-semibold">
                  ▶
                </span>
              </>
            ) : (
              <img
                src={item.src}
                alt={item.title}
                className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                loading="lazy"
              />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-ground/75 px-2 py-1.5 text-xs font-medium text-ink">
              {item.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function SecretViewer({ item, onClose }: { item: SecretItem; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-ground/92 p-4"
      onClick={onClose}
      role="dialog"
      aria-label={item.title}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 min-h-11 bg-white/10 px-4 text-sm md:right-0"
        >
          Đóng
        </button>
        {item.type === 'video' ? (
          <video
            src={item.src}
            poster={item.poster}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] w-full bg-ground"
          />
        ) : (
          <img
            src={item.src}
            alt={item.title}
            className="max-h-[80vh] w-full object-contain"
          />
        )}
        {(item.title || item.caption) && (
          <div className="mt-3 text-center">
            <p className="font-semibold text-ink">{item.title}</p>
            {item.caption ? (
              <p className="mt-1 text-sm text-ink/70">{item.caption}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
