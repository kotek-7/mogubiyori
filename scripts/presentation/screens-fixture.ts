import {
  chooseStarter,
  claimLogin,
  initialGame,
  items,
  recipes,
  shiftDay,
  species,
  todayTokyo,
} from '../../src/app/game/browserGame'

/** Isolated fictional save data. No user account or production state is read. */
export function presentationSave() {
  const day = todayTokyo()
  const state = claimLogin(chooseStarter(initialGame(day), 'komugi'))
  state.tutorial = { version: 1, step: 4, status: 'completed', homeGuide: 'done' }
  state.xp = 720
  state.coins = 1240
  state.gems = 260
  state.companions = species.map((entry, index) => ({
    id: entry.id,
    xp: [720, 430, 240, 1050, 165, 350][index],
    joinedDay: shiftDay(day, -18 + index * 2),
  }))
  state.cards = recipes.filter((_, index) => index < 24 || index % 7 === 0).map((entry) => entry.id)
  state.owned = items.map((item) => item.id)
  state.equipped = { hat: 'none', neck: 'neck-none', bag: 'bag-none', room: 'plain' }
  const featured = [0, 8, 15, 22, 30, 45, 50, 72, 88].map((index) => recipes[index]).filter(Boolean)
  state.meals = featured.map((recipe, index) => ({
    id: `presentation-meal-${index}`,
    day: shiftDay(day, -index - 1),
    title: recipe.name,
    sample: recipe.sample,
    recipeId: recipe.id,
    targetId: species[index % species.length].id,
    xp: 45,
    coins: 30,
  }))
  return state
}
