import type { GameState, Recipe } from '../../app/game/browserGame'
import { RecipeArt } from '../../ui/art/RecipeArt'
import { MealArtwork } from '../album/MealArtwork'
import { recipeMealMemories } from './recipeMealMemories'
import type { RecipeMealMemory } from './recipeMealMemories'

export function RecipeMealGallery({
  recipe,
  state,
  onOpenMemory,
}: {
  recipe: Recipe
  state: GameState
  onOpenMemory: (memory: RecipeMealMemory) => void
}) {
  const memories = recipeMealMemories(state, recipe.id)
  return (
    <section className="recipe-meal-gallery" aria-label="作った記録">
      <div className="recipe-meal-gallery-heading">
        <h3>作った記録</h3>
        <span>{memories.length}件</span>
      </div>
      {memories.length ? (
        <div className="recipe-meal-gallery-grid">
          {memories.map((memory) => (
            <button
              key={memory.key}
              type="button"
              className="recipe-meal-memory"
              aria-label={`${memory.day.replaceAll('-', '/')} ${memory.title}の記録を見る`}
              onClick={() => onOpenMemory(memory)}
            >
              <span className="recipe-meal-memory-photo" aria-hidden="true">
                {memory.meal ? <MealArtwork meal={memory.meal} /> : <RecipeArt recipe={recipe} />}
              </span>
              <time dateTime={memory.day}>{memory.day.replaceAll('-', '/')}</time>
              <strong>{memory.title}</strong>
            </button>
          ))}
        </div>
      ) : (
        <p className="recipe-meal-gallery-empty">この料理の記録はまだありません。</p>
      )}
    </section>
  )
}
