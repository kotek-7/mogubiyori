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
import type { FoodGroup, MealItem, MealSlot } from '../../shared/meals/types'
import { gameStateSchema } from '../../shared/game/schemas'

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
  const menu: { recipeId: string; groups: FoodGroup[] }[] = [
    { recipeId: 'curry', groups: ['staple', 'protein', 'vegetable'] },
    { recipeId: 'egg-rice', groups: ['staple', 'protein'] },
    { recipeId: 'onigiri', groups: ['staple'] },
    { recipeId: 'fried-rice', groups: ['staple', 'protein', 'vegetable'] },
    { recipeId: 'tomato-pasta', groups: ['staple', 'vegetable'] },
    { recipeId: 'tofu-soup', groups: ['protein', 'vegetable'] },
    { recipeId: 'omurice', groups: ['staple', 'protein', 'vegetable'] },
    { recipeId: 'cream-soup', groups: ['vegetable', 'dairy'] },
    { recipeId: 'miso-soup', groups: ['vegetable'] },
  ]
  state.meals = []
  state.mealRecords = []
  // These are fictional, explicitly entered food groups; the application derives its own scores.
  // No calories, quantities of nutrients, or recognition-derived health claims are invented.
  for (let offset = 1; offset <= 7; offset += 1) {
    for (const [slotIndex, slot] of (['dinner', 'lunch', 'breakfast'] as MealSlot[]).entries()) {
      const selected = menu[((offset - 1) * 2 + slotIndex) % menu.length]
      const recipe = recipes.find((entry) => entry.id === selected.recipeId)!
      const items: MealItem[] = [
        {
          name: recipe.name,
          recipeId: recipe.id,
          groups: [...selected.groups],
          portion: 'regular',
          groupsConfirmed: true,
        },
      ]
      if (slot === 'breakfast' && offset % 2 === 1)
        items.push({
          name: 'ヨーグルトとバナナ',
          groups: ['dairy', 'fruit'],
          portion: 'small',
          groupsConfirmed: true,
        })
      if (slot === 'lunch' && offset % 3 === 0)
        items.push({
          name: 'トマトのサラダ',
          groups: ['vegetable'],
          portion: 'small',
          groupsConfirmed: true,
        })
      const id = `presentation-record-${offset}-${slot}`
      const recordedDay = shiftDay(day, -offset)
      state.mealRecords.push({
        id,
        day: recordedDay,
        title: recipe.name,
        slot,
        source: 'home',
        items,
      })
      state.meals.push({
        id: `presentation-meal-${offset}-${slot}`,
        mealRecordId: id,
        day: recordedDay,
        title: recipe.name,
        sample: recipe.sample,
        recipeId: recipe.id,
        targetId: species[(offset + slotIndex) % species.length].id,
        xp: 45,
        coins: 30,
      })
    }
  }
  return gameStateSchema.parse(state)
}
