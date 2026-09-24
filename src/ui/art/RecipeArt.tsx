import { DishArt } from './GameArt'
import { DiscoverySilhouette } from './DiscoverySilhouette'
import type { Recipe } from '../../app/game/browserGame'

export function RecipeArt({
  recipe,
  sample,
  silhouette = false,
  className = '',
}: {
  recipe?: Pick<Recipe, 'name' | 'sample' | 'artPath'>
  sample?: string
  silhouette?: boolean
  className?: string
}) {
  if (silhouette) {
    return (
      <DiscoverySilhouette className={`recipe-silhouette ${className}`}>
        {recipe?.artPath ? (
          <img
            className="dish-art"
            src={`${import.meta.env.BASE_URL}${recipe.artPath.replace('/assets/recipes/', '/assets/recipe-silhouettes/').replace(/^\//, '')}`}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <DishArt kind={recipe?.sample ?? sample ?? 'rice'} />
        )}
      </DiscoverySilhouette>
    )
  }
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
