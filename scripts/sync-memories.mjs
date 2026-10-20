import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const imgDir = path.join(root, 'img')
const outFile = path.join(root, 'src', 'data', 'memories.ts')

const files = fs
  .readdirSync(imgDir)
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort()

const list = files.map((f) => `  '${f}'`).join(',\n')

const out = `export type Memory = {
  id: string
  src: string
  caption: string
  date?: string
}

const files = [
${list},
] as const

export const memories: Memory[] = files.map((file, index) => ({
  id: \`memory-\${index + 1}\`,
  src: \`/memories/\${file.replace(/\\.jpg$/i, '.webp')}\`,
  caption: \`Kỷ niệm #\${index + 1}\`,
  date: 'Sửa chú thích sau',
}))
`

fs.writeFileSync(outFile, out)
console.log('wrote', files.length, 'memories to', outFile)
