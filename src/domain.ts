export type Category = 'ごはん' | '麺' | '炒めもの' | 'スープ' | '蒸しもの'
export type Recipe = {
  id: string
  name: string
  subtitle: string
  category: Category
  minutes: number
  ingredients: { name: string; amount: string }[]
  staples: string
  steps: string[]
  tip: string
  color: string
  art: 'rice' | 'noodle' | 'soup' | 'tofu' | 'pasta'
}
export const recipes: Recipe[] = [
  {
    id: 'cabbage-rice',
    name: 'ふわたまキャベツ炒飯',
    subtitle: 'いつもの卵に、野菜をひとつ。',
    category: 'ごはん',
    minutes: 10,
    ingredients: [
      { name: '卵', amount: '1個' },
      { name: 'ごはん', amount: '茶碗1杯' },
      { name: 'キャベツ', amount: '1枚' },
    ],
    staples: '油 小さじ1、しょうゆ 小さじ1、塩・こしょう 少々',
    steps: [
      'キャベツを小さくちぎり、卵を溶く。ごはんが冷たい場合は温める。',
      'フライパンに油を入れ、中火でキャベツをしんなりするまで炒める。',
      '卵とごはんを加え、卵に火が通るまでほぐしながら炒める。しょうゆ、塩・こしょうで味を整える。',
    ],
    tip: 'キャベツは手でちぎってOK。まな板を使わないだけで、あと片づけも少しラクに。',
    color: '#edf0db',
    art: 'rice',
  },
  {
    id: 'tuna-udon',
    name: 'ツナと卵のまぜうどん',
    subtitle: '包丁いらずの、おつかれさまごはん。',
    category: '麺',
    minutes: 5,
    ingredients: [
      { name: 'うどん', amount: '冷凍1玉' },
      { name: 'ツナ', amount: '1/2缶' },
      { name: '卵', amount: '1個' },
    ],
    staples: 'めんつゆ（ストレート）大さじ2',
    steps: [
      '冷凍うどんを袋の表示どおりに電子レンジで温める。',
      '耐熱容器に卵を溶き、ふんわりラップをする。600Wで30秒ずつ、混ぜながら固まるまで加熱する。',
      'うどんにツナ、加熱した卵、めんつゆを加えて混ぜる。',
    ],
    tip: 'ツナが残ったら、保存容器に移して冷蔵庫へ。次の一品にも使おう。',
    color: '#f6e8d5',
    art: 'noodle',
  },
  {
    id: 'tofu-soup',
    name: '豆腐ときのこのほっとスープ',
    subtitle: 'ほっとする一杯も、立派な自炊。',
    category: 'スープ',
    minutes: 10,
    ingredients: [
      { name: '豆腐', amount: '150g' },
      { name: 'きのこ', amount: '1/2袋' },
    ],
    staples: '水 250ml、鶏がらスープの素 小さじ1、しょうゆ 小さじ1/2',
    steps: [
      'きのこの石づきを取り、手でほぐす。豆腐はスプーンで大きめにすくう。',
      '小鍋に水と調味料、きのこを入れて火にかける。',
      '沸いたら豆腐を加え、弱火で3〜4分煮る。器に盛ってできあがり。',
    ],
    tip: '豆腐は切らずにスプーンで。ふぞろいな形もおいしさのうち。',
    color: '#e5eadd',
    art: 'soup',
  },
  {
    id: 'tuna-rice',
    name: '香ばしツナたま炒飯',
    subtitle: 'おなじみの一皿を、今日も。',
    category: 'ごはん',
    minutes: 10,
    ingredients: [
      { name: 'ごはん', amount: '茶碗1杯' },
      { name: 'ツナ', amount: '1/2缶' },
      { name: '卵', amount: '1個' },
    ],
    staples: '油 小さじ1、しょうゆ 小さじ1',
    steps: [
      '卵を溶き、ごはんを温める。ツナの水気を切る。',
      '油をひいたフライパンで卵を炒め、ごはんとツナを加える。',
      '卵に火が通るまで炒め、しょうゆを回しかける。',
    ],
    tip: 'いつもの料理を作れることも、身についた力。少しずつ自分の味にしよう。',
    color: '#f3e9cf',
    art: 'rice',
  },
  {
    id: 'cabbage-pork',
    name: 'キャベツと豚こまの重ね蒸し',
    subtitle: '重ねて待つだけ。野菜もたっぷり。',
    category: '蒸しもの',
    minutes: 15,
    ingredients: [
      { name: 'キャベツ', amount: '2枚' },
      { name: '豚こま', amount: '100g' },
    ],
    staples: '水 大さじ3、酒 大さじ1、ポン酢 適量',
    steps: [
      'キャベツをちぎってフライパンに広げ、その上に豚肉を重ならないように並べる。',
      '水と酒を加え、ふたをして中火にかける。沸いたら弱火で蒸す。',
      '肉の中心までしっかり火が通っていることを確認し、ポン酢をかける。水が足りなくなったら途中で補う。',
    ],
    tip: '火にかけている間に使った道具を洗うと、食後の自分が喜ぶ。',
    color: '#e8eddd',
    art: 'tofu',
  },
  {
    id: 'tomato-pasta',
    name: 'ツナとトマトのワンパンパスタ',
    subtitle: 'ちょっと余裕のある日に、新しい一皿。',
    category: '麺',
    minutes: 20,
    ingredients: [
      { name: 'パスタ', amount: '100g' },
      { name: 'トマト', amount: '1個' },
      { name: 'ツナ', amount: '1/2缶' },
    ],
    staples: '水 350ml、塩 少々、オリーブ油 小さじ1',
    steps: [
      'トマトを小さく切る。フライパンに水、塩、トマト、ツナを入れて沸かす。',
      'パスタを加え、袋の表示時間を目安に、ときどき混ぜながら煮る。',
      '水が足りなければ少しずつ足し、パスタが好みの硬さになったらオリーブ油で仕上げる。',
    ],
    tip: '鍋をひとつ減らすのも、自炊を続けるための立派な工夫。',
    color: '#f2ddd0',
    art: 'pasta',
  },
  {
    id: 'tofu-egg',
    name: 'レンジで豆腐たまご',
    subtitle: '火を使わず、ふんわり一品。',
    category: '蒸しもの',
    minutes: 5,
    ingredients: [
      { name: '豆腐', amount: '150g' },
      { name: '卵', amount: '1個' },
    ],
    staples: 'めんつゆ（ストレート）大さじ1',
    steps: [
      '耐熱容器で豆腐をスプーンでくずし、卵とめんつゆをよく混ぜる。',
      'ふんわりラップをして600Wで2分加熱する。',
      '一度混ぜ、卵が全体に固まるまで30秒ずつ追加で加熱する。熱い容器に気をつけて取り出す。',
    ],
    tip: 'そのまま食べられる耐熱の器なら、洗いものもひとつ。',
    color: '#eee6d9',
    art: 'tofu',
  },
  {
    id: 'mushroom-saute',
    name: 'きのこと卵のしょうゆ炒め',
    subtitle: 'あと一品が、今日の一歩になる。',
    category: '炒めもの',
    minutes: 10,
    ingredients: [
      { name: 'きのこ', amount: '1/2袋' },
      { name: '卵', amount: '1個' },
    ],
    staples: '油 小さじ1、しょうゆ 小さじ1',
    steps: [
      'きのこの石づきを取ってほぐし、卵を溶く。',
      '油をひいたフライパンできのこをしんなりするまで炒める。',
      '卵を加え、全体に火が通るまで炒める。しょうゆで味を整える。',
    ],
    tip: 'きのこは冷凍しておくと、使いたい分だけ取り出せる。',
    color: '#e7e7da',
    art: 'rice',
  },
]
export const pantryOptions = [
  '卵',
  'ごはん',
  'キャベツ',
  'ツナ',
  '豆腐',
  'きのこ',
  'うどん',
  '豚こま',
  'トマト',
  'パスタ',
]
export const categories: Category[] = ['ごはん', '麺', '炒めもの', 'スープ', '蒸しもの']
export type Settings = {
  recommendation: 'one' | 'three'
  habit: 'daily' | 'weekly'
  repetition: 'bonus' | 'penalty'
  social: 'gated' | 'open'
  reminder: 'gentle' | 'pushy'
}
export const defaultSettings: Settings = {
  recommendation: 'one',
  habit: 'daily',
  repetition: 'bonus',
  social: 'gated',
  reminder: 'gentle',
}
export type Meal = {
  id: string
  day: string
  recipeId: string
  title: string
  category: Category
  photo?: string
  note: string
  visibility: 'private' | 'anonymous' | 'friends'
  xp: number
}
export type AppState = {
  version: 1
  today: string
  meals: Meal[]
  rests: string[]
  freezes: number
  settings: Settings
  pantry: string[]
  minutes: number
  liked: string[]
  followed: string[]
  notes: string
  events: { day: string; type: string; detail: string }[]
}
export function todayInTokyo() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())
}
export function addDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
export function dayLabel(day: string, full = false) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    ...(full ? ({ weekday: 'long' } as const) : {}),
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`))
}
export function weekDays(day: string) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
  const monday = addDays(day, -(weekday === 0 ? 6 : weekday - 1))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}
export function initialState(day = todayInTokyo(), fresh = false): AppState {
  const seed = [
    'tofu-soup',
    'tuna-udon',
    'cabbage-pork',
    'mushroom-saute',
    'tuna-rice',
    'cabbage-rice',
  ]
  return {
    version: 1,
    today: day,
    meals: fresh
      ? []
      : seed.map((id, i) => {
          const recipe = recipes.find((r) => r.id === id)!
          return {
            id: `seed-${i}`,
            day: addDays(day, i - 6),
            recipeId: id,
            title: recipe.name,
            category: recipe.category,
            note: [
              'スープだけでも作れてよかった。',
              '帰宅後5分でできた！',
              'キャベツ、使いきれた。',
              '包丁いらずがうれしい。',
              '今日は定番の味。',
              'キャベツを足してみた。',
            ][i],
            visibility: 'private',
            xp: 20,
          }
        }),
    rests: [],
    freezes: 2,
    settings: { ...defaultSettings },
    pantry: ['卵', 'ごはん', 'キャベツ', '豆腐'],
    minutes: 15,
    liked: [],
    followed: [],
    notes: '',
    events: [],
  }
}
export function cookedToday(state: AppState) {
  return state.meals.some((m) => m.day === state.today)
}
export function streak(state: AppState) {
  const days = new Set(state.meals.map((m) => m.day))
  let day = state.today
  if (!days.has(day) && !state.rests.includes(day)) day = addDays(day, -1)
  let count = 0
  while (days.has(day) || state.rests.includes(day)) {
    if (days.has(day)) count++
    day = addDays(day, -1)
  }
  return count
}
export function weeklyCount(state: AppState) {
  const week = weekDays(state.today)
  return new Set(state.meals.filter((m) => week.includes(m.day)).map((m) => m.day)).size
}
export function recommend(state: AppState, offset = 0): Recipe[] {
  const recent = state.meals.filter((m) => m.day >= addDays(state.today, -3)).map((m) => m.category)
  const candidates = recipes
    .filter((r) => r.minutes <= state.minutes)
    .map((recipe) => {
      const owned = recipe.ingredients.filter((i) => state.pantry.includes(i.name)).length
      const score =
        (owned / recipe.ingredients.length) * 10 - (recent.includes(recipe.category) ? 1 : 0)
      return { recipe, score }
    })
    .sort((a, b) => b.score - a.score)
  return candidates.map((_, i) => candidates[(i + offset) % candidates.length].recipe)
}
export function recommendationReason(recipe: Recipe, state: AppState) {
  const owned = recipe.ingredients.filter((i) => state.pantry.includes(i.name)).length
  const recent = state.meals.filter((m) => m.day >= addDays(state.today, -3))
  if (owned === recipe.ingredients.length) return 'いまある食材で、買い足しなし。'
  if (!recent.some((m) => m.category === recipe.category))
    return '最近とちがう一品で、レパートリーをひとつ。'
  return `家にある${owned}つの食材を使って、気軽に。`
}
export function rewardFor(state: AppState, category: Category) {
  if (cookedToday(state))
    return {
      xp: 0,
      repeated: false,
      novel: false,
      label: '今日のごほうびは獲得済み。記録は何度でも。',
    }
  const recent = state.meals.filter((m) => m.day >= addDays(state.today, -3) && m.day < state.today)
  const repeated = recent.filter((m) => m.category === category).length >= 2
  const novel = !state.meals.some((m) => m.category === category)
  const xp = state.settings.repetition === 'penalty' && repeated ? 10 : 20 + (novel ? 10 : 0)
  return {
    xp,
    repeated,
    novel,
    label:
      repeated && state.settings.repetition === 'penalty'
        ? '同じジャンルが続いたので、今日は10 XP。'
        : novel
          ? '新しいジャンルに挑戦！ ボーナス +10 XP。'
          : '自分のために作った一皿に、20 XP。',
  }
}
export function recordMeal(state: AppState, input: Omit<Meal, 'id' | 'day' | 'xp'>): AppState {
  const reward = rewardFor(state, input.category)
  const hadRest = state.rests.includes(state.today)
  return {
    ...state,
    meals: [...state.meals, { ...input, id: crypto.randomUUID(), day: state.today, xp: reward.xp }],
    rests: state.rests.filter((d) => d !== state.today),
    freezes: state.freezes + (hadRest ? 1 : 0),
    events: [
      ...state.events,
      {
        day: state.today,
        type: 'record',
        detail: `${input.title} / ${input.visibility} / ${reward.xp} XP`,
      },
    ],
  }
}
export function freezeDay(state: AppState): AppState {
  if (
    state.freezes < 1 ||
    cookedToday(state) ||
    state.rests.includes(state.today) ||
    state.settings.habit !== 'daily'
  )
    return state
  return {
    ...state,
    freezes: state.freezes - 1,
    rests: [...state.rests, state.today],
    events: [
      ...state.events,
      { day: state.today, type: 'freeze', detail: 'おやすみチケットを使用' },
    ],
  }
}
export function advanceDay(state: AppState): AppState {
  return {
    ...state,
    today: addDays(state.today, 1),
    events: [...state.events, { day: state.today, type: 'next-day', detail: '翌日へ進めた' }],
  }
}
