import { useEffect, useRef, useState } from 'react'
import { BookOpen, Heart, Utensils } from 'lucide-react'
import { DishArt, GatheringScene, Pet } from './GameArt'
import { TutorialGuide } from './TutorialGuide'
import { species } from './game'
import type { SpeciesId } from './game'
import './tutorial-collection.css'

type FriendPhase = 'waiting' | 'aroma' | 'noticed' | 'visiting' | 'joined' | 'home'

export function TutorialFriends({
  speciesId,
  onReady,
  onPhaseChange,
}: {
  speciesId: SpeciesId
  onReady: () => void
  onPhaseChange?: (phase: Exclude<FriendPhase, 'waiting'>) => void
}) {
  const guest = species.find((friend) => friend.id !== speciesId)!
  const host = species.find((friend) => friend.id === speciesId)!
  const [phase, setPhase] = useState<FriendPhase>('waiting')
  const currentPhase = useRef(phase)
  const [visitorReady, setVisitorReady] = useState(false)
  const [isEating, setIsEating] = useState(false)
  const feeding = useRef(false)
  const [joined, setJoined] = useState<SpeciesId | null>(null)
  const completed = useRef(false)
  const guide = useRef<HTMLDivElement>(null)
  const status = useRef<HTMLParagraphElement>(null)
  const homeStatus = useRef<HTMLDivElement>(null)
  const newFriend = joined ? guest : undefined

  useEffect(() => {
    if (phase === 'aroma' || phase === 'noticed' || (phase === 'visiting' && visitorReady))
      guide.current?.querySelector('button')?.focus({ preventScroll: true })
    if (phase === 'joined') status.current?.focus({ preventScroll: true })
    if (phase === 'home') homeStatus.current?.focus({ preventScroll: true })
  }, [phase, visitorReady])

  useEffect(() => {
    if (phase !== 'visiting') return
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750
    const timer = window.setTimeout(() => setVisitorReady(true), delay)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (!isEating || phase !== 'visiting') return
    const timer = window.setTimeout(() => {
      setJoined(guest.id)
      currentPhase.current = 'joined'
      setPhase('joined')
      onPhaseChange?.('joined')
    }, 850)
    return () => window.clearTimeout(timer)
  }, [isEating, phase, guest.id, onPhaseChange])

  function changePhase(next: Exclude<FriendPhase, 'waiting'>) {
    currentPhase.current = next
    setPhase(next)
    onPhaseChange?.(next)
  }

  function inviteVisitors() {
    if (currentPhase.current !== 'waiting') return
    changePhase('aroma')
  }

  function lookForGuest() {
    if (currentPhase.current !== 'aroma') return
    changePhase('noticed')
  }

  function inviteGuestCloser() {
    if (currentPhase.current !== 'noticed') return
    changePhase('visiting')
  }

  function giveMeal() {
    if (currentPhase.current !== 'visiting' || !visitorReady || feeding.current) return
    feeding.current = true
    setIsEating(true)
  }

  function callFriend() {
    if (!joined || currentPhase.current !== 'joined' || completed.current) return
    completed.current = true
    changePhase('home')
    onReady()
  }

  const guidance: Record<FriendPhase, string> = {
    waiting: 'わんぱくまで育った子にごはんをあげてみましょう。',
    aroma: 'おいしそうな匂いが広がっています。',
    noticed: '匂いに気づいた子がいるようです。',
    visiting: 'ごはんの匂いに誘われて来たお客さんにもごちそうしましょう。',
    joined: `${guest.name}が仲間になりました。`,
    home: 'なかまは一匹ずつ育てられます。',
  }
  const action =
    phase === 'waiting'
      ? { label: `${host.name}にごはんをあげる`, onClick: inviteVisitors }
      : phase === 'aroma'
        ? { label: '匂いの先を見る', onClick: lookForGuest }
        : phase === 'noticed'
          ? { label: '近くに呼ぶ', onClick: inviteGuestCloser }
          : phase === 'visiting'
            ? {
                label: isEating ? '食事中' : `${guest.name}にごはんをあげる`,
                onClick: giveMeal,
                disabled: isEating || !visitorReady,
              }
            : phase === 'joined'
              ? { label: `${guest.name}をひろばに呼ぶ`, onClick: callFriend }
              : undefined

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
                className={`tutorial-visitor-character ${phase === 'noticed' ? 'is-distant' : 'is-near'}`}
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
          <p
            className="tutorial-collection-result sr-only"
            role="status"
            aria-atomic="true"
            ref={status}
            tabIndex={-1}
          >
            {newFriend.name}が仲間になりました
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
          <div
            className="tutorial-friend-growth"
            role="status"
            aria-atomic="true"
            ref={homeStatus}
            tabIndex={-1}
          >
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
      <div className="tutorial-friend-guide" ref={guide}>
        <TutorialGuide action={action}>{guidance[phase]}</TutorialGuide>
      </div>
    </div>
  )
}
