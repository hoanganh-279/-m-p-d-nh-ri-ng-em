import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'loading' | 'live' | 'error'

function mapCameraError(err: unknown): string {
  const name =
    err && typeof err === 'object' && 'name' in err
      ? String((err as { name: string }).name)
      : ''

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Cần cấp quyền camera để mở photobooth. Hãy cho phép rồi thử lại.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Không tìm thấy camera trên thiết bị này.'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Camera đang được ứng dụng khác dùng. Đóng app đó rồi thử lại.'
  }
  return 'Không mở được camera. Thử lại nhé.'
}

export function useUserCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  const stop = useCallback(() => {
    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    const video = videoRef.current
    if (video) {
      video.srcObject = null
    }
    setStatus((s) => (s === 'error' ? s : 'idle'))
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Trình duyệt không hỗ trợ camera.')
      setStatus('error')
      return
    }

    stop()
    setErrorMessage(undefined)
    setStatus('loading')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play()
      }
      setStatus('live')
    } catch (err) {
      stop()
      setErrorMessage(mapCameraError(err))
      setStatus('error')
    }
  }, [stop])

  useEffect(() => {
    return () => {
      const stream = streamRef.current
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop()
        }
        streamRef.current = null
      }
    }
  }, [])

  return { videoRef, status, errorMessage, start, stop }
}
