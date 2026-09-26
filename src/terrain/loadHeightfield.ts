import { heightfieldFromRGBA, type Heightfield } from './decode'

interface Meta { width: number; height: number; sizeMeters: number }

export async function loadHeightfield(base = './terrain/matterhorn'): Promise<Heightfield> {
  const [meta, img] = await Promise.all([
    fetch(`${base}.json`).then((r) => r.json() as Promise<Meta>),
    new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = `${base}.png`
    }),
  ])
  const c = document.createElement('canvas')
  c.width = meta.width
  c.height = meta.height
  // colorSpace srgb без премультипликации: иначе браузер исказит закодированные высоты
  const ctx = c.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, meta.width, meta.height)
  return heightfieldFromRGBA(data, meta.width, meta.height, meta.sizeMeters / (meta.width - 1))
}
