import { Coins, Sparkles } from 'lucide-react'
import type { GameMeal } from '../../app/game/browserGame'
import { MealArtwork } from './MealArtwork'

export function MealDetail({ meal }: { meal: GameMeal }) {
  return (
    <div className="meal-view">
      <div className="meal-view-art">
        <MealArtwork meal={meal} />
      </div>
      <p>
        {new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(
          new Date(`${meal.day}T12:00:00+09:00`),
        )}
        のごはん
      </p>
      <div className="meal-rewards">
        <span>
          <Sparkles size={18} />+{meal.xp} XP
        </span>
        <span>
          <Coins size={18} />+{meal.coins}
        </span>
      </div>
    </div>
  )
}
