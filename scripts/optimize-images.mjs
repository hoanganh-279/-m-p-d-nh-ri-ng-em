import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'img')
const outDir = path.join(root, 'public', 'memories')

fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(path.join(root, 'public', 'audio'), { recursive: true })

const files = fs.readdirSync(srcDir).filter((f) => /\.jpe?g$/i.test(f))

for (const file of files) {
  const input = path.join(srcDir, file)
  const output = path.join(outDir, file.replace(/\.jpe?g$/i, '.webp'))
  await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(output)
  console.log('optimized', file)
}

const readme = path.join(root, 'public', 'audio', 'README.txt')
fs.writeFileSync(
  readme,
  [
    'Đặt file nhạc MP3 vào thư mục này với tên:',
    'cho-chut.mp3',
    'em-be-thom.mp3',
    'nang-am-trong-tim.mp3',
    'comethru.mp3',
    'a-thousand-years.mp3',
    'a-little-love.mp3',
    'baby.mp3',
    '',
    'Bạn tự cung cấp file (không tự động tải nhạc có bản quyền).',
  ].join('\n'),
)

console.log('done', files.length, 'images')
