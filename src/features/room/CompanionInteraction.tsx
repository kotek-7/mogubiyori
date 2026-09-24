import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Hand, Heart, Moon, Music2, Sparkles } from 'lucide-react'
import type { GrowthStage, SpeciesId } from '../../../shared/game/types'
import { Pet } from '../../ui/art/GameArt'
import { chooseCompanionReaction } from './companionReactions'
import type { CompanionReaction, InteractionKind, ReactionEffect } from './companionReactions'
import { useCompanionGestures } from './useCompanionGestures'
import type { GestureKind } from './companionGestures'

const gestureActions: Record<GestureKind, InteractionKind> = {
  tap: 'poke',
  stroke: 'pet',
  rub: 'tickle',
  hold: 'cuddle',
  flick: 'flick',
}

const effectIcons = {
  hearts: Heart,
  sparkles: Sparkles,
  notes: Music2,
  surprise: Sparkles,
  sleep: Moon,
} satisfies Record<ReactionEffect, typeof Heart>

export function CompanionInteraction({
  species,
  name,
  stage,
  hat,
  neck,
  bag,
  fed,
  resting,
}: {
  species: SpeciesId
  name: string
  stage: GrowthStage
  hat: string
  neck: string
  bag: string
  fed: boolean
  resting: boolean
}) {
  const statusId = useId()
  const helpId = useId()
  const petButton = useRef<HTMLButtonElement>(null)
  const [surface, setSurface] = useState<CSSProperties>()
  const [reaction, setReaction] = useState<
    (CompanionReaction & { sequence: number; action: InteractionKind }) | null
  >(null)
  const history = useRef({ recentIds: [] as string[], lastAt: 0, consecutive: 0, sequence: 0 })
  const gestures = useCompanionGestures((gesture) => interact(gestureActions[gesture]))
  const touching = gestures.contact !== null

  useEffect(() => {
    if (!reaction || touching) return
    const timer = window.setTimeout(() => setReaction(null), reaction.duration)
    return () => window.clearTimeout(timer)
  }, [reaction, touching])

  useLayoutEffect(() => {
    const button = petButton.current
    if (!button) return
    function measure() {
      const body = button!.querySelector<SVGGElement>('.pet-body')
      if (!body) return
      const box = body.getBBox()
      // The square SVG is centered in its button. Limit gesture ownership to the anatomy,
      // so the transparent sky around a newborn still supports native page scrolling.
      const width = button!.clientWidth
      const height = button!.clientHeight
      const scale = Math.min(width, height) / 300
      const hitWidth = Math.max(44, (box.width + 12) * scale)
      const hitHeight = Math.max(44, (box.height + 12) * scale)
      setSurface({
        left: (width - 300 * scale) / 2 + (box.x + box.width / 2) * scale - hitWidth / 2,
        top: (height - 300 * scale) / 2 + (box.y + box.height / 2) * scale - hitHeight / 2,
        width: hitWidth,
        height: hitHeight,
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(button)
    return () => observer.disconnect()
  }, [species, stage, hat, neck, bag])

  function interact(action: InteractionKind) {
    const now = performance.now()
    const previous = history.current
    const consecutive = now - previous.lastAt < 1800 ? previous.consecutive + 1 : 1
    const next = chooseCompanionReaction({
      action,
      species,
      stage,
      fed,
      resting,
      recentIds: previous.recentIds,
      consecutive,
    })
    const sequence = previous.sequence + 1
    history.current = {
      recentIds: [...previous.recentIds, next.id].slice(-3),
      lastAt: now,
      consecutive,
      sequence,
    }
    setReaction({ ...next, sequence, action })
  }

  const EffectIcon = reaction ? effectIcons[reaction.effect] : Heart
  return (
    <>
      <button
        ref={petButton}
        className={`play-pet companion-interaction${reaction ? ' is-petted is-reacting' : ''}${touching ? ' is-touching' : ''}`}
        aria-label={`${name}をなでる`}
        aria-describedby={`${helpId}${reaction ? ` ${statusId}` : ''}`}
        data-reaction={reaction?.id}
        data-motion={reaction?.motion}
        data-interaction={reaction?.action}
        data-reaction-sequence={reaction?.sequence}
        data-gesture={gestures.contact?.gesture ?? undefined}
        style={
          {
            '--reaction-duration': reaction ? `${reaction.duration}ms` : undefined,
            '--gesture-x': `${gestures.contact?.leanX ?? 0}px`,
            '--gesture-y': `${gestures.contact?.leanY ?? 0}px`,
            '--gesture-tilt': `${(gestures.contact?.leanX ?? 0) * 0.5}deg`,
          } as CSSProperties
        }
        {...gestures.handlers}
      >
        <Pet
          key={`pet-${reaction?.sequence ?? 'idle'}`}
          species={species}
          stage={stage}
          mood={reaction?.mood ?? (resting ? 'sleepy' : fed ? 'happy' : 'hungry')}
          hat={hat}
          neck={neck}
          bag={bag}
        />
        <span
          data-gesture-surface=""
          className="companion-gesture-surface"
          style={surface}
          aria-hidden="true"
        />
        {gestures.contact && (
          <span
            className="companion-touch-ring"
            data-held={gestures.contact.gesture === 'hold' || undefined}
            data-hold-eligible={gestures.contact.holdEligible || undefined}
            style={{ left: gestures.contact.x, top: gestures.contact.y }}
            aria-hidden="true"
          >
            <Heart size={18} />
          </span>
        )}
        {reaction && (
          <span
            key={`effects-${reaction.sequence}`}
            className={`companion-reaction-effects effect-${reaction.effect}`}
            aria-hidden="true"
          >
            {[0, 1, 2].map((index) => (
              <EffectIcon key={index} style={{ '--particle': index } as CSSProperties} />
            ))}
          </span>
        )}
      </button>
      <span id={helpId} className="sr-only">
        タップでつつく、指を滑らせてなでる、左右にこすってくすぐる、長押しで寄り添う、上にはじくと跳ねます。
        キーボードではEnterかSpaceでなでられます。
      </span>
      <div
        id={statusId}
        className="companion-reaction-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {reaction && (
          <span key={reaction.sequence}>
            {name}が{reaction.description}
          </span>
        )}
      </div>
      <div className="companion-actions" role="group" aria-label={`${name}とふれあう`}>
        <button type="button" onClick={() => interact('tickle')} aria-label={`${name}をくすぐる`}>
          <Sparkles size={18} aria-hidden="true" />
          <span>くすぐる</span>
        </button>
        <button type="button" onClick={() => interact('wave')} aria-label={`${name}に手をふる`}>
          <Hand size={18} aria-hidden="true" />
          <span>手をふる</span>
        </button>
      </div>
    </>
  )
}
