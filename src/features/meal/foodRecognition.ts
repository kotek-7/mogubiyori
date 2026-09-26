import { parseFoodRecognitionResult } from '../../../shared/meals/recognition'
import type { FoodRecognitionResult } from '../../../shared/meals/recognition'

export async function recognizeFood(
  photo: string,
  signal?: AbortSignal,
): Promise<FoodRecognitionResult> {
  signal?.throwIfAborted()
  const controller = new AbortController()
  const abort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Food recognition timed out', 'TimeoutError')),
    25_000,
  )

  try {
    const response = await fetch('/api/recognize-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Food recognition failed')
    const result = parseFoodRecognitionResult(await response.json())
    if (!result) throw new Error('Invalid food recognition response')
    return result
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
