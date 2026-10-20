/**
 * Remove milky white / light fringe around transparent PNG cutouts.
 */
import sharp from 'sharp'
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'public', 'mascots')
const FILE = join(OUT, 'stitch-wave-ai.png')

const { data, info } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info
const out = Buffer.from(data)

const lum = (r, g, b) => (r + g + b) / 3
const sat = (r, g, b) => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = y * width + x
    const o = i * 4
    const a = data[o + 3]
    if (a < 8) {
      out[o + 3] = 0
      continue
    }

    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const L = lum(r, g, b)
    const S = sat(r, g, b)

    // Count transparent neighbors
    let t = 0
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        t++
        continue
      }
      if (data[(ny * width + nx) * 4 + 3] < 20) t++
    }

    // Edge milky fringe → kill
    if (t >= 1 && L > 195 && S < 0.22) {
      out[o + 3] = 0
      continue
    }
    if (t >= 2 && L > 170 && S < 0.18) {
      out[o + 3] = 0
      continue
    }
    // Soften semi-transparent milky pixels
    if (a < 200 && L > 180 && S < 0.25) {
      out[o + 3] = 0
      continue
    }
  }
}

const dest = join(OUT, 'stitch-wave.png')
await sharp(out, { raw: { width, height, channels: 4 } })
  .png()
  .trim({ threshold: 2 })
  .resize(720, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 8 })
  .toFile(dest)

copyFileSync(dest, join(OUT, 'stitch-photo.png'))
console.log('fringe cleaned →', dest)
