/**
 * Chroma-key the green-screen Stitch render → true transparent PNG.
 * Also try AI remove on the original photo if imgly works.
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const OUT = join(process.cwd(), 'public', 'mascots')
const GREEN_SRC =
  'C:/Users/ASUS/.cursor/projects/e-qu-c-t-ph-n/assets/stitch-cutout-green.jpg'
const PHOTO_SRC =
  'C:/Users/ASUS/.cursor/projects/e-qu-c-t-ph-n/assets/c__Users_ASUS_AppData_Roaming_Cursor_User_workspaceStorage_3a160aec2e8313b2da399354b9efb8f9_images_image-88813199-3371-4876-a3b4-5e842783fbee.png'

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

function chromaGreen(data, width, height) {
  const out = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    // Pure / near chroma green
    const greenDominant = g > 140 && g > r + 40 && g > b + 40
    const brightGreen = g > 200 && r < 180 && b < 180 && g > r && g > b
    // White / light gray studio leftover
    const milky = r > 230 && g > 230 && b > 230
    const lightHalo = r > 210 && g > 210 && b > 210 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12

    out[o] = r
    out[o + 1] = g
    out[o + 2] = b
    if (greenDominant || brightGreen || milky || lightHalo) {
      // Soft edge for near-green
      if (g > 160 && g > r + 25 && g > b + 25 && !(g > r + 55)) {
        out[o + 3] = 90
      } else {
        out[o + 3] = 0
      }
    } else {
      out[o + 3] = 255
      // Despill: reduce green fringe on edges
      if (g > r + 15 && g > b + 15) {
        out[o + 1] = Math.min(g, Math.round((r + b) / 2 + 20))
      }
    }
  }
  return out
}

// 1) Green-screen cutout (primary — clean edges)
{
  const { data, info } = await sharp(GREEN_SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const keyed = chromaGreen(data, info.width, info.height)
  const dest = join(OUT, 'stitch-wave.png')
  await sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .trim({ threshold: 5 })
    .resize(720, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 8 })
    .toFile(dest)
  copyFileSync(dest, join(OUT, 'stitch-photo.png'))
  console.log('chroma green →', dest)
}

// 2) Optional AI on original photo (best fidelity if available)
try {
  const { removeBackground } = await import('@imgly/background-removal-node')
  console.log('AI remove on original photo…')
  const blob = await removeBackground(pathToFileURL(PHOTO_SRC).href, {
    output: { format: 'image/png', quality: 1 },
  })
  const buf = Buffer.from(await blob.arrayBuffer())
  const aiDest = join(OUT, 'stitch-wave-ai.png')
  writeFileSync(aiDest, buf)

  // Prefer AI if it produced a decent alpha image; overwrite stitch-wave
  const meta = await sharp(buf).metadata()
  if (meta.hasAlpha) {
    await sharp(buf)
      .trim({ threshold: 8 })
      .resize(720, 720, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 8 })
      .toFile(join(OUT, 'stitch-wave.png'))
    copyFileSync(join(OUT, 'stitch-wave.png'), join(OUT, 'stitch-photo.png'))
    console.log('AI cutout preferred → stitch-wave.png')
  }
} catch (err) {
  console.warn('AI skipped:', err?.message || err)
}
