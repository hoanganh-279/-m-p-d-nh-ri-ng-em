/**
 * Copy generated mascot JPGs → transparent PNGs in public/mascots/
 * Flood-fills near-white background from image edges (keeps white hats/aprons).
 */
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'C:/Users/ASUS/.cursor/projects/e-qu-c-t-ph-n/assets'
const OUT = join(process.cwd(), 'public', 'mascots')

const FILES = [
  'stitch-wave.jpg',
  'stitch-hearts.jpg',
  'twinkle-hearts.jpg',
  'twinkle-apple.jpg',
  'twinkle-chef.jpg',
  'twinkle-wizard.jpg',
  'twinkle-boat.jpg',
  'twinkle-fortune.jpg',
]

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

function isBg(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max === 0 ? 0 : (max - min) / max
  const lum = (r + g + b) / 3
  return lum > 228 && sat < 0.14
}

function floodKnock(data, width, height) {
  const n = width * height
  const mark = new Uint8Array(n)
  const queue = []

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const i = y * width + x
    if (mark[i]) return
    const o = i * 4
    if (!isBg(data[o], data[o + 1], data[o + 2])) return
    mark[i] = 1
    queue.push(i)
  }

  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }

  while (queue.length) {
    const i = queue.pop()
    const x = i % width
    const y = (i / width) | 0
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }

  const out = Buffer.from(data)
  for (let i = 0; i < n; i++) {
    if (!mark[i]) continue
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const lum = (r + g + b) / 3
    // Soft edge: partially transparent near threshold
    let alpha = 0
    if (lum < 245) alpha = Math.min(255, Math.round(((245 - lum) / 17) * 120))
    out[o + 3] = alpha
  }
  return out
}

for (const file of FILES) {
  const input = join(SRC, file)
  const name = file.replace(/\.jpg$/i, '.png')
  const output = join(OUT, name)

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const knocked = floodKnock(data, info.width, info.height)

  await sharp(knocked, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 8 })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(output)

  console.log('ok', name)
}

console.log('done →', OUT)
