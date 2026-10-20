/** PIN to unlock Bí Mật vault — change here if needed. */
export const SECRET_PIN = '19062025'

export type SecretItem = {
  id: string
  type: 'image' | 'video'
  /** Path under /public, e.g. /secrets/gift-1.webp */
  src: string
  title: string
  caption?: string
  /** Optional poster for videos */
  poster?: string
}

/**
 * Add gift media files to `public/secrets/` then list them here.
 * Example:
 * { id: '1', type: 'image', src: '/secrets/gift-1.webp', title: 'Quà nhỏ', caption: '…' }
 * { id: '2', type: 'video', src: '/secrets/clip.mp4', title: 'Video', poster: '/secrets/clip.jpg' }
 */
export const secretItems: SecretItem[] = [
  // Placeholder entries — replace src when you add real files.
  // Leave array empty [] if you prefer only the empty-state UI until files are ready.
]
