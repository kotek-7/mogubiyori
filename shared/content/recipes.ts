import staples from '../../content/expansion/recipes/staples.json' with { type: 'json' }
import mainsAndSides from '../../content/expansion/recipes/mains-sides.json' with { type: 'json' }
import { adaptRecipe, mergeById } from './adoption'
import type { ExpansionRecipe, RecipeCategory } from './types'

export type { RecipeCategory } from './types'

export const recipeCategories: Record<RecipeCategory, string> = {
  rice: 'ごはん',
  noodles: '麺',
  soup: 'スープ・汁もの',
  main: '主菜',
  side: '副菜',
  breakfast: '朝ごはん',
  snack: 'おやつ',
}

export type Recipe = {
  id: string
  name: string
  sample: string
  difficulty: 1 | 2 | 3
  rarity: 'common' | 'rare' | 'special'
  minutes: number
  ingredients: string[]
  steps: string[]
  reward: number
  artPath?: string
  category?: RecipeCategory
  description?: string
  cuisine?: string
  servings?: number
  tip?: string
  tags?: string[]
  equipment?: string[]
}
export const legacyRecipes: Recipe[] = [
  {
    id: 'egg-rice',
    category: 'rice',
    name: 'ふわたまごはん',
    sample: 'rice',
    difficulty: 1,
    rarity: 'common',
    minutes: 5,
    ingredients: ['ごはん 1膳', '卵 1個', '油・しょうゆ 少々'],
    steps: [
      '卵を溶き、油をひいたフライパンで全体が固まるまで炒める。',
      '温かいごはんにのせ、しょうゆをかける。',
    ],
    reward: 20,
  },
  {
    id: 'onigiri',
    category: 'rice',
    name: 'おかかのおにぎり',
    sample: 'rice',
    difficulty: 1,
    rarity: 'common',
    minutes: 5,
    ingredients: ['ごはん 1膳', 'かつおぶし ひとつかみ', 'しょうゆ 少々', 'のり 1枚'],
    steps: ['ごはんにかつおぶしとしょうゆを混ぜる。', 'ラップで包んで握り、のりを巻く。'],
    reward: 20,
  },
  {
    id: 'tofu-soup',
    category: 'soup',
    name: '豆腐のほっとスープ',
    sample: 'soup',
    difficulty: 1,
    rarity: 'common',
    minutes: 10,
    ingredients: ['豆腐 150g', '水 250ml', '鶏がらスープの素 小さじ1', '乾燥わかめ 少々'],
    steps: [
      '鍋に水とスープの素を入れて沸かす。',
      '豆腐をスプーンですくい入れ、わかめを加えて温める。',
    ],
    reward: 20,
  },
  {
    id: 'miso-soup',
    category: 'soup',
    name: '野菜のおみそ汁',
    sample: 'soup',
    difficulty: 1,
    rarity: 'common',
    minutes: 10,
    ingredients: ['キャベツ 1枚', 'きのこ ひとつかみ', 'だし 250ml', 'みそ 小さじ2'],
    steps: [
      'キャベツときのこを食べやすくし、だしで柔らかくなるまで煮る。',
      '火を止めてみそを溶く。',
    ],
    reward: 20,
  },
  {
    id: 'fried-rice',
    category: 'rice',
    name: '彩りチャーハン',
    sample: 'rice',
    difficulty: 2,
    rarity: 'rare',
    minutes: 15,
    ingredients: ['ごはん 1膳', '卵 1個', 'ねぎ・にんじん 各少々', '油・しょうゆ 少々'],
    steps: [
      '野菜を細かく切り、油をひいたフライパンで炒める。',
      '溶き卵、ごはんの順に加え、卵に火が通るまで炒める。',
      'しょうゆで味を調える。',
    ],
    reward: 40,
  },
  {
    id: 'tomato-pasta',
    category: 'noodles',
    name: 'トマトパスタ',
    sample: 'pasta',
    difficulty: 2,
    rarity: 'rare',
    minutes: 20,
    ingredients: ['パスタ 100g', 'カットトマト 150g', 'ツナ 1/2缶', '塩・オリーブ油 少々'],
    steps: [
      'パスタを袋の表示どおりにゆでる。',
      'フライパンでトマトとツナを温め、塩で味を調える。',
      'パスタを加え、オリーブ油を絡める。',
    ],
    reward: 40,
  },
  {
    id: 'cream-soup',
    category: 'soup',
    name: 'きのこのクリームスープ',
    sample: 'soup',
    difficulty: 2,
    rarity: 'rare',
    minutes: 20,
    ingredients: [
      'きのこ 1/2袋',
      '玉ねぎ 1/4個',
      '牛乳 150ml',
      '水 100ml',
      'コンソメ 小さじ1',
      'バター 5g',
    ],
    steps: [
      '薄切りの玉ねぎときのこをバターで炒める。',
      '水とコンソメを加え、野菜が柔らかくなるまで煮る。',
      '牛乳を加えて沸騰させずに温める。',
    ],
    reward: 40,
  },
  {
    id: 'curry',
    category: 'rice',
    name: 'カレー',
    sample: 'curry',
    difficulty: 3,
    rarity: 'special',
    minutes: 30,
    ingredients: [
      'ごはん 1膳',
      '玉ねぎ 1/4個',
      'じゃがいも 1個',
      'にんじん 1/4本',
      'カレールウ 1皿分',
      '水 ルウの表示量',
    ],
    steps: [
      '野菜を小さめに切り、鍋で軽く炒める。',
      '水を加え、野菜が柔らかくなるまで煮る。',
      '火を止めてルウを溶かし、弱火でとろみをつけてごはんに添える。',
    ],
    reward: 70,
  },
  {
    id: 'omurice',
    category: 'rice',
    name: 'ふんわりオムライス',
    sample: 'rice',
    difficulty: 3,
    rarity: 'special',
    minutes: 25,
    ingredients: ['ごはん 1膳', '卵 2個', '玉ねぎ 1/4個', 'ケチャップ 大さじ2', '油 少々'],
    steps: [
      'みじん切りの玉ねぎを炒め、ごはんとケチャップを混ぜて皿に盛る。',
      '油をひいたフライパンに溶き卵を広げ、全体に火を通す。',
      '卵をごはんにかぶせ、ケチャップを添える。',
    ],
    reward: 70,
  },
  {
    id: 'gratin',
    category: 'main',
    name: 'とろりマカロニグラタン',
    sample: 'pasta',
    difficulty: 3,
    rarity: 'special',
    minutes: 35,
    ingredients: [
      'マカロニ 50g',
      '玉ねぎ 1/4個',
      '牛乳 150ml',
      '薄力粉 大さじ1',
      'バター 10g',
      'チーズ 20g',
    ],
    steps: [
      'マカロニを袋の表示どおりにゆでる。',
      '薄切りの玉ねぎをバターで炒め、薄力粉を加えて混ぜる。',
      '牛乳を少しずつ加え、混ぜながらとろみをつける。',
      '耐熱皿にマカロニとソースを入れ、チーズをのせてトースターで焼き色をつける。',
    ],
    reward: 70,
  },
]

// Resolve the complete recipe registry before saved cards and recognition candidates
// are validated. The larger character and cosmetic catalog remains independently loaded.
export const recipes: Recipe[] = mergeById(
  legacyRecipes,
  ([...staples, ...mainsAndSides] as Omit<ExpansionRecipe, 'artPath'>[]).map(adaptRecipe),
)
