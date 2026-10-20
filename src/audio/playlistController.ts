import { playlist } from '../data/playlist'
import { useExperienceStore } from '../store/useExperienceStore'

let sharedAudio: HTMLAudioElement | null = null
let endedBound = false
let trackIndex = 0
let loadedSrc = ''
const trackListeners = new Set<(index: number) => void>()

function getAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'auto'
    sharedAudio.loop = false
    sharedAudio.volume = 0.55
  }
  if (!endedBound) {
    endedBound = true
    sharedAudio.addEventListener('ended', () => {
      applyTrackIndex((trackIndex + 1) % playlist.length)
      if (!useExperienceStore.getState().musicOn) return
      void playLoaded().catch(() => {
        useExperienceStore.setState({ musicOn: false })
      })
    })
  }
  return sharedAudio
}

function notifyTrack() {
  for (const listener of trackListeners) listener(trackIndex)
}

function applyTrackIndex(index: number) {
  trackIndex = ((index % playlist.length) + playlist.length) % playlist.length
  const nextSrc = playlist[trackIndex]?.src ?? ''
  if (nextSrc && nextSrc !== loadedSrc) {
    const audio = getAudio()
    audio.src = nextSrc
    loadedSrc = nextSrc
  }
  notifyTrack()
}

function playLoaded() {
  return getAudio().play()
}

/** Call inside a user gesture (e.g. "Chạm để khám phá") so autoplay is allowed. */
export function startRandomMusic() {
  applyTrackIndex(Math.floor(Math.random() * playlist.length))
  useExperienceStore.setState({ musicOn: true })
  void playLoaded().catch(() => {
    useExperienceStore.setState({ musicOn: false })
  })
}

export function getPlaylistTrackIndex() {
  return trackIndex
}

export function subscribeTrackIndex(listener: (index: number) => void) {
  trackListeners.add(listener)
  listener(trackIndex)
  return () => {
    trackListeners.delete(listener)
  }
}

export function syncPlaylistPlayback(musicOn: boolean, index: number) {
  applyTrackIndex(index)
  if (musicOn) {
    return playLoaded().catch(() => {
      useExperienceStore.setState({ musicOn: false })
      throw new Error('play failed')
    })
  }
  sharedAudio?.pause()
  return Promise.resolve()
}
