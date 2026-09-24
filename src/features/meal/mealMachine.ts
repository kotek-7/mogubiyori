import { and, assign, fromPromise, not, setup, stateIn } from 'xstate'
import { recipes } from '../../../shared/content/catalog'
import type { FeedInput, SpeciesId } from '../../../shared/game/types'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { createOperationId } from '../../lib/operationId'

export type MealMachineInput = { targetId: SpeciesId; recipeId?: string }

type MealContext = {
  targetId: SpeciesId
  recipeId: string
  title: string
  photo?: string
  sample: boolean
  file?: File
  candidates: string[]
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
  | { type: 'NEXT' | 'BACK' | 'OPEN_RECIPES' | 'USE_SAMPLE' | 'SUBMIT' | 'CANCEL' }

export type MealServices = {
  resizePhoto: (file: File) => Promise<string>
  recognizeFood: (photo: string, signal: AbortSignal) => Promise<string[]>
  submit: (input: FeedInput, operationId: string) => Promise<FeedReceipt>
  createOperationId?: () => string
}

function feedInput(context: MealContext): FeedInput {
  const recipe = recipes.find((entry) => entry.id === context.recipeId)
  return {
    targetId: context.targetId,
    title: context.title.trim() || recipe?.name || '今日のごはん',
    photo: context.photo,
    sample: recipe?.sample ?? 'rice',
    recipeId: context.recipeId || undefined,
  }
}

function sameMeal(previous: FeedInput | undefined, next: FeedInput) {
  return (
    previous !== undefined &&
    previous.targetId === next.targetId &&
    previous.title === next.title &&
    previous.photo === next.photo &&
    previous.sample === next.sample &&
    previous.recipeId === next.recipeId
  )
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
      recognize: fromPromise(({ input, signal }: { input: string; signal: AbortSignal }) =>
        services.recognizeFood(input, signal),
      ),
      submit: fromPromise(({ input }: { input: { meal: FeedInput; operationId: string } }) =>
        services.submit(input.meal, input.operationId),
      ),
    },
    guards: {
      hasMeal: ({ context }) => Boolean(context.photo || context.sample),
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
      recipeId: input.recipeId ?? '',
      title: '',
      sample: false,
      candidates: [],
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
            actions: assign({
              recipeId: ({ event }) => event.recipeId,
              recipeChosen: true,
            }),
          },
          TITLE_CHANGED: {
            actions: assign({ title: ({ event }) => event.title, titleEdited: true }),
          },
          SUBMIT: {
            guard: and([
              'hasMeal',
              stateIn({ editing: { navigation: 'serve' } }),
              not(stateIn({ editing: { media: 'resizing' } })),
            ]),
            target: 'submitting',
            actions: 'prepareSubmission',
          },
          CANCEL: 'cancelled',
        },
        states: {
          navigation: {
            initial: 'photo',
            on: { USE_SAMPLE: '.serve' },
            states: {
              photo: {
                on: {
                  NEXT: {
                    guard: and(['hasMeal', not(stateIn({ editing: { media: 'resizing' } }))]),
                    target: 'serve',
                  },
                },
              },
              serve: { on: { BACK: 'photo', OPEN_RECIPES: 'recipes' } },
              recipes: {
                on: {
                  BACK: 'serve',
                  RECIPE_SELECTED: {
                    target: 'serve',
                    actions: assign({
                      recipeId: ({ event }) => event.recipeId,
                      recipeChosen: true,
                    }),
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
                  file: event.file,
                  candidates: [],
                  error: '',
                  recipeId: context.recipeChosen ? context.recipeId : '',
                })),
              },
              USE_SAMPLE: {
                target: '.idle',
                actions: assign(({ context }) => ({
                  photo: undefined,
                  file: undefined,
                  sample: true,
                  candidates: [],
                  error: '',
                  recipeId: context.recipeChosen ? context.recipeId : '',
                })),
              },
            },
            states: {
              idle: {},
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
                    actions: assign(({ context, event }) => ({
                      candidates: event.output,
                      recipeId:
                        event.output[0] && !context.recipeChosen && !context.titleEdited
                          ? event.output[0]
                          : context.recipeId,
                    })),
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
