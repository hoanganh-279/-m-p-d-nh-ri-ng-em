function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Sample particle positions from Vietnamese text glyphs drawn on canvas.
 * Returns Float32Array of length count*3 matching heart particle count.
 */
export function sampleTextParticles(
  text: string,
  count: number,
  options?: { width?: number; height?: number; worldScale?: number },
): Float32Array {
  const width = options?.width ?? 1024
  const height = options?.height ?? 384
  const worldScale = options?.worldScale ?? 0.0042

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 120px "Cormorant Garamond", "Nunito Sans", Georgia, serif'
  ctx.fillText(text, width / 2, height / 2)

  const { data } = ctx.getImageData(0, 0, width, height)
  const pts: number[] = []
  const step = 3
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 128) {
        pts.push(x, y)
      }
    }
  }

  const out = new Float32Array(count * 3)
  const rand = mulberry32(20201020)

  if (pts.length === 0) {
    // fallback: small horizontal line
    for (let i = 0; i < count; i++) {
      out[i * 3] = (i / count - 0.5) * 3
      out[i * 3 + 1] = 0
      out[i * 3 + 2] = 0
    }
    return out
  }

  const pairCount = pts.length / 2
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rand() * pairCount)
    const px = pts[idx * 2]
    const py = pts[idx * 2 + 1]
    const x = (px - width / 2) * worldScale
    const y = -(py - height / 2) * worldScale
    // slight Z curve for soft 3D text plane
    const z = (rand() - 0.5) * 0.15 + Math.sin(x * 1.2) * 0.08
    out[i * 3] = x
    out[i * 3 + 1] = y
    out[i * 3 + 2] = z
  }

  return out
}
