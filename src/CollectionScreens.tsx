import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Leaf,
  LockKeyhole,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { DishArt, Pet } from './GameArt'
import { JourneyFrame } from './JourneyFrame'
import { recipes, species, stageOf, stageName } from './game'
import type { GameState, SpeciesId } from './game'
import { GrowthTrail } from './GrowthTrail'
import './collection.css'

const difficultyNames = ['かんたん', 'ひと工夫', 'じっくり']
const rarityNames = { common: 'ふつう', rare: 'レア', special: 'スペシャル' }

export function StarterSelection({ onChoose }: { onChoose: (id: SpeciesId) => void }) {
  const [selected, setSelected] = useState<SpeciesId>('komugi')
  const friend = species.find((entry) => entry.id === selected)!
  return (
    <JourneyFrame
      scene="choose"
      eyebrow="きみのごはんを、まっている。"
      title="はじめまして、だれにする？"
      subtitle="いっしょに暮らす子を、ひとり。"
      footer={
        <>
          <button className="journey-primary starter-start" onClick={() => onChoose(selected)}>
            この子とはじめる
            <ArrowRight size={18} />
          </button>
          <p className="starter-footnote">つくって、たべて。ふたりで育っていこう。</p>
          <a className="starter-expansion" href="/expansion/index.html">
            料理となかまの新しい図鑑を見る ↗
          </a>
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
        <div className="starter-introduction" aria-live="polite">
          <Heart size={15} />
          <p>
            {friend.description}
            <small className="starter-stage-note">うまれたての姿から、5つの姿へ。</small>
          </p>
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
      <p className="collection-intro">ごはんをあげると、カードがふえていく。</p>
      <div className="recipe-board">
        {recipes.map((recipe) => {
          const open = state.cards.includes(recipe.id)
          return (
            <button
              key={recipe.id}
              className={`recipe-collection-card recipe-rarity-${recipe.rarity} ${open ? 'is-discovered' : 'is-unknown'}`}
              aria-label={
                open ? `${recipe.name}のレシピを見る` : `${recipe.name}のレシピを見る（未獲得）`
              }
              onClick={() => onRecipe(recipe.id)}
            >
              <span className="recipe-card-picture">
                {open ? (
                  <DishArt kind={recipe.sample} />
                ) : (
                  <span className="recipe-card-back" aria-hidden="true">
                    <Utensils size={31} />
                    <span>?</span>
                    <i />
                    <i />
                    <i />
                  </span>
                )}
                <span className={`recipe-rarity recipe-rarity-${recipe.rarity}`}>
                  {recipe.rarity === 'special' && <Sparkles size={10} />}
                  {rarityNames[recipe.rarity]}
                </span>
              </span>
              <span className="recipe-card-description">
                <strong>{recipe.name}</strong>
                <span>
                  {open ? (
                    <>
                      <span>
                        <Clock3 size={12} />
                        {recipe.minutes}分
                      </span>
                      <span>{difficultyNames[recipe.difficulty - 1]}</span>
                    </>
                  ) : (
                    <span>
                      <BookOpen size={12} />
                      未獲得 · レシピを見る
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="recipe-card-arrow" size={15} />
            </button>
          )
        })}
      </div>
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
              おいしいにおいに、さそわれて。
            </span>
          </div>
          <div className="friend-visitor-grid">
            {visitors.map((id) => {
              const visitor = species.find((entry) => entry.id === id)!
              return (
                <article key={id} className={`friend-visitor friend-${id}`}>
                  <div className="friend-visitor-portrait">
                    <Pet species={id} stage={0} mood="hungry" />
                    <span>おなか、すいたなぁ。</span>
                  </div>
                  <h2>{visitor.name}が遊びにきた！</h2>
                  <button className="primary-button" onClick={() => onFeedVisitor(id)}>
                    <Utensils size={17} />
                    ごはんをあげる<span className="sr-only">：{visitor.name}</span>
                  </button>
                  <small>ごはんをあげると、なかまに。</small>
                </article>
              )
            })}
          </div>
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
                      いっしょに暮らし中
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
          わんぱくまで育つと、だれかが遊びにくるかも。
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
        <DishArt kind={recipe.sample} />
        <span className={`recipe-rarity recipe-rarity-${recipe.rarity}`}>
          {rarityNames[recipe.rarity]}
        </span>
      </div>
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
        <h3>材料</h3>
        <ul>
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </section>
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
      <button className="primary-button full recipe-cook" onClick={() => onCook(recipe.id)}>
        <Utensils size={18} />
        これをつくってあげる
      </button>
    </div>
  )
}
