import { categories, initialState } from './domain'
import type { AppState } from './domain'

export const STORAGE_KEY = 'hitosaji-demo-v1'
// Saved data is untrusted: a stale or incomplete schema falls back to a working demo.
export function parseState(value: string | null): AppState {
  if (!value) return initialState()
  try {
    const s = JSON.parse(value)
    const date = (v: unknown) =>
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))
    const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
    if (
      s.version !== 1 ||
      !date(s.today) ||
      !Array.isArray(s.meals) ||
      !s.meals.every(
        (m: Record<string, unknown>) =>
          m &&
          typeof m.id === 'string' &&
          date(m.day) &&
          typeof m.recipeId === 'string' &&
          typeof m.title === 'string' &&
          categories.includes(m.category as never) &&
          typeof m.note === 'string' &&
          ['private', 'anonymous', 'friends'].includes(m.visibility as string) &&
          typeof m.xp === 'number' &&
          Number.isFinite(m.xp) &&
          (!m.photo || (typeof m.photo === 'string' && m.photo.startsWith('data:image/'))),
      )
    )
      throw new Error('meals')
    if (
      !strings(s.rests) ||
      !s.rests.every(date) ||
      !Number.isInteger(s.freezes) ||
      s.freezes < 0 ||
      !strings(s.pantry) ||
      ![5, 15, 30].includes(s.minutes) ||
      !strings(s.liked) ||
      !strings(s.followed) ||
      typeof s.notes !== 'string'
    )
      throw new Error('state')
    const options = {
      recommendation: ['one', 'three'],
      habit: ['daily', 'weekly'],
      repetition: ['bonus', 'penalty'],
      social: ['gated', 'open'],
      reminder: ['gentle', 'pushy'],
    }
    if (
      !s.settings ||
      !Object.entries(options).every(([k, values]) => values.includes(s.settings[k]))
    )
      throw new Error('settings')
    if (
      !Array.isArray(s.events) ||
      !s.events.every(
        (e: Record<string, unknown>) =>
          e && date(e.day) && typeof e.type === 'string' && typeof e.detail === 'string',
      )
    )
      throw new Error('events')
    return s as AppState
  } catch {
    return initialState()
  }
}
export function loadState() {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY))
  } catch {
    return initialState()
  }
}
export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
export async function resizePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('JPEG・PNG・WebPの写真を選んでください。')
  if (file.size > 15 * 1024 * 1024) throw new Error('15MB以下の写真を選んでください。')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('この写真を読み込めませんでした。別の写真を選んでください。')
  }
  try {
    const ratio = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * ratio)
    canvas.height = Math.round(bitmap.height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('写真を読み込めませんでした。')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    bitmap.close()
  }
}
