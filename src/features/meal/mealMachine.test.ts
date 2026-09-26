import { afterEach, describe, expect, it, vi } from 'vitest'
import { createActor, waitFor } from 'xstate'
import type { AnyActorRef } from 'xstate'
import { createMealMachine } from './mealMachine'
import type { MealMachineInput, MealServices } from './mealMachine'
import { chooseStarter, feed, initialGame } from '../../app/game/browserGame'
import { createFeedReceipt } from '../../../shared/game/receipt'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { suggestMealItem } from '../../../shared/meals/analysis'
import type { MealItem, MealRecordInput } from '../../../shared/meals/types'
import type { FoodRecognitionResult } from '../../../shared/meals/recognition'

const before = chooseStarter(initialGame('2026-09-25'), 'komugi')
const receipt = createFeedReceipt(before, feed(before, { title: '今日のごはん', sample: 'rice' }))!
const actors = new Set<AnyActorRef>()
afterEach(() => {
  for (const actor of actors) actor.stop()
  actors.clear()
})

function pending<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function start(overrides: Partial<MealServices> = {}, input: Partial<MealMachineInput> = {}) {
  let sequence = 0
  const services: MealServices = {
    resizePhoto: async (file) => `photo:${file.name}`,
    loadSamplePhoto: async () => 'data:image/jpeg;base64,c2FtcGxl',
    recognizeFood: async () => recognized(),
    submit: vi.fn(async () => receipt),
    createOperationId: () => `operation-${++sequence}`,
    ...overrides,
  }
  const actor = createActor(createMealMachine(services), {
    input: { targetId: 'komugi', ...input },
  }).start()
  actors.add(actor)
  return { actor, services }
}

function recognized(candidates: string[] = [], items: MealItem[] = []): FoodRecognitionResult {
  return { candidates, items }
}

const photo = (name = 'meal.jpg') => new File(['photo'], name, { type: 'image/jpeg' })

const plate = (): MealItem[] => [
  {
    name: '焼き魚',
    dishId: 'generic-grilled-fish',
    groups: ['protein'],
    portion: 'regular',
    groupsConfirmed: false,
  },
  { name: 'ごはん', groups: ['staple'], portion: 'large', groupsConfirmed: false },
  { name: 'サラダ', groups: ['vegetable'], portion: 'small', groupsConfirmed: false },
]

describe('meal draft workflow', () => {
  it('waits for a sample photo and submits that image without recognition', async () => {
    const sample = pending<string>()
    const recognizeFood = vi.fn(async () => recognized())
    const { actor, services } = start({ loadSamplePhoto: () => sample.promise, recognizeFood })
    actor.send({ type: 'USE_SAMPLE' })
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'SUBMIT' })
    expect(
      actor.getSnapshot().matches({ editing: { navigation: 'photo', media: 'loadingSample' } }),
    ).toBe(true)
    expect(services.submit).not.toHaveBeenCalled()
    sample.resolve('data:image/jpeg;base64,c2FtcGxl')
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'CONFIRM_SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ photo: 'data:image/jpeg;base64,c2FtcGxl' }),
      'operation-1',
    )
    expect(recognizeFood).not.toHaveBeenCalled()
  })

  it('keeps the current photo and title when a sample fails and allows retrying', async () => {
    const loadSamplePhoto = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('data:image/jpeg;base64,c2FtcGxl')
    const { actor } = start({ loadSamplePhoto })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    actor.send({ type: 'TITLE_CHANGED', title: 'お昼ごはん' })
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) => state.context.error !== '')
    expect(actor.getSnapshot().context).toMatchObject({
      photo: 'photo:meal.jpg',
      sample: false,
      title: 'お昼ごはん',
    })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'photo', media: 'idle' } })).toBe(
      true,
    )
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    expect(actor.getSnapshot().context).toMatchObject({
      photo: 'data:image/jpeg;base64,c2FtcGxl',
      sample: true,
      title: 'お昼ごはん',
      error: '',
    })
  })

  it.each(['PHOTO_SELECTED', 'CANCEL'] as const)(
    'ignores a pending sample after %s',
    async (action) => {
      const sample = pending<string>()
      let signal!: AbortSignal
      const { actor, services } = start({
        loadSamplePhoto: (nextSignal) => {
          signal = nextSignal
          return sample.promise
        },
      })
      actor.send({ type: 'USE_SAMPLE' })
      if (action === 'CANCEL') actor.send({ type: 'CANCEL' })
      else {
        actor.send({ type: 'PHOTO_SELECTED', file: photo() })
        await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
      }
      expect(signal.aborted).toBe(true)
      sample.resolve('discarded-sample')
      await sample.promise
      expect(actor.getSnapshot().context.photo).not.toBe('discarded-sample')
      expect(
        actor
          .getSnapshot()
          .matches(action === 'CANCEL' ? 'cancelled' : { editing: { navigation: 'photo' } }),
      ).toBe(true)
      expect(services.submit).not.toHaveBeenCalled()
    },
  )

  it('records the whole photographed meal and portions only when feeding is submitted', async () => {
    const items = plate()
    const { actor, services } = start({
      recognizeFood: async () => recognized(['generic-grilled-fish'], items),
    })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.mealRecord).toEqual({
      slot: 'unknown',
      source: 'home',
      items,
    })
    expect(actor.getSnapshot().context.recognizedItemCount).toBe(3)
    expect(services.submit).not.toHaveBeenCalled()
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        title: '焼き魚',
        dishId: 'generic-grilled-fish',
        mealRecord: { slot: 'unknown', source: 'home', items },
      }),
      'operation-1',
    )
  })

  it('keeps a manual portion and meal time while filling the other details and sides', async () => {
    const response = pending<FoodRecognitionResult>()
    const { actor } = start({ recognizeFood: () => response.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    const record = actor.getSnapshot().context.mealRecord
    actor.send({
      type: 'RECORD_CHANGED',
      value: { ...record, slot: 'lunch', items: [{ ...record.items[0], portion: 'small' }] },
    })
    response.resolve(recognized(['generic-grilled-fish'], plate()))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    const [primary, ...sides] = plate()
    expect(actor.getSnapshot().context.mealRecord).toEqual({
      slot: 'lunch',
      source: 'home',
      items: [{ ...primary, portion: 'small' }, ...sides],
    })
  })

  it('keeps confirmed food groups while recognizing the name, amount and side dishes', async () => {
    const response = pending<FoodRecognitionResult>()
    const { actor } = start({ recognizeFood: () => response.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    const record = actor.getSnapshot().context.mealRecord
    actor.send({
      type: 'RECORD_CHANGED',
      value: {
        ...record,
        items: [{ ...record.items[0], groups: ['protein', 'vegetable'], groupsConfirmed: true }],
      },
    })
    response.resolve(recognized(['generic-grilled-fish'], plate()))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.mealRecord.items[0]).toEqual({
      ...plate()[0],
      groups: ['protein', 'vegetable'],
      groupsConfirmed: true,
    })
    expect(actor.getSnapshot().context.mealRecord.items).toHaveLength(3)
  })

  it.each(['title', 'name', 'recipe'] as const)(
    'fills the unedited amount even when the %s was chosen manually',
    async (field) => {
      const response = pending<FoodRecognitionResult>()
      const { actor } = start({ recognizeFood: () => response.promise })
      actor.send({ type: 'PHOTO_SELECTED', file: photo() })
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
      if (field === 'title') actor.send({ type: 'TITLE_CHANGED', title: '今日の定食' })
      else if (field === 'recipe')
        actor.send({ type: 'RECIPE_CHANGED', recipeId: 'generic-grilled-fish' })
      else {
        const record = actor.getSnapshot().context.mealRecord
        actor.send({
          type: 'RECORD_CHANGED',
          value: { ...record, items: [{ ...record.items[0], name: '手でつけた料理名' }] },
        })
      }
      const before = actor.getSnapshot().context
      response.resolve(recognized(['generic-grilled-fish'], plate()))
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
      const after = actor.getSnapshot().context
      expect(after.title).toBe(before.title)
      expect(after.mealRecord.items[0]).toMatchObject({
        name: before.mealRecord.items[0].name,
        groups: ['protein'],
        portion: 'regular',
      })
      expect(after.dishId).toBe(before.dishId)
      expect(after.mealRecord.items).toHaveLength(3)
    },
  )

  it.each(['photo', 'sample'] as const)(
    'removes old automatic details but keeps edited amounts and side dishes on a new %s',
    async (replacement) => {
      const { actor } = start({
        recognizeFood: async (image) =>
          image.includes('first') ? recognized(['generic-grilled-fish'], plate()) : recognized(),
      })
      actor.send({ type: 'PHOTO_SELECTED', file: photo('first.jpg') })
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
      const record = actor.getSnapshot().context.mealRecord
      const manualSide = { ...record.items[2], name: '自分で直した副菜' }
      actor.send({
        type: 'RECORD_CHANGED',
        value: {
          ...record,
          items: [{ ...record.items[0], portion: 'small' }, record.items[1], manualSide],
        },
      })
      if (replacement === 'sample') {
        actor.send({ type: 'USE_SAMPLE' })
        await waitFor(actor, (state) => state.matches({ editing: { media: 'idle' } }))
      } else {
        actor.send({ type: 'PHOTO_SELECTED', file: photo('second.jpg') })
        await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
      }
      expect(actor.getSnapshot().context.mealRecord.items).toEqual([
        { ...suggestMealItem(), portion: 'small' },
        manualSide,
      ])
      expect(actor.getSnapshot().context.recognizedItemCount).toBe(0)
      expect(actor.getSnapshot().context.dishId).toBeUndefined()
    },
  )

  it('preserves manually added sides instead of duplicating them with AI suggestions', async () => {
    const response = pending<FoodRecognitionResult>()
    const { actor } = start({ recognizeFood: () => response.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    const record = actor.getSnapshot().context.mealRecord
    const side: MealItem = {
      name: '手で入力したごはん',
      groups: ['staple'],
      groupsConfirmed: true,
      portion: 'small',
    }
    actor.send({ type: 'RECORD_CHANGED', value: { ...record, items: [...record.items, side] } })
    response.resolve(recognized(['generic-grilled-fish'], plate()))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.mealRecord.items).toEqual([plate()[0], side])
  })

  it('can record a recognized dish outside the recipe catalog without inventing a card', async () => {
    const items: MealItem[] = [
      {
        name: '豆と野菜の煮込み',
        groups: ['protein', 'vegetable'],
        portion: 'unknown',
        groupsConfirmed: false,
      },
    ]
    const { actor, services } = start({ recognizeFood: async () => recognized([], items) })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '豆と野菜の煮込み',
        recipeId: undefined,
        mealRecord: { slot: 'unknown', source: 'home', items },
      }),
      'operation-1',
    )
  })

  it('submits a recognized generic dish without assigning a recipe card', async () => {
    const { actor, services } = start({ recognizeFood: async () => recognized(['generic-pasta']) })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context).toMatchObject({ recipeId: '', dishId: 'generic-pasta' })
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'パスタ',
        sample: 'pasta',
        recipeId: undefined,
        mealRecord: {
          slot: 'unknown',
          source: 'home',
          items: [suggestMealItem('generic-pasta')],
        },
        dishId: 'generic-pasta',
      }),
      'operation-1',
    )
  })

  it('keeps a manually selected dish when recognition finishes late and clears it when a recipe is selected', async () => {
    const recognition = pending<FoodRecognitionResult>()
    const { actor } = start({ recognizeFood: () => recognition.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'OPEN_RECIPES' })
    actor.send({ type: 'RECIPE_SELECTED', recipeId: 'generic-hamburg' })
    recognition.resolve(recognized(['curry']))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context).toMatchObject({ recipeId: '', dishId: 'generic-hamburg' })
    actor.send({ type: 'RECIPE_CHANGED', recipeId: 'curry' })
    expect(actor.getSnapshot().context).toMatchObject({ recipeId: 'curry', dishId: undefined })
  })

  it('clears an automatic generic classification when its photo is replaced', async () => {
    const { actor } = start({
      recognizeFood: async (image) => recognized(image.includes('first') ? ['generic-pasta'] : []),
    })
    actor.send({ type: 'PHOTO_SELECTED', file: photo('first.jpg') })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.dishId).toBe('generic-pasta')
    actor.send({ type: 'PHOTO_SELECTED', file: photo('second.jpg') })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.dishId).toBeUndefined()
  })

  it('creates a new operation when only the generic classification changes after a failed save', async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error('通信できませんでした'))
      .mockResolvedValueOnce(receipt)
    const { actor } = start({ submit })
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    actor.send({ type: 'TITLE_CHANGED', title: 'お昼ごはん' })
    actor.send({ type: 'RECIPE_CHANGED', recipeId: 'generic-fried-rice' })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches({ editing: { navigation: 'serve' } }))
    actor.send({ type: 'RECIPE_CHANGED', recipeId: 'generic-donburi' })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(submit.mock.calls.map((call) => call[1])).toEqual(['operation-1', 'operation-2'])
    expect(submit.mock.calls[1][0]).toMatchObject({
      dishId: 'generic-donburi',
      title: 'お昼ごはん',
    })
  })

  it('requires a ready draft at the table before committing a meal', async () => {
    const { actor, services } = start()
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'NEXT' })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'photo' } })).toBe(true)
    expect(services.submit).not.toHaveBeenCalled()

    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    actor.send({ type: 'SUBMIT' })
    expect(services.submit).not.toHaveBeenCalled()
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'SUBMIT' })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'confirmNutrition' } })).toBe(true)
    expect(services.submit).not.toHaveBeenCalled()
    actor.send({ type: 'CONFIRM_SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledExactlyOnceWith(
      {
        targetId: 'komugi',
        title: '今日のごはん',
        photo: 'photo:meal.jpg',
        sample: 'rice',
        recipeId: undefined,
        mealRecord: { slot: 'unknown', source: 'home', items: [suggestMealItem()] },
      },
      'operation-1',
    )
    expect(actor.getSnapshot().context.receipt).toBe(receipt)
  })

  it('allows an unclassified warning to be cancelled without changing the draft or allocating an operation', async () => {
    const createOperationId = vi.fn(() => 'operation-1')
    const { actor, services } = start({ createOperationId })
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    const draft = actor.getSnapshot().context
    actor.send({ type: 'SUBMIT' })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'confirmNutrition' } })).toBe(true)
    actor.send({ type: 'SUBMIT' })
    expect(services.submit).not.toHaveBeenCalled()
    expect(createOperationId).not.toHaveBeenCalled()
    actor.send({ type: 'BACK' })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'serve' } })).toBe(true)
    expect(actor.getSnapshot().context).toEqual(draft)
    actor.send({ type: 'CONFIRM_SUBMIT' })
    expect(services.submit).not.toHaveBeenCalled()
    expect(createOperationId).not.toHaveBeenCalled()
  })

  it('submits an unknown meal only after confirmation and reuses its operation on a confirmed retry', async () => {
    const firstSave = pending<FeedReceipt>()
    const retrySave = pending<FeedReceipt>()
    const submit = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => retrySave.promise)
    const createOperationId = vi.fn(() => 'operation-1')
    const { actor } = start({ submit, createOperationId })
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    actor.send({ type: 'SUBMIT' })
    expect(submit).not.toHaveBeenCalled()
    actor.send({ type: 'CONFIRM_SUBMIT' })
    actor.send({ type: 'CONFIRM_SUBMIT' })
    actor.send({ type: 'SUBMIT' })
    expect(actor.getSnapshot().matches('submitting')).toBe(true)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit.mock.calls[0][0].mealRecord.items).toEqual([suggestMealItem()])
    firstSave.reject(new Error('保存できませんでした'))
    await waitFor(actor, (state) => state.matches({ editing: { navigation: 'serve' } }))
    expect(actor.getSnapshot().context.error).toBe('保存できませんでした')
    actor.send({ type: 'SUBMIT' })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'confirmNutrition' } })).toBe(true)
    expect(submit).toHaveBeenCalledTimes(1)
    actor.send({ type: 'CONFIRM_SUBMIT' })
    expect(submit).toHaveBeenCalledTimes(2)
    expect(submit.mock.calls[1]).toEqual(submit.mock.calls[0])
    expect(createOperationId).toHaveBeenCalledTimes(1)
    retrySave.resolve(receipt)
    await waitFor(actor, (state) => state.matches('committed'))
    actor.send({ type: 'CONFIRM_SUBMIT' })
    expect(submit).toHaveBeenCalledTimes(2)
  })

  it.each([
    { name: 'recipe-inferred groups', item: suggestMealItem('curry') },
    {
      name: 'manually entered groups',
      item: { ...suggestMealItem(), groups: ['vegetable'] as const, groupsConfirmed: true },
    },
    {
      name: 'explicitly confirmed empty groups',
      item: { ...suggestMealItem(), groupsConfirmed: true },
    },
  ])('skips the warning for $name', async ({ item }) => {
    const { actor, services } = start()
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    actor.send({
      type: 'RECORD_CHANGED',
      value: { slot: 'dinner', source: 'home', items: [{ ...item, groups: [...item.groups] }] },
    })
    actor.send({ type: 'SUBMIT' })
    expect(actor.getSnapshot().matches('submitting')).toBe(true)
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledTimes(1)
  })

  it.each([{ candidates: [] }, { candidates: ['curry'] }])(
    'keeps recognition active during the warning and never auto-submits its late result %j',
    async ({ candidates }) => {
      const recognition = pending<FoodRecognitionResult>()
      let signal!: AbortSignal
      const { actor, services } = start({
        recognizeFood: async (_photo, nextSignal) => {
          signal = nextSignal
          return recognition.promise
        },
      })
      actor.send({ type: 'PHOTO_SELECTED', file: photo() })
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
      actor.send({ type: 'NEXT' })
      actor.send({ type: 'SUBMIT' })
      expect(
        actor
          .getSnapshot()
          .matches({ editing: { navigation: 'confirmNutrition', media: 'recognizing' } }),
      ).toBe(true)
      expect(signal.aborted).toBe(false)
      recognition.resolve(recognized(candidates))
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
      expect(
        actor
          .getSnapshot()
          .matches({ editing: { navigation: candidates.length ? 'serve' : 'confirmNutrition' } }),
      ).toBe(true)
      expect(services.submit).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.operationId).toBeUndefined()
    },
  )

  it.each(['title', 'recipe'] as const)(
    'keeps recognition running across screens and protects a manual %s edit',
    async (edited) => {
      const recognition = pending<FoodRecognitionResult>()
      let signal!: AbortSignal
      const { actor } = start({
        recognizeFood: async (_photo, nextSignal) => {
          signal = nextSignal
          return recognition.promise
        },
      })
      actor.send({ type: 'PHOTO_SELECTED', file: photo() })
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
      actor.send({ type: 'NEXT' })
      actor.send({ type: 'BACK' })
      actor.send({ type: 'NEXT' })
      expect(signal.aborted).toBe(false)
      if (edited === 'title') actor.send({ type: 'TITLE_CHANGED', title: '自分の料理' })
      else actor.send({ type: 'RECIPE_CHANGED', recipeId: 'onigiri' })
      recognition.resolve(recognized(['curry']))
      await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
      expect(actor.getSnapshot().context).toMatchObject({
        photo: 'photo:meal.jpg',
        candidates: ['curry'],
        title: edited === 'title' ? '自分の料理' : '',
        recipeId: edited === 'recipe' ? 'onigiri' : '',
      })
      expect(actor.getSnapshot().matches({ editing: { navigation: 'serve' } })).toBe(true)
    },
  )

  it('preserves the draft while selecting a recipe and keeps recognition independent', async () => {
    const recognition = pending<FoodRecognitionResult>()
    const { actor, services } = start({ recognizeFood: () => recognition.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'TITLE_CHANGED', title: '今日のお昼' })
    actor.send({ type: 'OPEN_RECIPES' })
    expect(
      actor.getSnapshot().matches({ editing: { navigation: 'recipes', media: 'recognizing' } }),
    ).toBe(true)
    actor.send({ type: 'SUBMIT' })
    expect(services.submit).not.toHaveBeenCalled()
    actor.send({ type: 'RECIPE_SELECTED', recipeId: 'onigiri' })
    recognition.resolve(recognized(['curry']))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().matches({ editing: { navigation: 'serve' } })).toBe(true)
    expect(actor.getSnapshot().context).toMatchObject({
      photo: 'photo:meal.jpg',
      title: '今日のお昼',
      recipeId: 'onigiri',
      candidates: ['curry'],
    })
    actor.send({ type: 'OPEN_RECIPES' })
    actor.send({ type: 'BACK' })
    expect(actor.getSnapshot().matches({ editing: { navigation: 'serve' } })).toBe(true)
    expect(actor.getSnapshot().context.recipeId).toBe('onigiri')
  })

  it('aborts replaced recognition and ignores its late answer', async () => {
    const oldRecognition = pending<FoodRecognitionResult>()
    const latestRecognition = pending<FoodRecognitionResult>()
    const signals: AbortSignal[] = []
    const { actor } = start({
      recognizeFood: async (image, signal) => {
        signals.push(signal)
        return image === 'photo:first.jpg' ? oldRecognition.promise : latestRecognition.promise
      },
    })
    actor.send({ type: 'PHOTO_SELECTED', file: photo('first.jpg') })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'PHOTO_SELECTED', file: photo('second.jpg') })
    await waitFor(
      actor,
      (state) =>
        state.matches({ editing: { media: 'recognizing' } }) &&
        state.context.photo === 'photo:second.jpg',
    )
    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    oldRecognition.resolve(recognized(['curry']))
    latestRecognition.resolve(recognized(['onigiri']))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.recipeId).toBe('onigiri')
    expect(actor.getSnapshot().context.candidates).toEqual(['onigiri'])
  })

  it('ignores an obsolete photo resize even when it cannot be interrupted', async () => {
    const oldResize = pending<string>()
    const nextResize = pending<string>()
    const recognizeFood = vi.fn(async () => recognized(['onigiri']))
    const { actor } = start({
      resizePhoto: (file) => (file.name === 'first.jpg' ? oldResize.promise : nextResize.promise),
      recognizeFood,
    })
    actor.send({ type: 'PHOTO_SELECTED', file: photo('first.jpg') })
    actor.send({ type: 'PHOTO_SELECTED', file: photo('second.jpg') })
    nextResize.resolve('second-photo')
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    oldResize.resolve('first-photo')
    await oldResize.promise
    expect(actor.getSnapshot().context.photo).toBe('second-photo')
    expect(recognizeFood).toHaveBeenCalledTimes(1)
  })

  it('switches to a sample without losing an explicit recipe or accepting an old photo result', async () => {
    const recognition = pending<FoodRecognitionResult>()
    let signal!: AbortSignal
    const { actor } = start(
      {
        recognizeFood: async (_photo, nextSignal) => {
          signal = nextSignal
          return recognition.promise
        },
      },
      { recipeId: 'onigiri' },
    )
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    expect(signal.aborted).toBe(true)
    recognition.resolve(recognized(['curry']))
    await recognition.promise
    expect(actor.getSnapshot().matches({ editing: { navigation: 'serve', media: 'idle' } })).toBe(
      true,
    )
    expect(actor.getSnapshot().context).toMatchObject({
      sample: true,
      photo: 'data:image/jpeg;base64,c2FtcGxl',
      candidates: [],
      recipeId: 'onigiri',
    })
  })

  it('cancels a draft and its recognition without committing', async () => {
    const recognition = pending<FoodRecognitionResult>()
    let signal!: AbortSignal
    const { actor, services } = start({
      recognizeFood: async (_photo, nextSignal) => {
        signal = nextSignal
        return recognition.promise
      },
    })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'CANCEL' })
    expect(signal.aborted).toBe(true)
    actor.send({ type: 'SUBMIT' })
    recognition.resolve(recognized(['curry']))
    await recognition.promise
    expect(actor.getSnapshot().matches('cancelled')).toBe(true)
    expect(actor.getSnapshot().context.receipt).toBeUndefined()
    expect(services.submit).not.toHaveBeenCalled()
  })

  it('preserves a rejected draft and retries the same operation once at a time', async () => {
    const firstSave = pending<FeedReceipt>()
    const retrySave = pending<FeedReceipt>()
    const submit = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => retrySave.promise)
    const { actor } = start({ submit })
    actor.send({ type: 'USE_SAMPLE' })
    await waitFor(actor, (state) =>
      state.matches({ editing: { navigation: 'serve', media: 'idle' } }),
    )
    actor.send({ type: 'TITLE_CHANGED', title: '  お昼ごはん  ' })
    actor.send({ type: 'RECIPE_CHANGED', recipeId: 'curry' })
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'CANCEL' })
    expect(actor.getSnapshot().matches('submitting')).toBe(true)
    expect(actor.getSnapshot().context.receipt).toBeUndefined()
    expect(submit).toHaveBeenCalledTimes(1)
    firstSave.reject(new Error('保存に失敗しました'))
    await waitFor(actor, (state) => state.matches({ editing: { navigation: 'serve' } }))
    expect(actor.getSnapshot().context).toMatchObject({
      error: '保存に失敗しました',
      title: '  お昼ごはん  ',
      recipeId: 'curry',
      sample: true,
      operationId: 'operation-1',
    })
    expect(actor.getSnapshot().context.receipt).toBeUndefined()
    actor.send({ type: 'SUBMIT' })
    expect(submit).toHaveBeenCalledTimes(2)
    expect(submit.mock.calls[1]).toEqual(submit.mock.calls[0])
    retrySave.resolve(receipt)
    await waitFor(actor, (state) => state.matches('committed'))
    actor.send({ type: 'SUBMIT' })
    expect(submit).toHaveBeenCalledTimes(2)
  })

  it('uses a new operation for an edited retry and allows recognition failure', async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error('通信できませんでした'))
      .mockResolvedValueOnce(receipt)
    const { actor } = start({
      submit,
      recognizeFood: async () => {
        throw new Error('AI unavailable')
      },
    })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'failed' } }))
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'CONFIRM_SUBMIT' })
    await waitFor(actor, (state) => state.matches({ editing: { navigation: 'serve' } }))
    actor.send({ type: 'TITLE_CHANGED', title: '手で選んだごはん' })
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'CONFIRM_SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(submit.mock.calls.map((call) => call[1])).toEqual(['operation-1', 'operation-2'])
    expect(submit.mock.calls[1][0].photo).toBe('photo:meal.jpg')
    expect(submit.mock.calls[1][0].title).toBe('手で選んだごはん')
  })

  it('retains side dishes and manual groups after late recognition and an edited retry', async () => {
    const recognition = pending<FoodRecognitionResult>()
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error('保存できませんでした'))
      .mockResolvedValueOnce(receipt)
    const { actor } = start({ submit, recognizeFood: () => recognition.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'NEXT' })
    const value: MealRecordInput = {
      slot: 'lunch',
      source: 'home',
      items: [
        {
          name: '豆のごはん',
          groups: ['staple', 'protein'],
          groupsConfirmed: true,
          portion: 'regular',
        },
        { name: 'サラダ', groups: ['vegetable'], groupsConfirmed: true, portion: 'small' },
      ],
    }
    actor.send({ type: 'RECORD_CHANGED', value })
    recognition.resolve(recognized(['curry']))
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.mealRecord).toEqual(value)
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches({ editing: { navigation: 'serve' } }))
    expect(actor.getSnapshot().context.mealRecord).toEqual(value)
    actor.send({ type: 'RECORD_CHANGED', value: { ...value, slot: 'dinner' } })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(submit.mock.calls.map((call) => call[1])).toEqual(['operation-1', 'operation-2'])
    expect(submit.mock.calls[1][0]).toMatchObject({
      title: '豆のごはん',
      mealRecord: { ...value, slot: 'dinner' },
    })
  })

  it('shares a saved meal directly at the table without creating another record or photo upload', async () => {
    const { actor, services } = start(
      {},
      {
        targetId: 'mame',
        sharedMeal: {
          id: 'existing-meal',
          title: 'お昼のカレー',
          day: '2026-09-25',
          slot: 'lunch',
          source: 'home',
          items: [suggestMealItem('curry')],
        },
      },
    )
    expect(actor.getSnapshot().matches({ editing: { navigation: 'serve' } })).toBe(true)
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledExactlyOnceWith(
      { targetId: 'mame', title: 'お昼のカレー', sample: 'curry', mealRecordId: 'existing-meal' },
      'operation-1',
    )
  })

  it('shares a saved unclassified meal without asking for nutrition confirmation again', async () => {
    const { actor, services } = start(
      {},
      {
        targetId: 'mame',
        sharedMeal: {
          id: 'unknown-meal',
          title: '今日のごはん',
          day: '2026-09-25',
          slot: 'unknown',
          source: 'home',
          items: [suggestMealItem()],
        },
      },
    )
    actor.send({ type: 'SUBMIT' })
    expect(actor.getSnapshot().matches('submitting')).toBe(true)
    await waitFor(actor, (state) => state.matches('committed'))
    expect(services.submit).toHaveBeenCalledExactlyOnceWith(
      { targetId: 'mame', title: '今日のごはん', sample: 'rice', mealRecordId: 'unknown-meal' },
      'operation-1',
    )
  })
})
