import { Clock3, LockKeyhole, Sparkles, Utensils } from 'lucide-react'
import { recipes } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'
import { canViewRecipe } from '../../../shared/content/freeRecipes'
import { RecipeArt } from '../../ui/art/RecipeArt'
import { SubscriptionPrompt } from '../subscription/Subscription'
import { RecipeMealGallery } from './RecipeMealGallery'
import type { RecipeMealMemory } from './recipeMealMemories'

const difficultyNames = ['かんたん', 'ひと工夫', 'じっくり']
const rarityNames = { common: 'ノーマル', rare: 'レア', special: 'スペシャル' }

export function RecipeDetail({
  recipeId,
  state,
  onCook,
  onOpenMemory,
}: {
  recipeId: string
  state: GameState
  onCook: (id: string) => void
  onOpenMemory: (memory: RecipeMealMemory) => void
}) {
  const recipe = recipes.find((entry) => entry.id === recipeId)
  if (!recipe)
    return (
      <div className="recipe-detail-empty">
        <LockKeyhole size={36} />
        <p>レシピが見つかりませんでした。</p>
      </div>
    )
  if (!canViewRecipe(state, recipeId))
    return (
      <div className="recipe-detail-empty">
        <LockKeyhole size={36} />
        <SubscriptionPrompt reason="このレシピは有料プランで見られます。獲得済みの料理カードはそのまま残ります。" />
      </div>
    )
  return (
    <div
      className={`recipe-detail ${state.cards.includes(recipeId) ? 'is-acquired' : 'is-unacquired'}`}
    >
      <div className="recipe-detail-art">
        <RecipeArt recipe={recipe} silhouette={!state.cards.includes(recipeId)} />
        <span className={`recipe-rarity recipe-rarity-${recipe.rarity}`}>
          {rarityNames[recipe.rarity]}
        </span>
      </div>
      {recipe.description && <p className="recipe-detail-description">{recipe.description}</p>}
      <div className="recipe-detail-meta">
        <span>
          <Clock3 size={15} />
          {recipe.minutes}分
        </span>
        <span>{difficultyNames[recipe.difficulty - 1]}</span>
        <span>
          <Sparkles size={14} />
          {state.cards.includes(recipeId) ? 'カード獲得済み' : `初回カード +${recipe.reward}コイン`}
        </span>
      </div>
      <section className="recipe-detail-ingredients">
        <h3>材料{recipe.servings && `（${recipe.servings}人分）`}</h3>
        <ul>
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </section>
      {!!recipe.equipment?.length && (
        <section className="recipe-detail-equipment">
          <h3>使う道具</h3>
          <p>{recipe.equipment.join('・')}</p>
        </section>
      )}
      <section className="recipe-detail-steps">
        <h3>つくりかた</h3>
        <ol>
          {recipe.steps.map((step, index) => (
            <li key={index}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>
      {recipe.tip && (
        <section className="recipe-detail-tip">
          <h3>おいしくつくるコツ</h3>
          <p>{recipe.tip}</p>
        </section>
      )}
      <button className="primary-button full recipe-cook" onClick={() => onCook(recipe.id)}>
        <Utensils size={18} />
        この料理を記録する
      </button>
      {state.cards.includes(recipeId) && (
        <RecipeMealGallery recipe={recipe} state={state} onOpenMemory={onOpenMemory} />
      )}
    </div>
  )
}
