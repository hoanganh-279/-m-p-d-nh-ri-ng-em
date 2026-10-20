import { useEffect, useMemo, useRef, useState } from 'react'
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

  const [paraIndex, setParaIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const open = scene === 'letter'

  const fullText = useMemo(() => letterParagraphs[paraIndex] ?? '', [paraIndex])

  useEffect(() => {
    if (!open) {
      setParaIndex(0)
      setTyped('')
      setLetterDone(false)
      return
    }
  }, [open, setLetterDone])

  useEffect(() => {
    if (!open || !sheetRef.current || reducedMotion) return
    gsap.fromTo(
      sheetRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
    )
  }, [open, reducedMotion])

  useEffect(() => {
    if (!open) return
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
  }, [open, paraIndex, fullText, reducedMotion, setLetterDone])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [typed, paraIndex, letterDone])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLetter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeLetter])

  useEffect(() => {
    if (!letterDone || reducedMotion) return
    gsap.fromTo(
      '.letter-finale',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
    )
  }, [letterDone, reducedMotion])

  if (!open) return null

  const shown = letterParagraphs.slice(0, paraIndex)
  const current = paraIndex < letterParagraphs.length ? typed : ''

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ground/90 p-3 md:p-8"
      onClick={closeLetter}
    >
      <div
        ref={sheetRef}
        className="letter-sheet"
        style={{ backgroundColor: 'var(--paper)', color: 'var(--paper-ink)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="letter-title"
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
      </div>
    </div>
  )
}
