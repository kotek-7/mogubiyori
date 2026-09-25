import {
  chooseStarter,
  claimLogin,
  demoGame,
  initialGame,
  recipes,
  species,
  todayTokyo,
  type GameState,
} from '../../src/app/game/browserGame'

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
  state.meals = demoGame(today).meals.map((meal, index) => ({
    ...meal,
    recipeId: ['fried-rice', 'cream-soup', 'tomato-pasta', 'onigiri', 'tofu-soup', 'egg-rice'][
      index
    ],
  }))
  if (kind === 'growth') {
    state.xp = 100
    state.companions[0].xp = 100
    state.meals = []
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
  }
  return state
}
