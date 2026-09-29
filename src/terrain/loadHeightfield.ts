import { heightfieldFromRGBA, type Heightfield } from './decode'

interface Meta { width: number; height: number; sizeMeters: number }

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const i = new Image()
  i.onload = () => resolve(i)
  i.onerror = reject
  i.src = src
})

/**
 * PNG декодируется вне главного потока (createImageBitmap), без цветокоррекции и премультипликации:
 * байты — это закодированные высоты. Синхронный decode <img> в drawImage стоил ~30 мс посреди входной анимации.
 */
const loadPixels = async (src: string): Promise<CanvasImageSource> => {
  if (typeof createImageBitmap !== 'function') return loadImage(src)
  const blob = await fetch(src).then((r) => { if (!r.ok) throw new Error(`${src}: ${r.status}`); return r.blob() })
  return createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
}

export async function loadHeightfield(base = './terrain/matterhorn'): Promise<Heightfield> {
  const [meta, img] = await Promise.all([
    fetch(`${base}.json`).then((r) => r.json() as Promise<Meta>),
    loadPixels(`${base}.png`),
  ])
  const c = document.createElement('canvas')
  c.width = meta.width
  c.height = meta.height
  // colorSpace srgb без премультипликации: иначе браузер исказит закодированные высоты
  const ctx = c.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!
  ctx.drawImage(img, 0, 0)
  if ('close' in img) img.close()
  const { data } = ctx.getImageData(0, 0, meta.width, meta.height)
  return heightfieldFromRGBA(data, meta.width, meta.height, meta.sizeMeters / (meta.width - 1))
}
