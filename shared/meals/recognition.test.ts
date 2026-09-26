import { describe, expect, it } from 'vitest'
import { parseFoodRecognitionResult } from './recognition'
import { mealItemSchema } from './schemas'

const main = {
  name: 'カレー',
  dishId: 'generic-curry',
  groups: ['staple'],
  portion: 'large',
  groupsConfirmed: false,
}
const side = { name: 'サラダ', groups: ['vegetable'], portion: 'small', groupsConfirmed: false }

describe('food recognition response', () => {
  it('accepts old candidate-only responses and filters, deduplicates, and caps their IDs', () => {
    expect(
      parseFoodRecognitionResult({
        candidates: ['invented', 'curry', 'curry', 'onigiri', 'generic-pasta', 'egg-rice'],
      }),
    ).toEqual({
      candidates: ['curry', 'onigiri', 'generic-pasta'],
      items: [],
    })
  })

  it('keeps the main dish first and retains each separate portion', () => {
    expect(
      parseFoodRecognitionResult({ candidates: ['generic-curry'], items: [main, side] }),
    ).toEqual({
      candidates: ['generic-curry'],
      items: [main, side],
    })
  })

  it('filters invented food groups and IDs and keeps recognition unconfirmed', () => {
    const result = parseFoodRecognitionResult({
      candidates: [],
      items: [
        {
          name: ' スープ ',
          recipeId: 'invented',
          dishId: 'onigiri',
          groups: ['protein', 'salt', 'protein'],
          portion: 'extra-large',
          groupsConfirmed: true,
        },
      ],
    })
    expect(result).toEqual({
      candidates: [],
      items: [{ name: 'スープ', groups: ['protein'], portion: 'unknown', groupsConfirmed: false }],
    })
    expect(mealItemSchema.safeParse(result!.items[0]).success).toBe(true)
  })

  it('never supplies conflicting recipe and dish classifications', () => {
    const result = parseFoodRecognitionResult({
      candidates: [],
      items: [{ ...side, recipeId: 'onigiri', dishId: 'generic-pasta' }],
    })
    expect(result!.items).toEqual([side])
  })

  it('limits food records to twelve items without reordering the main dish', () => {
    const result = parseFoodRecognitionResult({
      candidates: [],
      items: [
        main,
        ...Array.from({ length: 15 }, (_, index) => ({ ...side, name: `副菜${index}` })),
      ],
    })
    expect(result!.items).toHaveLength(12)
    expect(result!.items[0]).toEqual(main)
    expect(result!.items[11].name).toBe('副菜10')
  })

  it.each([
    null,
    [],
    { candidates: 'curry' },
    { candidates: ['curry', 1] },
    { candidates: [], items: null },
    { candidates: [], items: [null] },
    { candidates: [], items: [{ ...side, name: '' }] },
    { candidates: [], items: [{ ...side, groups: 'vegetable' }] },
    { candidates: [], items: [{ ...side, portion: null }] },
    { candidates: [], items: [side], reward: 100 },
  ])('rejects malformed responses', (value) => {
    expect(parseFoodRecognitionResult(value)).toBeNull()
  })
})
