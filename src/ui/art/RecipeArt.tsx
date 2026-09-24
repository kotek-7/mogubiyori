import { DishArt } from './GameArt'
import type { Recipe } from '../../app/game/browserGame'

export function RecipeArt({
  recipe,
  sample,
  className = '',
}: {
  recipe?: Recipe
  sample?: string
  className?: string
}) {
  if (recipe?.artPath) {
    return (
      <img
        className={`dish-art ${className}`}
        src={`${import.meta.env.BASE_URL}${recipe.artPath.replace(/^\//, '')}`}
        alt={recipe.name}
        loading="lazy"
        decoding="async"
      />
    )
  }
  return <DishArt kind={recipe?.sample ?? sample ?? 'rice'} className={className} />
}
