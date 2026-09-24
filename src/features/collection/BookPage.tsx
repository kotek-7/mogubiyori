import { VillageSign } from '../../ui/art/GameMotifs'
import { ChevronRight } from 'lucide-react'
import { RecipeBoard } from './RecipeBoard'
import { FriendsBoard } from '../companions/FriendsBoard'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'
import { CategoryPanel, CategoryTabs } from '../../ui/motion/CategoryTabs'

export function BookPage() {
  const { state } = useGameSession()
  const { bookKind, setBookKind, setDialog, navigate, openMeal, run } = useGameUi()

  return (
    <>
      <div className="play-page-heading">
        <h1>ずかん</h1>
        <VillageSign kind="book" />
      </div>
      <CategoryTabs
        label="ずかんのカテゴリ"
        value={bookKind}
        onChange={setBookKind}
        options={[
          { value: 'recipes', label: '料理カード' },
          { value: 'friends', label: 'なかま' },
        ]}
      />
      <CategoryPanel category={bookKind}>
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
      </CategoryPanel>
      <button className="quiet-button play-memories" onClick={() => navigate('album')}>
        ごはんの記録
        <ChevronRight size={14} />
      </button>
    </>
  )
}
