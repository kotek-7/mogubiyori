import { Check, Heart, Leaf, Sparkles, Utensils } from 'lucide-react'
import { Pet } from '../../ui/art/GameArt'
import { DiscoverySilhouette } from '../../ui/art/DiscoverySilhouette'
import { species, stageOf, stageName } from '../../app/game/browserGame'
import type { GameState, SpeciesId } from '../../app/game/browserGame'
import { GrowthTrail } from './GrowthTrail'

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
  const unknown = species.filter(
    ({ id }) => !state.companions.some((friend) => friend.id === id) && !visitors.includes(id),
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
        {unknown.map((entry) => (
          <article
            key={entry.id}
            className="friend-card is-unknown"
            aria-label={`未発見のなかま ${species.indexOf(entry) + 1}`}
          >
            <span className="friend-card-top">
              <strong>？？？</strong>
              <span>未発見</span>
            </span>
            <span className="friend-current">
              <DiscoverySilhouette>
                <Pet species={entry.id} stage={0} />
              </DiscoverySilhouette>
            </span>
            <span className="friend-growth-name">まだ出会っていない</span>
            <GrowthTrail species={entry.id} stage={null} />
          </article>
        ))}
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
