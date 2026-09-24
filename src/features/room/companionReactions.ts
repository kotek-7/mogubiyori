import type { GrowthStage, SpeciesId } from '../../../shared/game/types'
import type { CompanionMood } from '../../ui/art/CompanionArt'

export type InteractionKind = 'pet' | 'tickle' | 'wave' | 'poke' | 'cuddle' | 'flick'
export type ReactionMotion =
  'bounce' | 'sway' | 'nuzzle' | 'wiggle' | 'hop' | 'peek' | 'stretch' | 'tippy'
export type ReactionEffect = 'hearts' | 'sparkles' | 'notes' | 'surprise' | 'sleep'

export type CompanionReaction = {
  id: string
  mood: CompanionMood
  motion: ReactionMotion
  effect: ReactionEffect
  description: string
  duration: number
}

export type CompanionReactionContext = {
  action: InteractionKind
  species: SpeciesId
  stage: GrowthStage
  fed: boolean
  resting: boolean
  /** Oldest first; only the last three reactions are excluded. */
  recentIds: readonly string[]
  consecutive: number
}

type ReactionState = 'awake' | 'resting' | 'rapid'
type ReactionGroup = {
  action: InteractionKind
  state: ReactionState
  fed?: boolean
  stages?: readonly GrowthStage[]
  reactions: readonly CompanionReaction[]
}

// Durations are milliseconds. Motions move the whole body, including newborn forms.
function reaction(
  id: string,
  mood: CompanionMood,
  motion: ReactionMotion,
  effect: ReactionEffect,
  description: string,
  duration = 2800,
): CompanionReaction {
  return { id, mood, motion, effect, description, duration }
}

const groups: readonly ReactionGroup[] = [
  {
    action: 'poke',
    state: 'awake',
    reactions: [
      reaction('poke.bounce', 'surprised', 'bounce', 'surprise', '目を丸くして小さく弾んだ', 1800),
      reaction('poke.peek', 'curious', 'peek', 'sparkles', '体を傾けてこちらを見た', 1800),
      reaction('poke.tippy', 'surprised', 'tippy', 'surprise', '目を丸くして体を揺らした', 1800),
      reaction('poke.sway', 'curious', 'sway', 'sparkles', 'こちらを見ながら左右に揺れた', 1800),
    ],
  },
  {
    action: 'cuddle',
    state: 'awake',
    reactions: [
      reaction('cuddle.nuzzle', 'relaxed', 'nuzzle', 'hearts', '目を細めて体をすり寄せた', 3200),
      reaction('cuddle.stretch', 'relaxed', 'stretch', 'hearts', 'ゆっくり大きく伸びをした', 3200),
      reaction('cuddle.sway', 'relaxed', 'sway', 'hearts', '目を細めてゆったり揺れた', 3200),
      reaction('cuddle.peek', 'relaxed', 'peek', 'hearts', '目を細めてそっと体を傾けた', 3200),
    ],
  },
  {
    action: 'flick',
    state: 'awake',
    reactions: [
      reaction('flick.hop', 'delighted', 'hop', 'sparkles', '笑顔で高く跳ねた', 2200),
      reaction('flick.bounce', 'surprised', 'bounce', 'surprise', '目を丸くして弾んだ', 2200),
      reaction('flick.tippy', 'playful', 'tippy', 'notes', '片目を閉じて体を弾ませた', 2200),
      reaction('flick.leap', 'happy', 'hop', 'notes', '笑顔で軽く跳ねた', 2200),
    ],
  },
  {
    action: 'poke',
    state: 'resting',
    reactions: [
      reaction('poke.rest.peek', 'sleepy', 'peek', 'sleep', '眠そうに体をかしげた', 3400),
      reaction('poke.rest.sway', 'relaxed', 'sway', 'hearts', '目を細めて小さく揺れた', 3400),
      reaction('poke.rest.nuzzle', 'sleepy', 'nuzzle', 'sleep', '眠そうに体を寄せた', 3400),
      reaction('poke.rest.stretch', 'relaxed', 'stretch', 'hearts', 'ゆっくり伸びをした', 3400),
    ],
  },
  {
    action: 'cuddle',
    state: 'resting',
    reactions: [
      reaction('cuddle.rest.nuzzle', 'sleepy', 'nuzzle', 'sleep', '眠そうな顔で寄り添った', 3400),
      reaction(
        'cuddle.rest.stretch',
        'relaxed',
        'stretch',
        'hearts',
        '目を細めて体を伸ばした',
        3400,
      ),
      reaction('cuddle.rest.sway', 'sleepy', 'sway', 'sleep', '眠そうにゆっくり揺れた', 3400),
      reaction('cuddle.rest.peek', 'relaxed', 'peek', 'hearts', '目を細めて体をかしげた', 3400),
    ],
  },
  {
    action: 'flick',
    state: 'resting',
    reactions: [
      reaction('flick.rest.sway', 'sleepy', 'sway', 'sleep', '眠そうなまま小さく揺れた', 3400),
      reaction('flick.rest.peek', 'relaxed', 'peek', 'hearts', 'ゆっくり体をかしげた', 3400),
      reaction('flick.rest.stretch', 'sleepy', 'stretch', 'sleep', '眠そうに体を伸ばした', 3400),
      reaction('flick.rest.nuzzle', 'relaxed', 'nuzzle', 'hearts', '目を細めて体を寄せた', 3400),
    ],
  },
  {
    action: 'poke',
    state: 'rapid',
    reactions: [
      reaction('poke.rapid.bounce', 'surprised', 'bounce', 'surprise', '目を丸くして弾んだ', 1800),
      reaction('poke.rapid.peek', 'curious', 'peek', 'sparkles', '体を傾けてじっと見た', 1800),
      reaction('poke.rapid.tippy', 'curious', 'tippy', 'notes', 'こちらを見て細かく弾んだ', 1800),
      reaction(
        'poke.rapid.sway',
        'surprised',
        'sway',
        'surprise',
        '目を丸くして左右に揺れた',
        1800,
      ),
    ],
  },
  {
    action: 'cuddle',
    state: 'rapid',
    reactions: [
      reaction(
        'cuddle.rapid.nuzzle',
        'relaxed',
        'nuzzle',
        'hearts',
        '目を細めてそっと寄り添った',
        3200,
      ),
      reaction(
        'cuddle.rapid.stretch',
        'relaxed',
        'stretch',
        'hearts',
        'ゆったり体を伸ばした',
        3200,
      ),
      reaction(
        'cuddle.rapid.sway',
        'relaxed',
        'sway',
        'hearts',
        '目を細めたままゆっくり揺れた',
        3200,
      ),
      reaction(
        'cuddle.rapid.peek',
        'relaxed',
        'peek',
        'hearts',
        'そっと体を傾けて目を細めた',
        3200,
      ),
    ],
  },
  {
    action: 'flick',
    state: 'rapid',
    reactions: [
      reaction('flick.rapid.hop', 'delighted', 'hop', 'sparkles', '笑顔で大きく跳ねた', 2200),
      reaction('flick.rapid.bounce', 'playful', 'bounce', 'notes', '片目を閉じて弾んだ', 2200),
      reaction(
        'flick.rapid.tippy',
        'delighted',
        'tippy',
        'hearts',
        '笑顔で何度も体を弾ませた',
        2200,
      ),
      reaction('flick.rapid.leap', 'surprised', 'hop', 'surprise', '目を丸くして高く跳ねた', 2200),
    ],
  },
  {
    action: 'pet',
    state: 'awake',
    reactions: [
      reaction('pet.nuzzle', 'relaxed', 'nuzzle', 'hearts', '目を細めて体を寄せた'),
      reaction('pet.sway', 'happy', 'sway', 'notes', '笑顔で左右に揺れた'),
      reaction('pet.bounce', 'delighted', 'bounce', 'hearts', '笑顔で弾んだ'),
      reaction('pet.peek', 'curious', 'peek', 'sparkles', '体を傾けてこちらを見た'),
    ],
  },
  {
    action: 'tickle',
    state: 'awake',
    reactions: [
      reaction('tickle.wiggle', 'playful', 'wiggle', 'notes', '体をくねらせて笑った'),
      reaction('tickle.hop', 'delighted', 'hop', 'sparkles', '笑顔で小さく跳ねた'),
      reaction('tickle.surprise', 'surprised', 'bounce', 'surprise', '目を丸くして弾んだ'),
      reaction('tickle.peek', 'playful', 'peek', 'hearts', '体を傾けて片目を閉じた'),
    ],
  },
  {
    action: 'wave',
    state: 'awake',
    reactions: [
      reaction('wave.sway', 'happy', 'sway', 'notes', '手の動きに合わせて揺れた'),
      reaction('wave.peek', 'curious', 'peek', 'sparkles', '体を傾けてのぞき込んだ'),
      reaction('wave.hop', 'delighted', 'hop', 'hearts', '目を合わせて跳ねた'),
      reaction('wave.tippy', 'playful', 'tippy', 'notes', 'リズムに乗って体を弾ませた'),
    ],
  },
  {
    action: 'pet',
    state: 'resting',
    reactions: [
      reaction('pet.rest.nuzzle', 'sleepy', 'nuzzle', 'sleep', '眠そうな顔で体を寄せた', 3400),
      reaction('pet.rest.sway', 'relaxed', 'sway', 'hearts', '目を細めてゆっくり揺れた', 3400),
      reaction('pet.rest.stretch', 'sleepy', 'stretch', 'sleep', '眠そうに伸びをした', 3400),
      reaction('pet.rest.peek', 'relaxed', 'peek', 'hearts', '目を細めて体を傾けた', 3400),
    ],
  },
  {
    action: 'tickle',
    state: 'resting',
    reactions: [
      reaction('tickle.rest.sway', 'sleepy', 'sway', 'sleep', '眠そうに体を揺らした', 3400),
      reaction(
        'tickle.rest.nuzzle',
        'relaxed',
        'nuzzle',
        'hearts',
        '目を細めてそっと体を寄せた',
        3400,
      ),
      reaction('tickle.rest.peek', 'sleepy', 'peek', 'sleep', '眠そうに体をかしげた', 3400),
      reaction('tickle.rest.stretch', 'relaxed', 'stretch', 'hearts', 'ゆっくり体を伸ばした', 3400),
    ],
  },
  {
    action: 'wave',
    state: 'resting',
    reactions: [
      reaction('wave.rest.peek', 'sleepy', 'peek', 'sleep', '眠そうな顔でこちらを見た', 3400),
      reaction('wave.rest.sway', 'relaxed', 'sway', 'hearts', '小さく体を揺らした', 3400),
      reaction('wave.rest.nuzzle', 'sleepy', 'nuzzle', 'sleep', '眠そうにこちらへ体を寄せた', 3400),
      reaction('wave.rest.stretch', 'relaxed', 'stretch', 'hearts', '目を細めて伸びをした', 3400),
    ],
  },
  {
    action: 'pet',
    state: 'rapid',
    reactions: [
      reaction('pet.rapid.wiggle', 'playful', 'wiggle', 'notes', '片目を閉じて体をくねらせた'),
      reaction('pet.rapid.bounce', 'surprised', 'bounce', 'surprise', '目を丸くして体を弾ませた'),
      reaction('pet.rapid.nuzzle', 'delighted', 'nuzzle', 'hearts', '笑顔で体をすり寄せた'),
      reaction('pet.rapid.tippy', 'playful', 'tippy', 'sparkles', '体を軽く弾ませた'),
    ],
  },
  {
    action: 'tickle',
    state: 'rapid',
    reactions: [
      reaction('tickle.rapid.wiggle', 'delighted', 'wiggle', 'notes', '笑いながら全身を揺らした'),
      reaction('tickle.rapid.hop', 'surprised', 'hop', 'surprise', '目を丸くして跳ねた'),
      reaction('tickle.rapid.peek', 'playful', 'peek', 'sparkles', '片目を閉じて体を傾けた'),
      reaction('tickle.rapid.bounce', 'delighted', 'bounce', 'hearts', '笑顔で何度も弾んだ'),
    ],
  },
  {
    action: 'wave',
    state: 'rapid',
    reactions: [
      reaction('wave.rapid.tippy', 'playful', 'tippy', 'notes', '手の動きに合わせて体を弾ませた'),
      reaction('wave.rapid.bounce', 'surprised', 'bounce', 'surprise', '目を丸くして小さく弾んだ'),
      reaction('wave.rapid.hop', 'delighted', 'hop', 'hearts', 'こちらを見て跳ねた'),
      reaction('wave.rapid.wiggle', 'playful', 'wiggle', 'sparkles', '踊るように体をくねらせた'),
    ],
  },
  {
    action: 'pet',
    state: 'awake',
    fed: true,
    reactions: [reaction('pet.fed', 'relaxed', 'stretch', 'hearts', '満腹のままゆっくり伸びた')],
  },
  {
    action: 'pet',
    state: 'awake',
    fed: false,
    reactions: [reaction('pet.hungry', 'hungry', 'nuzzle', 'hearts', 'おなかをすかせて体を寄せた')],
  },
  {
    action: 'tickle',
    state: 'awake',
    fed: true,
    reactions: [reaction('tickle.fed', 'delighted', 'wiggle', 'notes', '満腹のまま体をくねらせた')],
  },
  {
    action: 'tickle',
    state: 'awake',
    fed: false,
    reactions: [
      reaction('tickle.hungry', 'hungry', 'sway', 'notes', 'おなかをすかせて小さく揺れた'),
    ],
  },
  {
    action: 'wave',
    state: 'awake',
    fed: true,
    reactions: [reaction('wave.fed', 'happy', 'tippy', 'sparkles', '満腹のまま体を弾ませた')],
  },
  {
    action: 'wave',
    state: 'awake',
    fed: false,
    reactions: [
      reaction('wave.hungry', 'curious', 'peek', 'sparkles', 'おなかをすかせてこちらを見た'),
    ],
  },
  {
    action: 'pet',
    state: 'awake',
    stages: [0],
    reactions: [reaction('pet.newborn', 'relaxed', 'nuzzle', 'hearts', '小さな体をそっと寄せた')],
  },
  {
    action: 'tickle',
    state: 'awake',
    stages: [0],
    reactions: [reaction('tickle.newborn', 'playful', 'wiggle', 'notes', '小さな体をくねらせた')],
  },
  {
    action: 'wave',
    state: 'awake',
    stages: [0],
    reactions: [
      reaction('wave.newborn', 'curious', 'peek', 'sparkles', '小さな体を傾けてこちらを見た'),
    ],
  },
  {
    action: 'pet',
    state: 'awake',
    stages: [3, 4],
    reactions: [reaction('pet.grown', 'relaxed', 'stretch', 'hearts', '大きくなった体を伸ばした')],
  },
  {
    action: 'tickle',
    state: 'awake',
    stages: [3, 4],
    reactions: [reaction('tickle.grown', 'playful', 'wiggle', 'notes', '大きな体をくねらせた')],
  },
  {
    action: 'wave',
    state: 'awake',
    stages: [3, 4],
    reactions: [reaction('wave.grown', 'happy', 'sway', 'sparkles', '大きな体をゆったり揺らした')],
  },
]

const speciesReactions: Record<SpeciesId, Partial<Record<InteractionKind, CompanionReaction>>> = {
  komugi: {
    pet: reaction('pet.species.komugi', 'delighted', 'bounce', 'hearts', '麦色の体を弾ませた'),
    tickle: reaction(
      'tickle.species.komugi',
      'delighted',
      'hop',
      'notes',
      '麦色の体で大きく跳ねた',
    ),
    wave: reaction('wave.species.komugi', 'happy', 'tippy', 'notes', '麦色の体でリズムをとった'),
  },
  mame: {
    pet: reaction('pet.species.mame', 'relaxed', 'nuzzle', 'hearts', '若葉色の体をそっと寄せた'),
    tickle: reaction(
      'tickle.species.mame',
      'curious',
      'peek',
      'sparkles',
      '若葉色の体を小さく傾けた',
    ),
    wave: reaction('wave.species.mame', 'curious', 'peek', 'sparkles', '体を傾けてそっとのぞいた'),
  },
  shizuku: {
    pet: reaction('pet.species.shizuku', 'relaxed', 'sway', 'hearts', '波のようにゆっくり揺れた'),
    tickle: reaction(
      'tickle.species.shizuku',
      'delighted',
      'hop',
      'sparkles',
      '青い体で軽く跳ねた',
    ),
    wave: reaction('wave.species.shizuku', 'happy', 'sway', 'notes', '波のように左右に揺れた'),
  },
  yuzu: {
    pet: reaction('pet.species.yuzu', 'curious', 'peek', 'sparkles', '体を傾けてじっと見つめた'),
    tickle: reaction('tickle.species.yuzu', 'playful', 'wiggle', 'notes', 'ゆず色の体をくねらせた'),
    wave: reaction('wave.species.yuzu', 'curious', 'peek', 'surprise', '目を丸くしてのぞき込んだ'),
  },
  momo: {
    pet: reaction('pet.species.momo', 'relaxed', 'nuzzle', 'hearts', '桃色の体をすり寄せた'),
    tickle: reaction(
      'tickle.species.momo',
      'relaxed',
      'stretch',
      'hearts',
      '目を細めて大きく伸びた',
    ),
    wave: reaction('wave.species.momo', 'relaxed', 'stretch', 'sparkles', 'こちらを見て伸びをした'),
  },
  goma: {
    pet: reaction('pet.species.goma', 'curious', 'peek', 'sparkles', '白い顔をこちらへ傾けた'),
    tickle: reaction(
      'tickle.species.goma',
      'playful',
      'tippy',
      'notes',
      'ごま色の体を細かく弾ませた',
    ),
    wave: reaction(
      'wave.species.goma',
      'curious',
      'tippy',
      'sparkles',
      'こちらを見ながら体を弾ませた',
    ),
  },
}

export function chooseCompanionReaction(
  context: CompanionReactionContext,
  random: () => number = Math.random,
): CompanionReaction {
  const state: ReactionState = context.resting
    ? 'resting'
    : context.consecutive >= 3
      ? 'rapid'
      : 'awake'
  const recentIds = new Set(context.recentIds.slice(-3))
  // Each action/state has four unrestricted reactions, so excluding three always leaves a choice.
  const eligible = groups
    .filter(
      (group) =>
        group.action === context.action &&
        group.state === state &&
        (group.fed === undefined || group.fed === context.fed) &&
        (group.stages === undefined || group.stages.includes(context.stage)),
    )
    .flatMap((group) => group.reactions)
  const speciesReaction = speciesReactions[context.species][context.action]
  if (state === 'awake' && speciesReaction) eligible.push(speciesReaction)
  const candidates = eligible.filter((candidate) => !recentIds.has(candidate.id))
  const sample = random()
  const index = Number.isFinite(sample)
    ? Math.min(candidates.length - 1, Math.max(0, Math.floor(sample * candidates.length)))
    : 0
  return { ...candidates[index] }
}
