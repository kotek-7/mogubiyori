import { useQuery } from '@tanstack/react-query'
import type { GameMeal } from '../../shared/types'
import { useGameSession } from '../app/useGameSession'
import { RecipeArt } from '../RecipeArt'
import { recipeById } from '../../shared/catalog'

export function MealArtwork({ meal }: { meal: GameMeal }) {
  const { gateway } = useGameSession()
  const photo = useQuery({
    queryKey: ['photo', gateway.identity, meal.photoId],
    queryFn: ({ signal }) => gateway.photoUrl!(meal.photoId!, signal),
    enabled: Boolean(meal.photoId && gateway.photoUrl),
    staleTime: 240_000,
    gcTime: 300_000,
    retry: false,
  })
  const source = meal.photo ?? photo.data
  return source ? (
    <img src={source} alt={meal.title} />
  ) : (
    <RecipeArt recipe={recipeById(meal.recipeId)} sample={meal.sample} />
  )
}
