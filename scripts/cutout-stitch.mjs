/**
 * Strict character-only mask for user Stitch photo.
 * Everything that isn't blue / pink / dark feature / white highlight → alpha 0.
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'public', 'mascots')
const SRC =
  'C:/Users/ASUS/.cursor/projects/e-qu-c-t-ph-n/assets/c__Users_ASUS_AppData_Roaming_Cursor_User_workspaceStorage_3a160aec2e8313b2da399354b9efb8f9_images_image-88813199-3371-4876-a3b4-5e842783fbee.png'

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

function scoreCharacter(r, g, b) {
  // Primary blue body
  if (b > 70 && b > r + 18 && b >= g - 5) return 1
  // Light cyan belly / muzzle
  if (b > 130 && g > 120 && r < 210 && b >= r - 5 && g >= r - 10) return 1
  // Pink ear / tongue
  if (r > 130 && g > 50 && g < 170 && b > 70 && r > g + 15 && r > b - 20) return 1
  // Navy nose / claws / outlines
  if (r < 75 && g < 85 && b < 120 && b >= r - 8) return 0.95
  // White highlights / teeth
  if (r > 205 && g > 205 && b > 205) return 0.9
  // Soft blue edge fur
  if (b > 90 && g > 80 && r < 150 && b > r + 8 && b > g - 15) return 0.85
  return 0
}

function morphClose(mask, width, height, radius = 2) {
  const dilate = new Uint8Array(mask.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 0
      for (let dy = -radius; dy <= radius && !on; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          if (mask[ny * width + nx]) on = 1
        }
      }
      dilate[y * width + x] = on
    }
  }
  const erode = new Uint8Array(mask.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let on = 1
      for (let dy = -radius; dy <= radius && on; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            on = 0
            break
          }
          if (!dilate[ny * width + nx]) on = 0
        }
      }
      erode[y * width + x] = on
    }
  }
  return erode
}

function keepLargestComponent(mask, width, height) {
  const n = width * height
  const seen = new Uint8Array(n)
  let best = []
  for (let i = 0; i < n; i++) {
    if (!mask[i] || seen[i]) continue
    const stack = [i]
    const comp = []
    seen[i] = 1
    while (stack.length) {
      const cur = stack.pop()
      comp.push(cur)
      const x = cur % width
      const y = (cur / width) | 0
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const j = ny * width + nx
        if (seen[j] || !mask[j]) continue
        seen[j] = 1
        stack.push(j)
      }
    }
    if (comp.length > best.length) best = comp
  }
  const out = new Uint8Array(n)
  for (const i of best) out[i] = 1
  return out
}

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info
const n = width * height

const rawMask = new Uint8Array(n)
for (let i = 0; i < n; i++) {
  const o = i * 4
  rawMask[i] = scoreCharacter(data[o], data[o + 1], data[o + 2]) >= 0.85 ? 1 : 0
}

const closed = morphClose(rawMask, width, height, 2)
const main = keepLargestComponent(closed, width, height)
// Slight dilate for anti-aliased edge coverage
const edge = morphClose(main, width, height, 1)

const out = Buffer.alloc(n * 4)
for (let i = 0; i < n; i++) {
  const o = i * 4
  out[o] = data[o]
  out[o + 1] = data[o + 1]
  out[o + 2] = data[o + 2]
  if (!edge[i]) {
    out[o + 3] = 0
    continue
  }
  const score = scoreCharacter(data[o], data[o + 1], data[o + 2])
  if (score >= 0.85) out[o + 3] = 255
  else if (main[i]) out[o + 3] = 220
  else out[o + 3] = 0
}

const dest = join(OUT, 'stitch-wave.png')
await sharp(out, { raw: { width, height, channels: 4 } })
  .png()
  .trim({ threshold: 0 })
  .resize(720, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 8 })
  .toFile(dest)

copyFileSync(dest, join(OUT, 'stitch-photo.png'))
console.log('strict cutout done', dest)
