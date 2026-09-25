import {
  chooseStarter,
  claimLogin,
  initialGame,
  recipes,
  species,
  shiftDay,
  todayTokyo,
  type GameState,
} from '../../src/app/game/browserGame'
import type { FoodGroup, MealRecord } from '../../shared/meals/types'
import { mealRecordSchema } from '../../shared/meals/schemas'

/** Seven fictional days, with an intentionally simple breakfast available to edit. */
function reportWeek(today: string): MealRecord[] {
  const dinners = [
    ['curry', ['staple', 'vegetable']],
    ['omurice', ['staple', 'protein', 'vegetable']],
    ['gratin', ['staple', 'vegetable', 'dairy']],
    ['tomato-pasta', ['staple', 'protein', 'vegetable']],
    ['fried-rice', ['staple', 'protein', 'vegetable']],
    ['cream-soup', ['vegetable', 'dairy']],
    ['tomato-pasta', ['staple', 'protein', 'vegetable']],
  ] as const
  return dinners.flatMap(([recipeId, groups], index): MealRecord[] => {
    const day = shiftDay(today, index - 6)
    const recipe = recipes.find((entry) => entry.id === recipeId)!
    const breakfastGroups: FoodGroup[] = index % 3 === 1 ? ['staple', 'protein'] : ['staple']
    return [
      {
        id: `presentation-${day}-breakfast`,
        day,
        title: index % 3 === 1 ? 'おにぎりとゆで卵' : '朝のおにぎり',
        slot: 'breakfast',
        source: 'home',
        items: [
          {
            name: index % 3 === 1 ? 'おにぎりとゆで卵' : 'おにぎり',
            recipeId: 'onigiri',
            groups: breakfastGroups,
            groupsConfirmed: true,
            portion: 'regular',
          },
        ],
      },
      {
        id: `presentation-${day}-dinner`,
        day,
        title: recipe.name,
        slot: 'dinner',
        source: 'home',
        items: [
          {
            name: recipe.name,
            recipeId,
            groups: [...groups],
            groupsConfirmed: true,
            portion: 'regular',
          },
          ...(index % 2 === 1
            ? [
                {
                  name: 'りんご',
                  groups: ['fruit'] as FoodGroup[],
                  groupsConfirmed: true,
                  portion: 'small' as const,
                },
              ]
            : []),
        ],
      },
    ]
  })
}

/** Fictional local data for repeatable presentation recordings. */
export function videoState(kind = 'regular'): GameState {
  const today = todayTokyo()
  const state = claimLogin(chooseStarter(initialGame(today), 'komugi'))
  state.tutorial = { version: 1, step: 4, status: 'completed', homeGuide: 'done' }
  state.coins = 1280
  state.gems = 180
  state.xp = 300
  state.companions = species.map((entry, index) => ({
    id: entry.id,
    xp: index === 0 ? 300 : [0, 600, 120, 300, 120, 0][index],
    joinedDay: today,
  }))
  state.visitors = []
  state.cards = recipes.slice(0, 30).map((entry) => entry.id)
  state.mealRecords = reportWeek(today).map((record) => mealRecordSchema.parse(record))
  state.meals = state.mealRecords.map((record) => {
    const recipe = recipes.find((entry) => entry.id === record.items[0].recipeId)!
    return {
      id: `shared-${record.id}`,
      mealRecordId: record.id,
      day: record.day,
      title: record.title,
      recipeId: recipe.id,
      sample: recipe.sample,
      targetId: 'komugi' as const,
      xp: 45,
      coins: 30,
    }
  })
  if (kind === 'growth') {
    state.xp = 100
    state.companions[0].xp = 100
    state.meals = []
    state.mealRecords = []
  }
  if (kind === 'forms') {
    state.xp = 1050
    state.companions[0].xp = 1050
  }
  if (kind === 'meal') {
    state.xp = 135
    state.companions[0].xp = 135
    state.cards = state.cards.filter((id) => id !== 'curry')
    state.meals = []
    state.mealRecords = []
  }
  return state
}
