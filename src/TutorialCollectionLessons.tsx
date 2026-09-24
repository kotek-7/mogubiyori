import { useEffect, useRef, useState } from 'react'
import { Check, Clock3, Coins, Heart, Utensils } from 'lucide-react'
import { DishArt, Pet } from './GameArt'
import { recipes, species } from './game'
import type { SpeciesId } from './game'
import './tutorial-collection.css'

export function TutorialFriends({
  speciesId,
  onReady,
}: {
  speciesId: SpeciesId
  onReady: () => void
}) {
  const visitors = species.filter((friend) => friend.id !== speciesId).slice(0, 2)
  const host = species.find((friend) => friend.id === speciesId)!
  const [selected, setSelected] = useState<SpeciesId | null>(null)
  const [joined, setJoined] = useState<SpeciesId | null>(null)
  const completed = useRef(false)
  const status = useRef<HTMLParagraphElement>(null)
  const chosen = visitors.find((friend) => friend.id === selected)

  useEffect(() => {
    if (joined) status.current?.focus({ preventScroll: true })
  }, [joined])

  function giveMeal() {
    if (!selected || completed.current) return
    completed.current = true
    setJoined(selected)
    onReady()
  }

  return (
    <div className="tutorial-collection-lesson tutorial-friends-lesson">
      {!joined && <p className="tutorial-collection-hint">ごはんをあげるお客さんを選ぶ</p>}
      <div className="tutorial-friends-stage">
        <div className="tutorial-friends-host">
          <div className="tutorial-friend-portrait" aria-hidden="true">
            <Pet species={speciesId} stage={2} mood="happy" />
          </div>
          <span>{host.name}</span>
        </div>
        <div className="tutorial-friends-guests" role="group" aria-label="お客さんを選ぶ">
          {visitors.map((friend) => (
            <button
              key={friend.id}
              type="button"
              className={`tutorial-guest${selected === friend.id ? ' is-selected' : ''}${joined === friend.id ? ' is-joined' : ''}`}
              aria-label={`${friend.name}を選ぶ`}
              aria-pressed={selected === friend.id}
              disabled={Boolean(joined)}
              onClick={() => setSelected(friend.id)}
            >
              <div className="tutorial-friend-portrait" aria-hidden="true">
                <Pet
                  species={friend.id}
                  stage={0}
                  mood={joined === friend.id ? 'happy' : 'hungry'}
                />
                {joined === friend.id && <Heart className="tutorial-friend-heart" size={24} />}
              </div>
              <span className="tutorial-guest-name">
                {friend.name}
                {selected === friend.id && <Check size={14} aria-hidden="true" />}
              </span>
            </button>
          ))}
        </div>
      </div>
      {!joined && (
        <button
          type="button"
          className="tutorial-collection-action"
          disabled={!chosen}
          onClick={giveMeal}
        >
          <Utensils size={18} aria-hidden="true" />
          {chosen ? `${chosen.name}にごはんをあげる` : 'ごはんをあげる'}
        </button>
      )}
      <p
        className="tutorial-collection-result"
        role="status"
        aria-atomic="true"
        ref={status}
        tabIndex={-1}
      >
        {joined && `${chosen!.name}が仲間になりました`}
      </p>
    </div>
  )
}

export function TutorialCards({ onReady }: { onReady: () => void }) {
  const recipe = recipes.find((entry) => entry.id === 'curry')!
  const [phase, setPhase] = useState<'hidden' | 'recipe' | 'collected'>('hidden')
  const completed = useRef(false)
  const recipeHeading = useRef<HTMLHeadingElement>(null)
  const status = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (phase === 'recipe') recipeHeading.current?.focus({ preventScroll: true })
    if (phase === 'collected') status.current?.focus({ preventScroll: true })
  }, [phase])

  function collectCard() {
    if (completed.current) return
    completed.current = true
    setPhase('collected')
    onReady()
  }

  return (
    <div className="tutorial-collection-lesson tutorial-cards-lesson">
      {phase === 'hidden' && (
        <p className="tutorial-collection-hint">未獲得のカードからレシピを見られます。</p>
      )}
      {phase === 'recipe' ? (
        <section className="tutorial-card-recipe" aria-label={`${recipe.name}のレシピ`}>
          <header className="tutorial-recipe-header">
            <span className="tutorial-recipe-picture" aria-hidden="true">
              <DishArt kind={recipe.sample} />
            </span>
            <h2 ref={recipeHeading} tabIndex={-1}>
              {recipe.name}
            </h2>
            <span className="tutorial-recipe-time">
              <Clock3 size={14} aria-hidden="true" />
              {recipe.minutes}分
            </span>
          </header>
          <div
            className="tutorial-recipe-scroll"
            role="region"
            tabIndex={0}
            aria-label="材料と作り方"
          >
            <h3>材料</h3>
            <ul className="tutorial-recipe-ingredients">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
            <details className="tutorial-recipe-steps">
              <summary>作り方</summary>
              <ol>
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </details>
          </div>
          <button type="button" className="tutorial-collection-action" onClick={collectCard}>
            カードの獲得を見る
          </button>
        </section>
      ) : (
        <div className={`tutorial-card-row${phase === 'collected' ? ' is-collected' : ''}`}>
          <div className="tutorial-card-shadow" aria-hidden="true">
            <span>?</span>
          </div>
          {phase === 'hidden' ? (
            <button
              type="button"
              className="tutorial-discovery-card"
              aria-label={`${recipe.name}のカードを見る`}
              onClick={() => setPhase('recipe')}
            >
              <span className="tutorial-card-question" aria-hidden="true">
                ?
              </span>
              <span>レシピを見る</span>
            </button>
          ) : (
            <div className="tutorial-discovery-card tutorial-collected-card">
              <span className="tutorial-card-dish" aria-hidden="true">
                <DishArt kind={recipe.sample} />
              </span>
              <strong>{recipe.name}</strong>
            </div>
          )}
          <div className="tutorial-card-shadow" aria-hidden="true">
            <span>?</span>
          </div>
        </div>
      )}
      <p
        className="tutorial-collection-result tutorial-card-reward"
        role="status"
        aria-atomic="true"
        ref={status}
        tabIndex={-1}
      >
        {phase === 'collected' && (
          <>
            <Coins size={19} aria-hidden="true" />
            <strong>+{recipe.reward}コイン</strong>
          </>
        )}
      </p>
    </div>
  )
}
