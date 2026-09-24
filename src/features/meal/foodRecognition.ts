import { recipes } from '../../app/game/browserGame'

const recipeIds = new Set(recipes.map((recipe) => recipe.id))

export async function recognizeFood(photo: string, signal?: AbortSignal): Promise<string[]> {
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
    const result: unknown = await response.json()
    if (
      !result ||
      typeof result !== 'object' ||
      !('candidates' in result) ||
      !Array.isArray(result.candidates)
    )
      throw new Error('Invalid food recognition response')

    return [
      ...new Set(
        result.candidates.filter((id): id is string => typeof id === 'string' && recipeIds.has(id)),
      ),
    ].slice(0, 3)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
