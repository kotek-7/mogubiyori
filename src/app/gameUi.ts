import { createContext, useContext } from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { GameCommand } from '../../shared/game/commands'
import type { ItemKind, SpeciesId } from '../../shared/game/types'
import type { Dialog } from './dialogs/GameDialogs'

export type Page = 'room' | 'book' | 'album' | 'shop'
type Setter<T> = Dispatch<SetStateAction<T>>
type GameUi = {
  setDialog: Setter<Dialog | null>
  openMeal: (options?: { recipeId?: string; targetId?: SpeciesId; mealRecordId?: string }) => void
  showFriends: () => void
  showGrowthGuide: boolean
  dismissHomeGuide: () => void
  growthButton: RefObject<HTMLButtonElement | null>
  openProfile: () => void
  showMealGuide: boolean
  feedButton: RefObject<HTMLButtonElement | null>
  startTutorial: () => void
  bookKind: 'recipes' | 'friends'
  setBookKind: Setter<'recipes' | 'friends'>
  navigate: (page: Page) => void
  run: (command: GameCommand, onSuccess?: () => void) => void
  shopKind: ItemKind
  setShopKind: Setter<ItemKind>
}

// Only screen coordination lives here. Persisted data comes from GameSession.
const GameUiContext = createContext<GameUi | null>(null)
export const GameUiProvider = GameUiContext.Provider
export function useGameUi() {
  const value = useContext(GameUiContext)
  if (!value) throw new Error('GameUiProvider is missing')
  return value
}
