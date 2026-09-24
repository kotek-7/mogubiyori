import { DishArt } from '../../ui/art/GameArt'
import { MealArtwork } from './MealArtwork'
import { species } from '../../app/game/browserGame'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'

export function AlbumPage() {
  const { state } = useGameSession()
  const { setDialog, openMeal } = useGameUi()

  return (
    <>
      <div className="play-page-heading">
        <h1>ごはんの記録</h1>
        <span>{state.meals.length}件</span>
      </div>
      <div className="album-grid">
        {state.meals.map((meal) => (
          <button
            key={meal.id}
            className="memory-card"
            onClick={() => setDialog({ type: 'meal', meal })}
          >
            <div className="memory-photo">
              <MealArtwork meal={meal} />
              <span>{meal.day.slice(5).replace('-', '/')}</span>
            </div>
            <strong>{meal.title}</strong>
            <small>
              {species.find((s) => s.id === meal.targetId)?.name ?? 'こむぎ'} · +{meal.xp} XP
            </small>
          </button>
        ))}
      </div>
      {!state.meals.length && (
        <div className="empty-state">
          <DishArt kind="rice" />
          <h2>まだ記録がありません</h2>
          <button className="primary-button" onClick={() => openMeal()}>
            ごはんをあげる
          </button>
        </div>
      )}
    </>
  )
}
