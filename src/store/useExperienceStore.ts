import { create } from 'zustand'
import { memories } from '../data/memories'

export type Scene = 'intro' | 'main' | 'lightbox' | 'letter' | 'secret'

type ExperienceState = {
  scene: Scene
  entered: boolean
  isFreeMode: boolean
  orbitSpeed: number
  orbitRadius: number
  zoom: number
  musicOn: boolean
  fxOn: boolean
  reducedMotion: boolean
  isMobile: boolean
  heartPulse: number
  selectedPhotoId: string | null
  photoOffsets: Record<string, [number, number, number]>
  showHint: boolean
  letterDone: boolean
  heartResetKey: number
  setScene: (scene: Scene) => void
  enterExperience: () => void
  setFreeMode: (value: boolean) => void
  setOrbitSpeed: (value: number) => void
  setOrbitRadius: (value: number) => void
  setZoom: (value: number) => void
  zoomBy: (delta: number) => void
  toggleMusic: () => void
  toggleFx: () => void
  setReducedMotion: (value: boolean) => void
  setIsMobile: (value: boolean) => void
  pulseHeart: () => void
  decayHeartPulse: (dt: number) => void
  resetHeart: () => void
  openLightbox: (id: string) => void
  closeLightbox: () => void
  selectNextPhoto: (dir: 1 | -1) => void
  setPhotoOffset: (id: string, offset: [number, number, number]) => void
  dismissHint: () => void
  openLetter: () => void
  closeLetter: () => void
  setLetterDone: (value: boolean) => void
  openSecret: () => void
  closeSecret: () => void
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  scene: 'intro',
  entered: false,
  isFreeMode: false,
  orbitSpeed: 0.18,
  orbitRadius: 1,
  zoom: 9,
  musicOn: false,
  fxOn: true,
  reducedMotion: false,
  isMobile: false,
  heartPulse: 0,
  selectedPhotoId: null,
  photoOffsets: {},
  showHint: true,
  letterDone: false,
  heartResetKey: 0,

  setScene: (scene) => set({ scene }),

  enterExperience: () =>
    set({
      entered: true,
      scene: 'main',
      showHint: true,
    }),

  setFreeMode: (value) => set({ isFreeMode: value }),

  setOrbitSpeed: (value) => set({ orbitSpeed: clamp(value, 0, 1.2) }),

  setOrbitRadius: (value) => set({ orbitRadius: clamp(value, 0.55, 1.8) }),

  setZoom: (value) => set({ zoom: clamp(value, 4.5, 16) }),

  zoomBy: (delta) => set({ zoom: clamp(get().zoom + delta, 4.5, 16) }),

  toggleMusic: () => set((s) => ({ musicOn: !s.musicOn })),

  toggleFx: () => set((s) => ({ fxOn: !s.fxOn })),

  setReducedMotion: (value) =>
    set({
      reducedMotion: value,
      orbitSpeed: value ? 0 : get().orbitSpeed || 0.18,
      fxOn: value ? false : get().fxOn,
    }),

  setIsMobile: (value) => set({ isMobile: value }),

  pulseHeart: () => set({ heartPulse: 1 }),

  decayHeartPulse: (dt) => {
    const current = get().heartPulse
    if (current <= 0) return
    set({ heartPulse: Math.max(0, current - dt * 1.4) })
  },

  resetHeart: () => set((s) => ({ heartResetKey: s.heartResetKey + 1, heartPulse: 0 })),

  openLightbox: (id) =>
    set({
      selectedPhotoId: id,
      scene: 'lightbox',
    }),

  closeLightbox: () =>
    set({
      selectedPhotoId: null,
      scene: 'main',
    }),

  selectNextPhoto: (dir) => {
    const { selectedPhotoId } = get()
    if (!selectedPhotoId) return
    const idx = memories.findIndex((m) => m.id === selectedPhotoId)
    if (idx < 0) return
    const next = (idx + dir + memories.length) % memories.length
    set({ selectedPhotoId: memories[next].id })
  },

  setPhotoOffset: (id, offset) =>
    set((s) => ({
      photoOffsets: { ...s.photoOffsets, [id]: offset },
    })),

  dismissHint: () => set({ showHint: false }),

  openLetter: () => set({ scene: 'letter', letterDone: false }),

  closeLetter: () => set({ scene: 'main' }),

  setLetterDone: (value) => set({ letterDone: value }),

  openSecret: () => set({ scene: 'secret' }),

  closeSecret: () => set({ scene: 'main' }),
}))
