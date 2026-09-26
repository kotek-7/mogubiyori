import { resizePhoto } from './photo'

export const samplePhotoPaths = [
  'art/tutorial/sample-curry.jpg',
  'art/meal-samples/sample-omurice.jpg',
  'art/meal-samples/sample-salmon.jpg',
] as const

export async function loadSamplePhoto(signal: AbortSignal): Promise<string> {
  const path = samplePhotoPaths[Math.floor(Math.random() * samplePhotoPaths.length)]
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`, { signal })
  if (!response.ok) throw new Error('サンプル写真を読み込めませんでした。もう一度お試しください。')
  const blob = await response.blob()
  return resizePhoto(new File([blob], path, { type: 'image/jpeg' }))
}
