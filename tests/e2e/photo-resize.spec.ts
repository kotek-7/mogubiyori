import { expect, test } from '@playwright/test'

for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
  test(`large ${type} photos decode to a bounded bitmap and keep their aspect ratio`, async ({
    page,
  }) => {
    await page.goto('/')
    const result = await page.evaluate(async (type) => {
      const module = '/src/features/meal/photo.ts'
      const { resizePhoto } = await import(/* @vite-ignore */ module)
      const canvas = document.createElement('canvas')
      canvas.width = 6000
      canvas.height = 4000
      canvas.getContext('2d')!.fillRect(0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), type))
      canvas.width = canvas.height = 0
      const decode = window.createImageBitmap.bind(window)
      const bitmaps: ImageBitmap[] = []
      const sizes: number[][] = []
      window.createImageBitmap = async (...args: Parameters<typeof createImageBitmap>) => {
        const bitmap = await decode(...args)
        bitmaps.push(bitmap)
        sizes.push([bitmap.width, bitmap.height])
        return bitmap
      }
      try {
        const src = await resizePhoto(new File([blob], 'meal', { type }))
        const preview = new Image()
        preview.src = src
        await preview.decode()
        return {
          type: src.slice(0, 23),
          size: [preview.naturalWidth, preview.naturalHeight],
          sizes,
          released: bitmaps.every((bitmap) => bitmap.width === 0 && bitmap.height === 0),
        }
      } finally {
        window.createImageBitmap = decode
      }
    }, type)
    expect(result).toEqual({
      type: 'data:image/jpeg;base64,',
      size: [800, 533],
      sizes: [[800, 533]],
      released: true,
    })
  })
}

test('portrait EXIF orientation is preserved without stretching or enlarging small photos', async ({
  page,
}) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const module = '/src/features/meal/photo.ts'
    const { resizePhoto } = await import(/* @vite-ignore */ module)
    const source = document.createElement('canvas')
    source.width = 120
    source.height = 60
    const ctx = source.getContext('2d')!
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 60, 60)
    ctx.fillStyle = 'blue'
    ctx.fillRect(60, 0, 60, 60)
    const blob = await new Promise<Blob>((resolve) =>
      source.toBlob((b) => resolve(b!), 'image/jpeg'),
    )
    const jpeg = new Uint8Array(await blob.arrayBuffer())
    // APP1 EXIF: big-endian TIFF with orientation=6 (90 degrees clockwise).
    const exif = new Uint8Array([
      0xff, 0xe1, 0, 34, 69, 120, 105, 102, 0, 0, 0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, 1, 1, 0x12, 0,
      3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0,
    ])
    const file = new File([jpeg.slice(0, 2), exif, jpeg.slice(2)], 'portrait.jpg', {
      type: 'image/jpeg',
    })
    const image = new Image()
    image.src = await resizePhoto(file)
    await image.decode()
    source.width = image.naturalWidth
    source.height = image.naturalHeight
    ctx.drawImage(image, 0, 0)
    const top = Array.from(ctx.getImageData(30, 20, 1, 1).data)
    const bottom = Array.from(ctx.getImageData(30, 100, 1, 1).data)
    return { size: [image.naturalWidth, image.naturalHeight], top, bottom }
  })
  expect(result.size).toEqual([60, 120])
  expect(result.top[0]).toBeGreaterThan(200)
  expect(result.top[2]).toBeLessThan(30)
  expect(result.bottom[2]).toBeGreaterThan(200)
  expect(result.bottom[0]).toBeLessThan(30)
})
