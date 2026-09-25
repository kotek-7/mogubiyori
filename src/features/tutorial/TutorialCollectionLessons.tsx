import { useRef, useState } from 'react'
import { BookOpen, Heart, Utensils } from 'lucide-react'
import { DishArt, GatheringScene, Pet } from '../../ui/art/GameArt'
import { TutorialGuide } from './TutorialGuide'
import { useTutorialPlayback } from './useTutorialPlayback'
import { species } from '../../app/game/browserGame'
import type { SpeciesId } from '../../app/game/browserGame'

type FriendPhase = 'waiting' | 'aroma' | 'noticed' | 'visiting' | 'joined' | 'home'

export function TutorialFriends({
  speciesId,
  playing,
  onReady,
  onPhaseChange,
}: {
  speciesId: SpeciesId
  playing: boolean
  onReady: () => void
  onPhaseChange?: (phase: Exclude<FriendPhase, 'waiting'>) => void
}) {
  const guest = species.find((friend) => friend.id !== speciesId)!
  const host = species.find((friend) => friend.id === speciesId)!
  const [phase, setPhase] = useState<FriendPhase>('waiting')
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [isEating, setIsEating] = useState(false)
  const [joined, setJoined] = useState<SpeciesId | null>(null)
  const completed = useRef(false)
  const newFriend = joined ? guest : undefined

  function changePhase(next: Exclude<FriendPhase, 'waiting'>) {
    setPhase(next)
    onPhaseChange?.(next)
  }

  const delay: Record<FriendPhase, number | null> = {
    waiting: 1400,
    aroma: 1600,
    noticed: reducedMotion ? 1200 : 1800,
    visiting: isEating ? 1700 : reducedMotion ? 1200 : 1800,
    joined: 1600,
    home: null,
  }

  useTutorialPlayback(
    `${phase}-${isEating}`,
    () => {
      switch (phase) {
        case 'waiting':
          changePhase('aroma')
          break
        case 'aroma':
          changePhase('noticed')
          break
        case 'noticed':
          changePhase('visiting')
          break
        case 'visiting':
          if (!isEating) setIsEating(true)
          else {
            setJoined(guest.id)
            changePhase('joined')
          }
          break
        case 'joined':
          if (completed.current) return
          completed.current = true
          changePhase('home')
          onReady()
          break
        case 'home':
          break
      }
    },
    delay[phase],
    playing,
  )

  return (
    <div className="tutorial-collection-lesson tutorial-friends-lesson" data-phase={phase}>
      {phase !== 'joined' && phase !== 'home' && (
        <div
          className={`tutorial-friends-plaza${phase !== 'waiting' ? ' is-host-fed' : ''}${isEating ? ' is-eating' : ''}`}
        >
          <GatheringScene />
          <span className="tutorial-plaza-count">
            <BookOpen size={13} aria-hidden="true" />
            なかま 1匹
          </span>
          <div className="tutorial-friends-host">
            <div className="tutorial-friend-portrait" aria-hidden="true">
              <Pet species={speciesId} stage={2} mood={phase === 'waiting' ? 'hungry' : 'eating'} />
            </div>
            <strong>{host.name}</strong>
            <span className="tutorial-friend-stage">わんぱく</span>
          </div>
          <div className="tutorial-host-dish" aria-hidden="true">
            {phase !== 'waiting' ? <DishArt kind="rice" /> : <Utensils size={20} />}
          </div>
          {phase !== 'waiting' && (
            <svg className="tutorial-food-aroma" viewBox="0 0 300 120" aria-hidden="true">
              <path d="M0 117C-9 99 18 88 10 72S23 42 61 48S105 69 143 48S221 20 279 28" />
              <path d="M13 116C27 100 2 87 21 66S68 31 107 40S168 64 205 39S253 13 292 18" />
              <path d="M-8 117C8 96-8 75 12 60S50 21 85 29S133 45 168 24S237 4 272 9" />
            </svg>
          )}
          {(phase === 'noticed' || phase === 'visiting') && (
            <div className="tutorial-arriving-guest">
              <div
                className={`tutorial-visitor-character ${phase === 'noticed' ? 'is-distant' : 'is-near'}${!isEating ? ' is-walking' : ''}`}
              >
                <div className="tutorial-friend-portrait" aria-hidden="true">
                  <Pet species={guest.id} stage={0} mood={isEating ? 'eating' : 'hungry'} />
                </div>
                {phase === 'noticed' ? (
                  <span className="tutorial-visitor-reaction" aria-hidden="true">
                    !
                  </span>
                ) : (
                  <span className="tutorial-visitor-badge">
                    お客さん<strong>{guest.name}</strong>
                  </span>
                )}
              </div>
              {phase === 'visiting' && (
                <div className="tutorial-visitor-plate" aria-hidden="true">
                  {isEating ? <DishArt kind="rice" /> : <Utensils size={19} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {phase === 'joined' && newFriend && (
        <>
          <p className="tutorial-collection-result sr-only" role="status" aria-atomic="true">
            {newFriend.name}がなかまになりました
          </p>
          <section className="tutorial-friend-roster" aria-label="なかま 2匹">
            <h2>
              <BookOpen size={17} aria-hidden="true" />
              なかま 2匹
            </h2>
            <ul>
              {[host, newFriend].map((friend) => (
                <li key={friend.id} className={friend.id === joined ? 'is-new' : ''}>
                  <div className="tutorial-friend-portrait" aria-hidden="true">
                    <Pet species={friend.id} stage={friend.id === joined ? 0 : 2} mood="happy" />
                    {friend.id === joined && <Heart className="tutorial-friend-heart" size={22} />}
                  </div>
                  <strong>{friend.name}</strong>
                  <span>{friend.id === joined ? 'うまれたて' : 'わんぱく'}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {phase === 'home' && newFriend && (
        <>
          <div className="tutorial-friend-home">
            <GatheringScene />
            <span className="tutorial-friend-home-label">ひろば</span>
            <div className="tutorial-friend-home-pet" aria-hidden="true">
              <Pet species={newFriend.id} stage={0} mood="happy" />
            </div>
          </div>
          <div className="tutorial-friend-growth" role="status" aria-atomic="true">
            <div className="tutorial-friend-growth-heading">
              <strong>{newFriend.name}</strong>
              <span>うまれたて</span>
              <b>+45 XP</b>
            </div>
            <div
              className="tutorial-friend-growth-track"
              role="progressbar"
              aria-label={`${newFriend.name}の次の成長まで`}
              aria-valuemin={0}
              aria-valuemax={120}
              aria-valuenow={45}
            >
              <i />
            </div>
            <span>次の成長まで75 XP</span>
          </div>
        </>
      )}
      <div className="tutorial-friend-guide">
        <TutorialGuide>
          わんぱくまで育った子にごはんをあげると、匂いで別のもぐがやってきます。お客さんにもごはんをあげるとなかまに。一匹ずつ育てましょう。
        </TutorialGuide>
      </div>
    </div>
  )
}
