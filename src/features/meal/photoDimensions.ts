type Dimensions = { width: number; height: number }

// Read encoded headers only: discovering dimensions must not allocate a full-size raster.
export async function photoDimensions(file: Blob): Promise<Dimensions> {
  const data = new DataView(await file.arrayBuffer())
  let dimensions: Dimensions | undefined
  let orientation = 1
  const text = (offset: number, length: number) =>
    String.fromCharCode(...new Uint8Array(data.buffer, offset, length))

  function exif(offset: number, length: number) {
    const end = offset + length
    if (length >= 6 && text(offset, 6) === 'Exif\0\0') offset += 6
    if (offset + 8 > end) return
    const order = data.getUint16(offset)
    if (order !== 0x4949 && order !== 0x4d4d) return
    const littleEndian = order === 0x4949
    if (data.getUint16(offset + 2, littleEndian) !== 42) return
    const directory = offset + data.getUint32(offset + 4, littleEndian)
    if (directory < offset + 8 || directory + 2 > end) return
    const count = data.getUint16(directory, littleEndian)
    for (let i = 0; i < count; i++) {
      const entry = directory + 2 + i * 12
      if (entry + 12 > end) return
      if (
        data.getUint16(entry, littleEndian) === 0x0112 &&
        data.getUint16(entry + 2, littleEndian) === 3 &&
        data.getUint32(entry + 4, littleEndian) === 1
      ) {
        orientation = data.getUint16(entry + 8, littleEndian)
        return
      }
    }
  }

  if (data.byteLength >= 2 && data.getUint16(0) === 0xffd8) {
    let offset = 2
    while (offset + 4 <= data.byteLength && data.getUint8(offset) === 0xff) {
      while (offset < data.byteLength && data.getUint8(offset) === 0xff) offset++
      if (offset + 3 > data.byteLength) break
      const marker = data.getUint8(offset++)
      if (marker === 0xda || marker === 0xd9) break
      const length = data.getUint16(offset)
      if (length < 2 || offset + length > data.byteLength) break
      if (marker === 0xe1) exif(offset + 2, length - 2)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        if (length < 7) break
        dimensions = { width: data.getUint16(offset + 5), height: data.getUint16(offset + 3) }
      }
      offset += length
    }
  } else if (
    data.byteLength >= 24 &&
    data.getUint32(0) === 0x89504e47 &&
    data.getUint32(4) === 0x0d0a1a0a &&
    text(12, 4) === 'IHDR'
  ) {
    dimensions = { width: data.getUint32(16), height: data.getUint32(20) }
    let offset = 8
    while (offset + 12 <= data.byteLength) {
      const length = data.getUint32(offset)
      if (offset + 12 + length > data.byteLength) break
      if (text(offset + 4, 4) === 'eXIf') exif(offset + 8, length)
      offset += 12 + length
    }
  } else if (data.byteLength >= 12 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    let offset = 12
    const uint24 = (position: number) =>
      data.getUint8(position) + data.getUint16(position + 1, true) * 256
    while (offset + 8 <= data.byteLength) {
      const type = text(offset, 4)
      const length = data.getUint32(offset + 4, true)
      const start = offset + 8
      if (start + length > data.byteLength) break
      if (type === 'VP8X' && length >= 10) {
        dimensions = { width: uint24(start + 4) + 1, height: uint24(start + 7) + 1 }
      } else if (!dimensions && type === 'VP8 ' && length >= 10) {
        dimensions = {
          width: data.getUint16(start + 6, true) & 0x3fff,
          height: data.getUint16(start + 8, true) & 0x3fff,
        }
      } else if (!dimensions && type === 'VP8L' && length >= 5) {
        const bits = data.getUint32(start + 1, true)
        dimensions = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
      } else if (type === 'EXIF') exif(start, length)
      offset = start + length + (length % 2)
    }
  }

  if (!dimensions?.width || !dimensions.height) throw new Error('Invalid photo dimensions')
  return orientation >= 5 && orientation <= 8
    ? { width: dimensions.height, height: dimensions.width }
    : dimensions
}
