import { and, assign, fromPromise, not, or, raise, setup, stateIn } from 'xstate'
import { recipeById } from '../../../shared/content/catalog'
import { genericDishById } from '../../../shared/content/dishes'
import type { FeedInput, SpeciesId } from '../../../shared/game/types'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { createOperationId } from '../../lib/operationId'
import { suggestMealItem } from '../../../shared/meals/analysis'
import type { FoodRecognitionResult } from '../../../shared/meals/recognition'
import type { MealItem, MealRecord, MealRecordInput } from '../../../shared/meals/types'

export type MealMachineInput = { targetId: SpeciesId; recipeId?: string; sharedMeal?: MealRecord }

type MealContext = {
  targetId: SpeciesId
  recipeId: string
  dishId?: string
  title: string
  mealRecord: MealRecordInput
  mealRecordId?: string
  photo?: string
  sample: boolean
  file?: File
  candidates: string[]
  recognizedItemCount: number
  primaryEdits: { name: boolean; groups: boolean; portion: boolean }
  sideItemsEdited: boolean
  automaticSideItems: MealItem[]
  recipeChosen: boolean
  titleEdited: boolean
  error: string
  operationId?: string
  submittedInput?: FeedInput
  receipt?: FeedReceipt
}

type MealEvent =
  | { type: 'PHOTO_SELECTED'; file: File }
  | { type: 'RECIPE_CHANGED'; recipeId: string }
  | { type: 'RECIPE_SELECTED'; recipeId: string }
  | { type: 'TITLE_CHANGED'; title: string }
  | { type: 'RECORD_CHANGED'; value: MealRecordInput }
  | { type: 'TARGET_CHANGED'; targetId: SpeciesId }
  | {
      type:
        | 'NEXT'
        | 'BACK'
        | 'OPEN_RECIPES'
        | 'USE_SAMPLE'
        | 'SAMPLE_LOADED'
        | 'SUBMIT'
        | 'CONFIRM_SUBMIT'
        | 'CANCEL'
    }

export type MealServices = {
  resizePhoto: (file: File) => Promise<string>
  loadSamplePhoto: (signal: AbortSignal) => Promise<string>
  recognizeFood: (photo: string, signal: AbortSignal) => Promise<FoodRecognitionResult>
  submit: (input: FeedInput, operationId: string) => Promise<FeedReceipt>
  createOperationId?: () => string
}

function feedInput(context: MealContext): FeedInput {
  const recipe = recipeById(context.recipeId)
  const dish = genericDishById(context.dishId)
  const choice = recipe ?? dish
  if (context.mealRecordId)
    return {
      targetId: context.targetId,
      title: context.title,
      sample: choice?.sample ?? 'rice',
      mealRecordId: context.mealRecordId,
    }
  return {
    targetId: context.targetId,
    title:
      context.title.trim() ||
      context.mealRecord.items[0]?.name.trim() ||
      choice?.name ||
      '今日のごはん',
    photo: context.photo,
    sample: choice?.sample ?? 'rice',
    recipeId: context.recipeId || undefined,
    ...(dish ? { dishId: dish.id } : {}),
    mealRecord: context.mealRecord,
  }
}

function sameMeal(previous: FeedInput | undefined, next: FeedInput) {
  return (
    previous !== undefined &&
    previous.targetId === next.targetId &&
    previous.title === next.title &&
    previous.photo === next.photo &&
    previous.sample === next.sample &&
    previous.recipeId === next.recipeId &&
    previous.dishId === next.dishId &&
    previous.mealRecordId === next.mealRecordId &&
    JSON.stringify(previous.mealRecord) === JSON.stringify(next.mealRecord)
  )
}

function selection(id: string) {
  const dish = genericDishById(id)
  return { recipeId: dish ? '' : id, dishId: dish?.id }
}

function selectForRecord(context: MealContext, id: string) {
  return {
    ...selection(id),
    mealRecord: {
      ...context.mealRecord,
      items: [
        { ...suggestMealItem(id), portion: context.mealRecord.items[0]?.portion ?? 'unknown' },
        ...context.mealRecord.items.slice(1),
      ],
    },
  }
}

function resetPhotoSuggestions(context: MealContext) {
  const current = context.mealRecord.items[0]
  const primary = suggestMealItem(context.recipeChosen ? (context.dishId ?? context.recipeId) : '')
  return {
    candidates: [],
    recognizedItemCount: 0,
    automaticSideItems: [],
    ...selection(context.recipeChosen ? (context.dishId ?? context.recipeId) : ''),
    mealRecord: {
      ...context.mealRecord,
      items: [
        {
          ...primary,
          ...(context.primaryEdits.name ? { name: current.name } : {}),
          ...(context.primaryEdits.groups
            ? { groups: current.groups, groupsConfirmed: current.groupsConfirmed }
            : {}),
          ...(context.primaryEdits.portion ? { portion: current.portion } : {}),
        },
        ...context.mealRecord.items
          .slice(1)
          .filter((item) => !context.automaticSideItems.includes(item)),
      ],
    },
  }
}

function applyPhotoSuggestions(context: MealContext, result: FoodRecognitionResult) {
  const current = context.mealRecord.items[0]
  const detected = result.items[0]
  const id = detected?.recipeId ?? detected?.dishId ?? result.candidates[0]
  const canChoose = !context.recipeChosen && !context.titleEdited && !context.primaryEdits.name
  const suggestion = detected ?? (id ? suggestMealItem(id) : undefined)
  const chosen = selection(id ?? '')
  const keepGroups =
    context.primaryEdits.groups || context.recipeChosen || (!canChoose && !detected)
  const primary = suggestion
    ? {
        ...(canChoose
          ? { ...suggestion, recipeId: chosen.recipeId || undefined, dishId: chosen.dishId }
          : current),
        groups: keepGroups ? current.groups : suggestion.groups,
        groupsConfirmed: keepGroups ? current.groupsConfirmed : suggestion.groupsConfirmed,
        // A candidates-only response has no estimate of the amount.
        portion: !detected || context.primaryEdits.portion ? current.portion : detected.portion,
      }
    : current
  const automaticSideItems = context.sideItemsEdited
    ? context.automaticSideItems
    : result.items.slice(1)
  return {
    candidates: result.candidates,
    recognizedItemCount: result.items.length,
    ...(canChoose && suggestion ? chosen : {}),
    automaticSideItems,
    mealRecord: {
      ...context.mealRecord,
      items: [
        primary,
        ...(context.sideItemsEdited ? context.mealRecord.items.slice(1) : automaticSideItems),
      ],
    },
  }
}

/** Owns the draft and its work, never the saved game or its query cache. */
export function createMealMachine(services: MealServices) {
  return setup({
    types: {
      context: {} as MealContext,
      input: {} as MealMachineInput,
      events: {} as MealEvent,
    },
    actors: {
      resize: fromPromise(({ input }: { input: File }) => services.resizePhoto(input)),
      loadSample: fromPromise<string>(({ signal }) => services.loadSamplePhoto(signal)),
      recognize: fromPromise(({ input, signal }: { input: string; signal: AbortSignal }) =>
        services.recognizeFood(input, signal),
      ),
      submit: fromPromise(({ input }: { input: { meal: FeedInput; operationId: string } }) =>
        services.submit(input.meal, input.operationId),
      ),
    },
    guards: {
      hasMeal: ({ context }) => Boolean(context.photo || context.sample),
      mediaReady: not(
        or([
          stateIn({ editing: { media: 'resizing' } }),
          stateIn({ editing: { media: 'loadingSample' } }),
        ]),
      ),
      isSharedMeal: ({ context }) => Boolean(context.mealRecordId),
      needsNutritionConfirmation: ({ context }) =>
        !context.mealRecordId &&
        !context.mealRecord.items.some((item) => item.groupsConfirmed || item.groups.length > 0),
    },
    actions: {
      prepareSubmission: assign(({ context }) => {
        const meal = feedInput(context)
        return {
          submittedInput: meal,
          operationId:
            context.operationId && sameMeal(context.submittedInput, meal)
              ? context.operationId
              : (services.createOperationId ?? createOperationId)(),
          error: '',
        }
      }),
    },
  }).createMachine({
    id: 'meal',
    context: ({ input }) => ({
      targetId: input.targetId,
      recipeId: input.sharedMeal?.items[0]?.recipeId ?? input.recipeId ?? '',
      dishId: input.sharedMeal?.items[0]?.dishId,
      title: input.sharedMeal?.title ?? '',
      mealRecordId: input.sharedMeal?.id,
      mealRecord: input.sharedMeal
        ? {
            slot: input.sharedMeal.slot,
            source: input.sharedMeal.source,
            items: input.sharedMeal.items,
          }
        : { slot: 'unknown', source: 'home', items: [suggestMealItem(input.recipeId)] },
      sample: Boolean(input.sharedMeal),
      candidates: [],
      recognizedItemCount: 0,
      primaryEdits: { name: false, groups: false, portion: false },
      sideItemsEdited: false,
      automaticSideItems: [],
      recipeChosen: Boolean(input.recipeId),
      titleEdited: false,
      error: '',
    }),
    initial: 'editing',
    states: {
      editing: {
        type: 'parallel',
        on: {
          RECIPE_CHANGED: {
            actions: assign(({ context, event }) => ({
              ...selectForRecord(context, event.recipeId),
              recipeChosen: true,
            })),
          },
          RECORD_CHANGED: {
            actions: assign(({ context, event }) => ({
              mealRecord: event.value,
              primaryEdits: {
                name:
                  context.primaryEdits.name ||
                  context.mealRecord.items[0].name !== event.value.items[0].name,
                groups:
                  context.primaryEdits.groups ||
                  JSON.stringify(context.mealRecord.items[0].groups) !==
                    JSON.stringify(event.value.items[0].groups) ||
                  context.mealRecord.items[0].groupsConfirmed !==
                    event.value.items[0].groupsConfirmed,
                portion:
                  context.primaryEdits.portion ||
                  context.mealRecord.items[0].portion !== event.value.items[0].portion,
              },
              sideItemsEdited:
                context.sideItemsEdited ||
                JSON.stringify(context.mealRecord.items.slice(1)) !==
                  JSON.stringify(event.value.items.slice(1)),
              // Unchanged rows keep their identity; an edited side dish becomes manual.
              automaticSideItems: context.automaticSideItems.filter((item) =>
                event.value.items.includes(item),
              ),
            })),
          },
          TARGET_CHANGED: {
            actions: assign({ targetId: ({ event }) => event.targetId }),
          },
          TITLE_CHANGED: {
            actions: assign({ title: ({ event }) => event.title, titleEdited: true }),
          },
          CANCEL: 'cancelled',
        },
        states: {
          navigation: {
            initial: 'start',
            on: { SAMPLE_LOADED: '.serve' },
            states: {
              start: { always: [{ guard: 'isSharedMeal', target: 'serve' }, { target: 'photo' }] },
              photo: {
                on: {
                  NEXT: {
                    guard: and(['hasMeal', 'mediaReady']),
                    target: 'serve',
                  },
                },
              },
              serve: {
                on: {
                  BACK: 'photo',
                  OPEN_RECIPES: 'recipes',
                  SUBMIT: [
                    {
                      guard: and(['hasMeal', 'mediaReady', 'needsNutritionConfirmation']),
                      target: 'confirmNutrition',
                    },
                    {
                      guard: and(['hasMeal', 'mediaReady']),
                      target: '#meal.submitting',
                      actions: 'prepareSubmission',
                    },
                  ],
                },
              },
              confirmNutrition: {
                // A late recognition result may make the warning unnecessary.
                // Return to the draft; it never authorizes a submission itself.
                always: { guard: not('needsNutritionConfirmation'), target: 'serve' },
                on: {
                  BACK: 'serve',
                  CONFIRM_SUBMIT: {
                    guard: and(['hasMeal', 'mediaReady']),
                    target: '#meal.submitting',
                    actions: 'prepareSubmission',
                  },
                },
              },
              recipes: {
                on: {
                  BACK: 'serve',
                  RECIPE_SELECTED: {
                    target: 'serve',
                    actions: assign(({ context, event }) => ({
                      ...selectForRecord(context, event.recipeId),
                      recipeChosen: true,
                    })),
                  },
                },
              },
            },
          },
          // Recognition lives across both screens. Leaving editing stops it.
          media: {
            initial: 'idle',
            on: {
              PHOTO_SELECTED: {
                target: '.resizing',
                reenter: true,
                actions: assign(({ context, event }) => ({
                  ...resetPhotoSuggestions(context),
                  file: event.file,
                  error: '',
                })),
              },
              USE_SAMPLE: {
                target: '.loadingSample',
                reenter: true,
                actions: assign({
                  file: undefined,
                  candidates: [],
                  recognizedItemCount: 0,
                  error: '',
                }),
              },
            },
            states: {
              idle: {},
              loadingSample: {
                invoke: {
                  src: 'loadSample',
                  onDone: {
                    target: 'idle',
                    actions: [
                      assign(({ context, event }) => ({
                        ...resetPhotoSuggestions(context),
                        photo: event.output,
                        sample: true,
                      })),
                      raise({ type: 'SAMPLE_LOADED' }),
                    ],
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      error: 'サンプル写真を読み込めませんでした。もう一度お試しください。',
                    }),
                  },
                },
              },
              resizing: {
                invoke: {
                  src: 'resize',
                  input: ({ context }) => context.file!,
                  onDone: {
                    target: 'recognizing',
                    actions: assign({
                      photo: ({ event }) => event.output,
                      sample: false,
                      file: undefined,
                    }),
                  },
                  onError: {
                    target: 'idle',
                    actions: assign({
                      file: undefined,
                      error: ({ event }) =>
                        event.error instanceof Error
                          ? event.error.message
                          : '写真を読み込めませんでした。',
                    }),
                  },
                },
              },
              recognizing: {
                invoke: {
                  src: 'recognize',
                  input: ({ context }) => context.photo!,
                  onDone: {
                    target: 'recognized',
                    actions: assign(({ context, event }) =>
                      applyPhotoSuggestions(context, event.output),
                    ),
                  },
                  onError: 'failed',
                },
              },
              recognized: {},
              failed: {},
            },
          },
        },
      },
      submitting: {
        invoke: {
          src: 'submit',
          input: ({ context }) => ({
            meal: context.submittedInput!,
            operationId: context.operationId!,
          }),
          onDone: {
            target: 'committed',
            actions: assign({ receipt: ({ event }) => event.output }),
          },
          onError: {
            target: '#meal.editing.navigation.serve',
            actions: assign({
              error: ({ event }) =>
                event.error instanceof Error
                  ? event.error.message
                  : 'ごはんを保存できませんでした。もう一度お試しください。',
            }),
          },
        },
      },
      committed: { type: 'final' },
      cancelled: { type: 'final' },
    },
  })
}
