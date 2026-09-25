import { afterEach, describe, expect, it, vi } from 'vitest'
import { createActor, waitFor } from 'xstate'
import type { AnyActorRef } from 'xstate'
import { createMealMachine } from './mealMachine'
import type { MealMachineInput, MealServices } from './mealMachine'
import { chooseStarter, feed, initialGame } from '../../app/game/browserGame'
import { createFeedReceipt } from '../../../shared/game/receipt'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { suggestMealItem } from '../../../shared/meals/analysis'
import type { MealRecordInput } from '../../../shared/meals/types'

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
    recognizeFood: async () => [],
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

const photo = (name = 'meal.jpg') => new File(['photo'], name, { type: 'image/jpeg' })

describe('meal draft workflow', () => {
  it('submits a recognized generic dish without assigning a recipe card', async () => {
    const { actor, services } = start({ recognizeFood: async () => ['generic-pasta'] })
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
    const recognition = pending<string[]>()
    const { actor } = start({ recognizeFood: () => recognition.promise })
    actor.send({ type: 'PHOTO_SELECTED', file: photo() })
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognizing' } }))
    actor.send({ type: 'NEXT' })
    actor.send({ type: 'OPEN_RECIPES' })
    actor.send({ type: 'RECIPE_SELECTED', recipeId: 'generic-hamburg' })
    recognition.resolve(['curry'])
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context).toMatchObject({ recipeId: '', dishId: 'generic-hamburg' })
    actor.send({ type: 'RECIPE_CHANGED', recipeId: 'curry' })
    expect(actor.getSnapshot().context).toMatchObject({ recipeId: 'curry', dishId: undefined })
  })

  it('clears an automatic generic classification when its photo is replaced', async () => {
    const { actor } = start({
      recognizeFood: async (image) => (image.includes('first') ? ['generic-pasta'] : []),
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

  it.each(['title', 'recipe'] as const)(
    'keeps recognition running across screens and protects a manual %s edit',
    async (edited) => {
      const recognition = pending<string[]>()
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
      recognition.resolve(['curry'])
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
    const recognition = pending<string[]>()
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
    recognition.resolve(['curry'])
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
    const oldRecognition = pending<string[]>()
    const latestRecognition = pending<string[]>()
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
    oldRecognition.resolve(['curry'])
    latestRecognition.resolve(['onigiri'])
    await waitFor(actor, (state) => state.matches({ editing: { media: 'recognized' } }))
    expect(actor.getSnapshot().context.recipeId).toBe('onigiri')
    expect(actor.getSnapshot().context.candidates).toEqual(['onigiri'])
  })

  it('ignores an obsolete photo resize even when it cannot be interrupted', async () => {
    const oldResize = pending<string>()
    const nextResize = pending<string>()
    const recognizeFood = vi.fn(async () => ['onigiri'])
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
    const recognition = pending<string[]>()
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
    expect(signal.aborted).toBe(true)
    recognition.resolve(['curry'])
    await recognition.promise
    expect(actor.getSnapshot().matches({ editing: { navigation: 'serve', media: 'idle' } })).toBe(
      true,
    )
    expect(actor.getSnapshot().context).toMatchObject({
      sample: true,
      photo: undefined,
      candidates: [],
      recipeId: 'onigiri',
    })
  })

  it('cancels a draft and its recognition without committing', async () => {
    const recognition = pending<string[]>()
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
    recognition.resolve(['curry'])
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
    await waitFor(actor, (state) => state.matches({ editing: { navigation: 'serve' } }))
    actor.send({ type: 'TITLE_CHANGED', title: '手で選んだごはん' })
    actor.send({ type: 'SUBMIT' })
    await waitFor(actor, (state) => state.matches('committed'))
    expect(submit.mock.calls.map((call) => call[1])).toEqual(['operation-1', 'operation-2'])
    expect(submit.mock.calls[1][0].photo).toBe('photo:meal.jpg')
    expect(submit.mock.calls[1][0].title).toBe('手で選んだごはん')
  })

  it('retains side dishes and manual groups after late recognition and an edited retry', async () => {
    const recognition = pending<string[]>()
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
    recognition.resolve(['curry'])
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
})
