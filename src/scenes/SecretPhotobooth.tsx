import { useCallback, useEffect, useRef, useState } from 'react'
import { useUserCamera } from '../hooks/useUserCamera'
import { WOMENS_DAY_FRAME, WomensDayFrame } from '../ui/WomensDayFrame'

const EXPORT_W = 1280
const EXPORT_H = 720
const FRAME_SVG_ID = 'secret-wd-frame'

type BoothMode = 'live' | 'preview'

function drawCoverMirrored(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return

  const scale = Math.max(dw / vw, dh / vh)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (vw - sw) / 2
  const sy = (vh - sh) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(dx, dy, dw, dh)
  ctx.clip()
  ctx.translate(dx + dw, dy)
  ctx.scale(-1, 1)
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh)
  ctx.restore()
}

function loadSvgAsImage(svgEl: SVGElement): Promise<HTMLImageElement> {
  const clone = svgEl.cloneNode(true) as SVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(EXPORT_W))
  clone.setAttribute('height', String(EXPORT_H))
  const xml = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(
    new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }),
  )
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('svg'))
    }
    img.src = url
  })
}

export function SecretPhotobooth() {
  const { videoRef, status, errorMessage, start, stop } = useUserCamera()
  const [mode, setMode] = useState<BoothMode>('live')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    void start()
    return () => {
      stop()
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [start, stop])

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  const capture = useCallback(async () => {
    const video = videoRef.current
    if (!video || status !== 'live' || capturing) return

    setCapturing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = EXPORT_W
      canvas.height = EXPORT_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#fff6fa'
      ctx.fillRect(0, 0, EXPORT_W, EXPORT_H)

      const { viewW, viewH, window: win } = WOMENS_DAY_FRAME
      const sx = EXPORT_W / viewW
      const sy = EXPORT_H / viewH
      drawCoverMirrored(
        ctx,
        video,
        win.x * sx,
        win.y * sy,
        win.w * sx,
        win.h * sy,
      )

      const svgEl = document.getElementById(FRAME_SVG_ID)
      if (svgEl instanceof SVGElement) {
        const frameImg = await loadSvgAsImage(svgEl)
        ctx.drawImage(frameImg, 0, 0, EXPORT_W, EXPORT_H)
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      )
      if (!blob) return

      revokePreview()
      const url = URL.createObjectURL(blob)
      previewUrlRef.current = url
      setPreviewUrl(url)
      setMode('preview')
    } catch {
      // keep live on failure
    } finally {
      setCapturing(false)
    }
  }, [videoRef, status, capturing, revokePreview])

  const download = useCallback(() => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = 'bi-mat-8-3.png'
    a.click()
  }, [previewUrl])

  const retake = useCallback(() => {
    revokePreview()
    setMode('live')
    if (status !== 'live') void start()
  }, [revokePreview, status, start])

  return (
    <div className="flex w-full flex-col items-center gap-3 py-1">
      <div
        className="relative w-full overflow-hidden bg-paper"
        style={{
          // 16:9, large but capped so it never overflows the modal
          aspectRatio: '16 / 9',
          maxHeight: 'min(48vh, 420px)',
          width: 'min(100%, calc(min(48vh, 420px) * 16 / 9))',
        }}
      >
        {mode === 'live' ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute scale-x-[-1] object-cover"
              style={{
                left: `${(WOMENS_DAY_FRAME.window.x / WOMENS_DAY_FRAME.viewW) * 100}%`,
                top: `${(WOMENS_DAY_FRAME.window.y / WOMENS_DAY_FRAME.viewH) * 100}%`,
                width: `${(WOMENS_DAY_FRAME.window.w / WOMENS_DAY_FRAME.viewW) * 100}%`,
                height: `${(WOMENS_DAY_FRAME.window.h / WOMENS_DAY_FRAME.viewH) * 100}%`,
              }}
              aria-label="Camera trực tiếp"
            />
            <WomensDayFrame
              id={FRAME_SVG_ID}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </>
        ) : (
          previewUrl && (
            <img
              src={previewUrl}
              alt="Ảnh vừa chụp với khung 8 tháng 3"
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          )
        )}

        {mode === 'live' && status === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ground/70 text-sm text-ink">
            Đang mở camera…
          </div>
        )}

        {mode === 'live' && status === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ground/85 p-4 text-center">
            <p className="text-sm text-ink/90" role="alert">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => void start()}
              className="inline-flex min-h-11 items-center justify-center bg-accent px-5 text-sm font-semibold text-ink hover:opacity-90"
            >
              Thử lại
            </button>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2" style={{ maxWidth: 'min(100%, calc(min(48vh, 420px) * 16 / 9))' }}>
        {mode === 'live' ? (
          <button
            type="button"
            onClick={() => void capture()}
            disabled={status !== 'live' || capturing}
            className="inline-flex min-h-12 w-full items-center justify-center bg-accent px-6 text-base font-semibold text-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {capturing ? 'Đang chụp…' : 'Chụp'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={download}
              className="inline-flex min-h-12 flex-1 items-center justify-center bg-accent px-4 text-base font-semibold text-ink hover:opacity-90"
            >
              Tải về
            </button>
            <button
              type="button"
              onClick={retake}
              className="inline-flex min-h-12 flex-1 items-center justify-center bg-white/10 px-4 text-base font-semibold text-ink hover:bg-white/15"
            >
              Chụp lại
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
