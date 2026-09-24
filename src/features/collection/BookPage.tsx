import { ChevronRight } from 'lucide-react'
import { RecipeBoard } from './RecipeBoard'
import { FriendsBoard } from '../companions/FriendsBoard'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'

export function BookPage() {
  const { state } = useGameSession()
  const { bookKind, setBookKind, setDialog, navigate, openMeal, run } = useGameUi()

  return (
    <>
      <div className="play-page-heading">
        <h1>図鑑</h1>
      </div>
      <div className="play-book-tabs" role="group" aria-label="ずかんのカテゴリ">
        <button aria-pressed={bookKind === 'recipes'} onClick={() => setBookKind('recipes')}>
          レシピカード
        </button>
        <button aria-pressed={bookKind === 'friends'} onClick={() => setBookKind('friends')}>
          なかま
        </button>
      </div>
      {bookKind === 'recipes' ? (
        <RecipeBoard
          state={state}
          onRecipe={(recipeId) => setDialog({ type: 'recipe', recipeId })}
        />
      ) : (
        <FriendsBoard
          state={state}
          onSelect={(id) => {
            run({ type: 'selectCompanion', id }, () => navigate('room'))
          }}
          onFeedVisitor={(targetId) => openMeal({ targetId })}
        />
      )}
      <button className="quiet-button play-memories" onClick={() => navigate('album')}>
        ごはんの記録
        <ChevronRight size={14} />
      </button>
    </>
  )
}
