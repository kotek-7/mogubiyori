import { BookOpen } from 'lucide-react'
import { recipes } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'
import { RecipeBrowser } from './RecipeBrowser'

export function RecipeBoard({
  state,
  onRecipe,
}: {
  state: GameState
  onRecipe: (id: string) => void
}) {
  const count = recipes.filter((recipe) => state.cards.includes(recipe.id)).length
  return (
    <div className="collection-screen">
      <div className="collection-heading">
        <div>
          <h2>料理カード</h2>
        </div>
        <span className="collection-count">
          <BookOpen size={17} />
          <strong>{count}</strong>
          <span>/ {recipes.length}</span>
        </span>
      </div>
      <RecipeBrowser state={state} onRecipe={onRecipe} />
    </div>
  )
}
