import type { SpeciesId, GrowthStage, Recipe, Item } from '../game/types'
import { recipes } from './recipes'
export { recipes, legacyRecipes, recipeCategories } from './recipes'

export const species: { id: SpeciesId; name: string; description: string }[] = [
  { id: 'komugi', name: 'こむぎ', description: '食いしんぼうで活発な性格。' },
  { id: 'mame', name: 'まめ', description: '人見知りだが食欲は旺盛。' },
  { id: 'shizuku', name: 'しずく', description: '温かいスープを好む。' },
  { id: 'yuzu', name: 'ゆず', description: '好奇心が強く初めての料理にもよく近づく。' },
  { id: 'momo', name: 'もも', description: 'のんびりした性格で食べるのが遅い。' },
  { id: 'goma', name: 'ごま', description: '夕方になると活発になる。' },
]
export const growthStages: ReadonlyArray<{
  stage: GrowthStage
  name: string
  threshold: number
}> = [
  { stage: 0, name: 'うまれたて', threshold: 0 },
  { stage: 1, name: 'ちびっこ', threshold: 120 },
  { stage: 2, name: 'わんぱく', threshold: 300 },
  { stage: 3, name: 'おとな', threshold: 600 },
  { stage: 4, name: 'とっておき', threshold: 1050 },
]
export function recipeById(id?: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id)
}
export const items: Item[] = [
  {
    id: 'none',
    name: 'いつものすがた',
    description: '帽子を外します。',
    kind: 'hat',
    currency: 'coins',
    price: 0,
  },
  {
    id: 'beret',
    name: 'どんぐりベレー',
    description: 'どんぐりをかたどったベレー帽。',
    kind: 'hat',
    currency: 'coins',
    price: 180,
  },
  {
    id: 'sprout',
    name: 'ふたばのかんむり',
    description: '双葉をかたどったかんむり。',
    kind: 'hat',
    currency: 'coins',
    price: 120,
  },
  {
    id: 'chef',
    name: 'コックさんの帽子',
    description: '白いコック帽。',
    kind: 'hat',
    currency: 'gems',
    price: 80,
  },
  {
    id: 'plain',
    name: 'いつものひろば',
    description: '最初のひろば。',
    kind: 'room',
    currency: 'coins',
    price: 0,
  },
  {
    id: 'garden',
    name: '木もれびのひろば',
    description: '大きな木の枝葉から、やわらかな光が差すひろば。',
    kind: 'room',
    currency: 'gems',
    price: 100,
  },
  {
    id: 'night',
    name: '星あかりのひろば',
    description: '星空が見える夜のひろば。',
    kind: 'room',
    currency: 'gems',
    price: 120,
  },
  {
    id: 'seaside',
    name: '夕なぎの浜辺',
    description: '夕焼けの海と、波が寄せる砂浜。',
    kind: 'room',
    currency: 'coins',
    price: 320,
  },
  {
    id: 'brook',
    name: '小川のほとり',
    description: 'せせらぎに木の橋がかかる、緑のほとり。',
    kind: 'room',
    currency: 'coins',
    price: 280,
  },
  {
    id: 'greenhouse',
    name: '温室のひろば',
    description: 'ガラス屋根の下で、草花に囲まれるひろば。',
    kind: 'room',
    currency: 'gems',
    price: 140,
  },
]
