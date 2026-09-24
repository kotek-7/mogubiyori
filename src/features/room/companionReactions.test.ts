import { describe, expect, it } from 'vitest'
import type { GrowthStage, SpeciesId } from '../../../shared/game/types'
import {
  chooseCompanionReaction,
  type CompanionReactionContext,
  type InteractionKind,
} from './companionReactions'

const actions: InteractionKind[] = ['pet', 'tickle', 'wave']
const gestures: InteractionKind[] = ['poke', 'cuddle', 'flick']
const allActions = [...actions, ...gestures]
const speciesIds: SpeciesId[] = ['komugi', 'mame', 'shizuku', 'yuzu', 'momo', 'goma']
const stages: GrowthStage[] = [0, 1, 2, 3, 4]
const initialContext: CompanionReactionContext = {
  action: 'pet',
  species: 'komugi',
  stage: 0,
  fed: false,
  resting: false,
  recentIds: [],
  consecutive: 1,
}

function sample(overrides: Partial<CompanionReactionContext>) {
  const context = { ...initialContext, ...overrides }
  return Array.from(
    new Map(
      Array.from({ length: 100 }, (_, index) => {
        const reaction = chooseCompanionReaction(context, () => index / 100)
        return [reaction.id, reaction] as const
      }),
    ).values(),
  )
}

describe('companion reactions', () => {
  it('offers distinct expressions and motions for all three interactions', () => {
    for (const action of actions) {
      const reactions = sample({ action })
      expect(reactions.length).toBeGreaterThanOrEqual(7)
      expect(new Set(reactions.map((reaction) => reaction.motion)).size).toBeGreaterThanOrEqual(4)
      expect(new Set(reactions.map((reaction) => reaction.mood)).size).toBeGreaterThanOrEqual(3)
      expect(reactions.every((reaction) => reaction.id.startsWith(`${action}.`))).toBe(true)
    }
  })

  it('never replays the last three reactions, even with a constant random source', () => {
    for (const action of allActions) {
      for (const species of speciesIds) {
        for (const stage of stages) {
          for (const resting of [false, true]) {
            for (const consecutive of [1, 3]) {
              for (const fed of [false, true]) {
                const recentIds: string[] = []
                for (let count = 0; count < 12; count += 1) {
                  const reaction = chooseCompanionReaction(
                    { action, species, stage, fed, resting, consecutive, recentIds },
                    () => 0,
                  )
                  expect(recentIds.slice(-3)).not.toContain(reaction.id)
                  recentIds.push(reaction.id)
                }
              }
            }
          }
        }
      }
    }
  })

  it('lets old reactions return after three other reactions have played', () => {
    const recentIds = ['pet.rest.nuzzle', 'pet.rest.sway', 'pet.rest.stretch', 'pet.rest.peek']
    const reaction = chooseCompanionReaction(
      { ...initialContext, resting: true, recentIds },
      () => 0,
    )
    expect(reaction.id).toBe('pet.rest.nuzzle')
  })

  it('keeps resting companions calm even when interactions arrive quickly', () => {
    for (const action of allActions) {
      const reactions = sample({ action, resting: true, consecutive: 10 })
      expect(reactions).toHaveLength(4)
      for (const reaction of reactions) {
        expect(reaction.id).toContain('.rest.')
        expect(['sleepy', 'relaxed']).toContain(reaction.mood)
        expect(['nuzzle', 'peek', 'sway', 'stretch']).toContain(reaction.motion)
        expect(['hearts', 'sleep']).toContain(reaction.effect)
      }
    }
  })

  it('introduces playful rapid-input reactions on the third consecutive interaction', () => {
    for (const action of actions) {
      expect(
        sample({ action, consecutive: 2 }).every((reaction) => !reaction.id.includes('.rapid.')),
      ).toBe(true)
      const reactions = sample({ action, consecutive: 3 })
      expect(reactions).toHaveLength(4)
      expect(reactions.every((reaction) => reaction.id.includes('.rapid.'))).toBe(true)
      expect(reactions.some((reaction) => reaction.mood === 'surprised')).toBe(true)
      expect(reactions.some((reaction) => reaction.mood === 'playful')).toBe(true)
    }
  })

  it('gives pokes, cuddles, and flicks distinct reactions even after repeated gestures', () => {
    for (const action of gestures) {
      for (const consecutive of [1, 3, 10]) {
        const reactions = sample({ action, consecutive })
        expect(reactions).toHaveLength(4)
        for (const reaction of reactions) {
          expect(reaction.id.startsWith(`${action}.`)).toBe(true)
          expect(reaction.id.includes('.rapid.')).toBe(consecutive >= 3)
          if (action === 'poke') {
            expect(['surprised', 'curious']).toContain(reaction.mood)
            expect(['bounce', 'peek', 'tippy', 'sway']).toContain(reaction.motion)
          } else if (action === 'cuddle') {
            expect(reaction.mood).toBe('relaxed')
            expect(['nuzzle', 'stretch', 'sway', 'peek']).toContain(reaction.motion)
            expect(reaction.effect).toBe('hearts')
          } else {
            expect(['hop', 'bounce', 'tippy']).toContain(reaction.motion)
          }
        }
      }
    }
  })

  it('only uses hunger, fullness, and rest captions in their matching contexts', () => {
    for (const action of actions) {
      for (const fed of [false, true]) {
        const reactions = sample({ action, fed })
        const ids = reactions.map((reaction) => reaction.id)
        expect(ids).toContain(`${action}.${fed ? 'fed' : 'hungry'}`)
        expect(ids).not.toContain(`${action}.${fed ? 'hungry' : 'fed'}`)
        expect(ids.every((id) => !id.includes('.rest.') && !id.includes('.rapid.'))).toBe(true)
      }
    }
  })

  it('uses newborn and grown-up captions only for matching forms', () => {
    for (const action of actions) {
      for (const stage of stages) {
        const ids = sample({ action, stage }).map((reaction) => reaction.id)
        expect(ids.includes(`${action}.newborn`)).toBe(stage === 0)
        expect(ids.includes(`${action}.grown`)).toBe(stage >= 3)
      }
    }
  })

  it('gives each species matching captions and distinct visible reactions', () => {
    for (const action of actions) {
      const visibleReactions = new Set<string>()
      for (const species of speciesIds) {
        const reactions = sample({ action, species }).filter((reaction) =>
          reaction.id.includes('.species.'),
        )
        expect(reactions).toHaveLength(1)
        expect(reactions[0].id).toBe(`${action}.species.${species}`)
        visibleReactions.add(`${reactions[0].mood}/${reactions[0].motion}`)
      }
      expect(visibleReactions.size).toBeGreaterThanOrEqual(4)
    }
  })

  it('keeps newborn descriptions free of limb-specific actions', () => {
    for (const action of allActions) {
      for (const species of speciesIds) {
        for (const resting of [false, true]) {
          for (const consecutive of [1, 3]) {
            const reactions = sample({ action, species, resting, consecutive, stage: 0 })
            for (const reaction of reactions) {
              expect(reaction.description).not.toMatch(/しっぽ|尻尾|翼|羽|足|耳|首|手を/)
            }
          }
        }
      }
    }
  })

  it('preserves caller history and returns independently mutable reaction objects', () => {
    const context = Object.freeze({ ...initialContext, recentIds: Object.freeze(['pet.nuzzle']) })
    const first = chooseCompanionReaction(context, () => 0)
    const expectedDescription = first.description
    first.description = 'changed by caller'
    expect(chooseCompanionReaction(context, () => 0).description).toBe(expectedDescription)
    expect(context.recentIds).toEqual(['pet.nuzzle'])
  })

  it('keeps selection defined at the boundaries of an injected random source', () => {
    for (const value of [-1, 0, 0.999999, 1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const reaction = chooseCompanionReaction(initialContext, () => value)
      expect(reaction.id).toMatch(/^pet\./)
      expect(reaction.duration).toBeGreaterThan(0)
    }
  })
})
