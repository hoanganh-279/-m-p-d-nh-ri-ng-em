import { removeBackground } from '@imgly/background-removal-node'
import { writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const OUT = join(process.cwd(), 'public', 'mascots')
const SRC =
  'C:/Users/ASUS/.cursor/projects/e-qu-c-t-ph-n/assets/c__Users_ASUS_AppData_Roaming_Cursor_User_workspaceStorage_3a160aec2e8313b2da399354b9efb8f9_images_image-88813199-3371-4876-a3b4-5e842783fbee.png'

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

console.log('removing background (AI)…')
const blob = await removeBackground(pathToFileURL(SRC).href, {
  output: { format: 'image/png', quality: 1 },
})
const buf = Buffer.from(await blob.arrayBuffer())

const dest = join(OUT, 'stitch-wave.png')
writeFileSync(dest, buf)
copyFileSync(dest, join(OUT, 'stitch-photo.png'))
console.log('done', dest, buf.length, 'bytes')
