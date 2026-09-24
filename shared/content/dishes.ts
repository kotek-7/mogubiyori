/** Broad meal classifications do not grant collectible recipe cards. */
export type GenericDish = {
  id: string
  name: string
  sample: 'rice' | 'pasta' | 'curry' | 'soup'
  description: string
  artPath?: string
}

export const genericDishes: GenericDish[] = [
  {
    id: 'generic-pasta',
    name: 'パスタ',
    sample: 'pasta',
    description: 'ソースや具材を問わないパスタ。',
  },
  {
    id: 'generic-curry',
    name: 'カレー',
    sample: 'curry',
    description: '具材や味付けを問わないカレー。',
  },
  {
    id: 'generic-fried-rice',
    name: 'チャーハン',
    sample: 'rice',
    description: 'ごはんと具材を炒めた料理。',
  },
  {
    id: 'generic-hamburg',
    name: 'ハンバーグ',
    sample: 'rice',
    description: 'ソースや付け合わせを問わないハンバーグ。',
    artPath: '/expansion/assets/recipes/r-onion-hamburg-steak.svg',
  },
  {
    id: 'generic-onigiri',
    name: 'おにぎり',
    sample: 'rice',
    description: '具材や形を問わないおにぎり。',
  },
  {
    id: 'generic-donburi',
    name: '丼もの',
    sample: 'rice',
    description: 'ごはんの上に具材をのせた丼もの。',
  },
  {
    id: 'generic-udon',
    name: 'うどん',
    sample: 'pasta',
    description: 'つゆや具材を問わないうどん。',
  },
  { id: 'generic-soba', name: 'そば', sample: 'pasta', description: 'つゆや具材を問わないそば。' },
  {
    id: 'generic-ramen',
    name: 'ラーメン',
    sample: 'pasta',
    description: 'スープや具材を問わないラーメン。',
  },
  {
    id: 'generic-yakisoba',
    name: '焼きそば',
    sample: 'pasta',
    description: '味付けや具材を問わない焼きそば。',
  },
  {
    id: 'generic-soup',
    name: 'スープ',
    sample: 'soup',
    description: '具材や味付けを問わないスープ。',
  },
  {
    id: 'generic-miso-soup',
    name: 'みそ汁',
    sample: 'soup',
    description: '具材を問わないみそ汁。',
  },
  {
    id: 'generic-salad',
    name: 'サラダ',
    sample: 'rice',
    description: '野菜や具材を盛り合わせたサラダ。',
  },
  {
    id: 'generic-stir-fry',
    name: '炒め物',
    sample: 'rice',
    description: '肉や野菜などを炒めた料理。',
  },
  { id: 'generic-stew', name: '煮物', sample: 'soup', description: '肉や魚、野菜などを煮た料理。' },
  {
    id: 'generic-grilled-fish',
    name: '焼き魚',
    sample: 'rice',
    description: '魚の種類や味付けを問わない焼き魚。',
  },
]

export function genericDishById(id?: string): GenericDish | undefined {
  return genericDishes.find((dish) => dish.id === id)
}
