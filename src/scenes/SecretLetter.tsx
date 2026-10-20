import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import gsap from 'gsap'
import {
  letterFinale,
  letterParagraphs,
  letterTitle,
  recipientName,
} from '../data/letter'
import { useExperienceStore } from '../store/useExperienceStore'

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-rose">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function SecretLetter() {
  const scene = useExperienceStore((s) => s.scene)
  const closeLetter = useExperienceStore((s) => s.closeLetter)
  const setLetterDone = useExperienceStore((s) => s.setLetterDone)
  const letterDone = useExperienceStore((s) => s.letterDone)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)

  const [envelopeOpen, setEnvelopeOpen] = useState(false)
  const [opening, setOpening] = useState(false)
  const [paraIndex, setParaIndex] = useState(0)
  const [typed, setTyped] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const flapRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  const open = scene === 'letter'
  const reading = envelopeOpen

  const fullText = useMemo(() => letterParagraphs[paraIndex] ?? '', [paraIndex])

  useEffect(() => {
    if (!open) {
      timelineRef.current?.kill()
      timelineRef.current = null
      setEnvelopeOpen(false)
      setOpening(false)
      setParaIndex(0)
      setTyped('')
      setLetterDone(false)
      return
    }
  }, [open, setLetterDone])

  const finishOpen = useCallback(() => {
    setOpening(false)
    setEnvelopeOpen(true)
    if (sheetRef.current) {
      gsap.set(sheetRef.current, { clearProps: 'opacity,y,visibility' })
    }
  }, [])

  const openEnvelope = useCallback(() => {
    if (!open || envelopeOpen || opening) return

    if (reducedMotion) {
      finishOpen()
      return
    }

    const flap = flapRef.current
    const seal = sealRef.current
    const sheet = sheetRef.current
    if (!flap || !sheet) {
      finishOpen()
      return
    }

    setOpening(true)
    timelineRef.current?.kill()

    gsap.set(sheet, { opacity: 0, y: 56, visibility: 'visible' })

    const tl = gsap.timeline({
      onComplete: finishOpen,
    })
    timelineRef.current = tl

    if (seal) {
      tl.to(seal, { opacity: 0, scale: 0.7, duration: 0.22, ease: 'power2.in' }, 0)
    }

    tl.to(
      flap,
      {
        rotateX: 175,
        duration: 0.7,
        ease: 'power2.inOut',
        transformOrigin: 'top center',
      },
      seal ? 0.08 : 0,
    )

    tl.to(
      sheet,
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
      },
      '-=0.28',
    )
  }, [open, envelopeOpen, opening, reducedMotion, finishOpen])

  useEffect(() => {
    if (!open || !reading) return
    if (paraIndex >= letterParagraphs.length) {
      setLetterDone(true)
      return
    }

    if (reducedMotion) {
      setTyped(fullText)
      const t = window.setTimeout(() => setParaIndex((p) => p + 1), 80)
      return () => window.clearTimeout(t)
    }

    setTyped('')
    let i = 0
    const speed = fullText.length > 180 ? 12 : 18
    const id = window.setInterval(() => {
      i += 1
      setTyped(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(id)
        window.setTimeout(() => setParaIndex((p) => p + 1), 280)
      }
    }, speed)
    return () => clearInterval(id)
  }, [open, reading, paraIndex, fullText, reducedMotion, setLetterDone])

  useEffect(() => {
    if (!reading) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [typed, paraIndex, letterDone, reading])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLetter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeLetter])

  useEffect(() => {
    if (!letterDone || reducedMotion || !reading) return
    gsap.fromTo(
      '.letter-finale',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
    )
  }, [letterDone, reducedMotion, reading])

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
    }
  }, [])

  if (!open) return null

  const shown = letterParagraphs.slice(0, paraIndex)
  const current = paraIndex < letterParagraphs.length ? typed : ''

  const onEnvelopeKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openEnvelope()
    }
  }

  const stageClass = [
    'envelope-stage',
    opening ? 'is-opening' : '',
    reading ? 'is-reading' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ground/90 p-3 md:p-8"
      onClick={closeLetter}
    >
      <div className={stageClass} onClick={(e) => e.stopPropagation()}>
        {!reading && (
          <div
            className={`envelope${opening ? ' is-opening' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Thư gửi ${recipientName}. Nhấn để mở thư`}
            onClick={openEnvelope}
            onKeyDown={onEnvelopeKeyDown}
          >
            <div className="envelope-body" aria-hidden>
              <div className="envelope-pocket" />
            </div>
            <div ref={flapRef} className="envelope-flap" aria-hidden />
            <div ref={sealRef} className="envelope-seal" aria-hidden>
              <svg viewBox="0 0 32 29">
                <path d="M23.6 0c-3.4 0-6.3 2.1-7.6 5.1C14.7 2.1 11.8 0 8.4 0 3.8 0 0 3.8 0 8.4c0 9.3 16 20.1 16 20.1S32 17.7 32 8.4C32 3.8 28.2 0 23.6 0z" />
              </svg>
            </div>
            <div className="envelope-label">
              <strong>{recipientName}</strong>
              <span>Nhấn để mở thư</span>
            </div>
          </div>
        )}

        <div
          className="letter-rise"
          style={{
            visibility: reading || opening ? 'visible' : 'hidden',
            pointerEvents: reading ? 'auto' : 'none',
          }}
        >
          <div
            ref={sheetRef}
            className="letter-sheet"
            style={{
              backgroundColor: 'var(--paper)',
              color: 'var(--paper-ink)',
            }}
            role="dialog"
            aria-labelledby="letter-title"
            aria-hidden={!reading}
          >
            <div className="letter-fold" aria-hidden />

            <div className="px-5 pb-4 pt-5 md:px-8 md:pt-7" style={{ backgroundColor: 'var(--paper)' }}>
              <p className="text-sm" style={{ color: 'rgba(26, 18, 24, 0.7)' }}>
                Lời chúc bí mật · {recipientName}
              </p>
              <h2
                id="letter-title"
                className="font-display mt-2 text-2xl leading-snug md:text-3xl"
                style={{ color: 'var(--paper-ink)' }}
              >
                {letterTitle}
              </h2>
            </div>

            <div
              ref={scrollRef}
              className="space-y-4 overflow-y-auto px-5 py-2 font-body text-base leading-relaxed md:px-8"
              style={{
                touchAction: 'pan-y',
                maxHeight: '58vh',
                backgroundColor: 'var(--paper)',
                color: 'var(--paper-ink)',
              }}
            >
              {shown.map((p, i) => (
                <p key={i}>{renderInline(p)}</p>
              ))}
              {current && (
                <p>
                  {renderInline(current)}
                  <span className="text-rose">|</span>
                </p>
              )}

              {letterDone && (
                <div className="letter-finale pb-2 pt-6 text-center">
                  <svg
                    viewBox="0 0 32 29"
                    className="mx-auto mb-4 h-16 w-16 fill-[#F26B9B]"
                    aria-hidden
                  >
                    <path d="M23.6 0c-3.4 0-6.3 2.1-7.6 5.1C14.7 2.1 11.8 0 8.4 0 3.8 0 0 3.8 0 8.4c0 9.3 16 20.1 16 20.1S32 17.7 32 8.4C32 3.8 28.2 0 23.6 0z" />
                  </svg>
                  <p className="font-display text-2xl text-rose md:text-3xl">{letterFinale}</p>
                </div>
              )}
            </div>

            {reading && (
              <div className="letter-sheet-footer">
                <button
                  type="button"
                  className="min-h-11 text-sm transition-opacity hover:opacity-100"
                  style={{ color: 'rgba(26, 18, 24, 0.7)' }}
                  onClick={() => {
                    setParaIndex(letterParagraphs.length)
                    setLetterDone(true)
                  }}
                >
                  Hiện toàn bộ
                </button>
                <button
                  type="button"
                  className="min-h-11 px-5 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent)' }}
                  onClick={closeLetter}
                >
                  Đóng thư
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
