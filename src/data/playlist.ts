export type Track = {
  id: string
  title: string
  src: string
}

export const playlist: Track[] = [
  { id: 'cho-chut', title: 'Chờ chút', src: '/audio/cho-chut.mp3' },
  { id: 'em-be', title: 'Em Bé', src: '/audio/em-be-thom.mp3' },
  { id: 'nang-am', title: 'Nắng ấm trong tim', src: '/audio/nang-am-trong-tim.mp3' },
  { id: 'nang-am-remix', title: 'Nắng ấm trong tim (Remix)', src: '/audio/nang-am-trong-tim-remix.mp3' },
  { id: 'co-nhau', title: 'Có Nhau', src: '/audio/co-nhau.mp3' },
  { id: 'comethru', title: 'Comethru', src: '/audio/comethru.mp3' },
  { id: 'thousand-years', title: 'A thousand years', src: '/audio/a-thousand-years.mp3' },
  { id: 'little-love', title: 'A little love', src: '/audio/a-little-love.mp3' },
  { id: 'baby', title: 'Baby', src: '/audio/baby.mp3' },
]
