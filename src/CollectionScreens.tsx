import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Heart,
  Leaf,
  LockKeyhole,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { Pet } from './GameArt'
import { JourneyFrame } from './JourneyFrame'
import { recipes, species, stageOf, stageName } from './game'
import type { GameState, SpeciesId } from './game'
import { GrowthTrail } from './GrowthTrail'
import { RecipeBrowser } from './RecipeBrowser'
import { RecipeArt } from './RecipeArt'
import './collection.css'

const difficultyNames = ['かんたん', 'ひと工夫', 'じっくり']
const rarityNames = { common: 'ノーマル', rare: 'レア', special: 'スペシャル' }

export function StarterSelection({
  onChoose,
  busy = false,
}: {
  onChoose: (id: SpeciesId) => void
  busy?: boolean
}) {
  const [selected, setSelected] = useState<SpeciesId>('komugi')
  return (
    <JourneyFrame
      scene="choose"
      title="最初のなかまを選ぶ"
      footer={
        <>
          <button
            className="journey-primary starter-start"
            disabled={busy}
            onClick={() => onChoose(selected)}
          >
            この子とはじめる
            <ArrowRight size={18} />
          </button>
        </>
      }
    >
      <div className="starter-screen">
        <div className="starter-choices" role="group" aria-label="最初のなかま">
          {species.slice(0, 3).map((entry) => (
            <button
              key={entry.id}
              className={`starter-choice starter-${entry.id} ${selected === entry.id ? 'is-selected' : ''}`}
              aria-label={`${entry.name}を選ぶ`}
              aria-pressed={selected === entry.id}
              onClick={() => setSelected(entry.id)}
            >
              <span className="starter-check" aria-hidden="true">
                {selected === entry.id && <Check size={15} />}
              </span>
              <span className="starter-portrait">
                <Pet
                  species={entry.id}
                  stage={0}
                  mood={selected === entry.id ? 'happy' : 'hungry'}
                />
              </span>
              <strong>{entry.name}</strong>
            </button>
          ))}
        </div>
      </div>
    </JourneyFrame>
  )
}

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
          <h2>レシピカード</h2>
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

export function FriendsBoard({
  state,
  onSelect,
  onFeedVisitor,
}: {
  state: GameState
  onSelect: (id: SpeciesId) => void
  onFeedVisitor: (id: SpeciesId) => void
}) {
  const visitors = state.visitors.filter(
    (id) => !state.companions.some((friend) => friend.id === id),
  )
  return (
    <div className="collection-screen">
      <div className="collection-heading">
        <div>
          <h2>なかまたち</h2>
        </div>
        <span className="collection-count">
          <Heart size={17} />
          <strong>{state.companions.length}</strong>
          <span>/ {species.length}</span>
        </span>
      </div>
      {visitors.length > 0 && (
        <section className="friend-visitors" aria-label="遊びにきたなかま">
          <div className="friend-section-heading">
            <span>
              <Sparkles size={17} />
              お客さん
            </span>
          </div>
          <div className="friend-visitor-grid">
            {visitors.map((id) => {
              const visitor = species.find((entry) => entry.id === id)!
              return (
                <article key={id} className={`friend-visitor friend-${id}`}>
                  <div className="friend-visitor-portrait">
                    <Pet species={id} stage={0} mood="hungry" />
                  </div>
                  <h2>{visitor.name}</h2>
                  <button className="primary-button" onClick={() => onFeedVisitor(id)}>
                    <Utensils size={17} />
                    ごはんをあげる<span className="sr-only">：{visitor.name}</span>
                  </button>
                </article>
              )
            })}
          </div>
          <p className="friend-discovery-note">ごはんをあげると仲間になります。</p>
        </section>
      )}
      <div className="friend-board">
        {state.companions.map((companion) => {
          const entry = species.find((candidate) => candidate.id === companion.id)!
          const stage = stageOf(companion.xp)
          const active = state.activeId === companion.id
          return (
            <button
              key={companion.id}
              className={`friend-card friend-${companion.id} ${active ? 'is-active' : ''}`}
              onClick={() => onSelect(companion.id)}
              aria-label={`${entry.name}と暮らす`}
              aria-pressed={active}
            >
              <span className="friend-card-top">
                <strong>{entry.name}</strong>
                <span>
                  {active ? (
                    <>
                      <Check size={12} />
                      ひろばにいる
                    </>
                  ) : (
                    'ひろばに呼ぶ'
                  )}
                </span>
              </span>
              <span className="friend-current">
                <Pet species={companion.id} stage={stage} mood="happy" />
              </span>
              <span className="friend-growth-name">
                {stageName(stage)} · {stage + 1}/5
              </span>
              <GrowthTrail species={companion.id} stage={stage} />
            </button>
          )
        })}
      </div>
      {!visitors.length && state.companions.length < species.length && (
        <p className="friend-discovery-note">
          <Leaf size={16} />
          わんぱくに育つとお客さんが来ます。
        </p>
      )}
    </div>
  )
}

export function RecipeDetail({
  recipeId,
  state,
  onCook,
}: {
  recipeId: string
  state: GameState
  onCook: (id: string) => void
}) {
  const recipe = recipes.find((entry) => entry.id === recipeId)
  if (!recipe)
    return (
      <div className="recipe-detail-empty">
        <LockKeyhole size={36} />
        <p>レシピが見つかりませんでした。</p>
      </div>
    )
  return (
    <div
      className={`recipe-detail ${state.cards.includes(recipeId) ? 'is-acquired' : 'is-unacquired'}`}
    >
      <div className="recipe-detail-art">
        <RecipeArt recipe={recipe} />
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
    </div>
  )
}
