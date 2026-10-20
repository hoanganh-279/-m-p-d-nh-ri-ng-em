import { useEffect, useRef, useState, type ReactNode } from 'react'
import { playlist } from '../data/playlist'
import { useExperienceStore } from '../store/useExperienceStore'

type MusicDockProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Other bottom-bar actions (Tùy chỉnh, Mở lời chúc). */
  children: ReactNode
}

function usePlaylistAudio() {
  const musicOn = useExperienceStore((s) => s.musicOn)
  const toggleMusic = useExperienceStore((s) => s.toggleMusic)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [missing, setMissing] = useState(false)
  const track = playlist[trackIndex]

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'none'
    audio.loop = false
    audio.volume = 0.55
    audioRef.current = audio

    const onEnded = () => {
      setTrackIndex((i) => (i + 1) % playlist.length)
    }
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.pause()
      audio.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = track.src
    setMissing(false)

    if (musicOn) {
      audio
        .play()
        .then(() => setMissing(false))
        .catch(() => {
          setMissing(true)
          useExperienceStore.getState().toggleMusic()
        })
    } else {
      audio.pause()
    }
  }, [track.src, musicOn, trackIndex])

  const playTrack = (index: number) => {
    setTrackIndex(index)
    if (!musicOn) toggleMusic()
  }

  return {
    musicOn,
    toggleMusic,
    track,
    trackIndex,
    missing,
    playTrack,
    prev: () => setTrackIndex((i) => (i - 1 + playlist.length) % playlist.length),
    next: () => setTrackIndex((i) => (i + 1) % playlist.length),
  }
}

/** Playlist sheet + music toggle, wrapping the rest of the bottom bar actions. */
export function MusicPlayer({ open, onOpenChange, children }: MusicDockProps) {
  const audio = usePlaylistAudio()

  return (
    <div className="flex w-full flex-col gap-2">
      {open && (
        <div
          id="music-playlist-sheet"
          className="w-full bg-surface p-3 text-ink md:p-4"
          role="dialog"
          aria-label="Playlist"
          data-ui
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink/70">Đang phát</p>
              <p className="truncate text-sm font-semibold text-ink" title={audio.track.title}>
                {audio.track.title}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 bg-accent px-3 py-2 text-sm font-semibold text-ink"
              onClick={audio.toggleMusic}
            >
              {audio.musicOn ? 'Tạm dừng' : 'Phát'}
            </button>
          </div>

          <ul
            className="max-h-52 space-y-1 overflow-y-auto overscroll-contain"
            style={{ touchAction: 'pan-y' }}
          >
            {playlist.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => audio.playTrack(i)}
                  title={t.title}
                  className={`flex w-full items-center gap-2 px-2.5 py-2.5 text-left text-sm leading-snug ${
                    i === audio.trackIndex
                      ? 'bg-accent/30 font-semibold text-ink'
                      : 'text-ink/85 hover:bg-white/10'
                  }`}
                >
                  <span className="min-w-0 flex-1 break-words">{t.title}</span>
                  {i === audio.trackIndex && audio.musicOn ? (
                    <span className="shrink-0 text-xs text-blush">♪</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          {audio.missing && (
            <p className="mt-2 text-sm leading-snug text-champagne">
              Chưa có file nhạc. Thêm MP3 vào <code className="text-blush">public/audio/</code>
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="flex-1 bg-white/10 py-2.5 text-sm"
              onClick={audio.prev}
            >
              Trước
            </button>
            <button
              type="button"
              className="flex-1 bg-white/10 py-2.5 text-sm"
              onClick={audio.next}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 bg-ground/95 p-2">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-2 text-sm text-ink transition-opacity hover:opacity-90 ${
            open ? 'bg-accent' : 'bg-surface'
          }`}
          aria-expanded={open}
          aria-controls="music-playlist-sheet"
        >
          {open ? 'Đóng nhạc' : 'Nhạc'}
        </button>
        {children}
      </div>
    </div>
  )
}
