import { photoDimensions } from './photoDimensions'

export async function resizePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('JPEG・PNG・WebPの写真を選んでください。')
  if (file.size > 15 * 1024 * 1024) throw new Error('15MB以下の写真を選んでください。')
  let bitmap: ImageBitmap
  try {
    const { width, height } = await photoDimensions(file)
    const ratio = Math.min(1, 800 / Math.max(width, height))
    bitmap = await createImageBitmap(file, {
      resizeWidth: Math.max(1, Math.round(width * ratio)),
      resizeHeight: Math.max(1, Math.round(height * ratio)),
      resizeQuality: 'medium',
      imageOrientation: 'from-image',
    })
  } catch {
    throw new Error('この写真を読み込めませんでした。別の写真を選んでください。')
  }
  const canvas = document.createElement('canvas')
  try {
    const ratio = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('写真を読み込めませんでした。')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    bitmap.close()
    canvas.width = 0
    canvas.height = 0
  }
}
