import { describe, expect, it } from 'vitest'
import dishSource from '../../content/meal-dishes.json' with { type: 'json' }
import { dishCategories, genericDishById, genericDishes } from '../../shared/content/dishes'
import { applyGameCommand } from '../../shared/game/commands'
import { commandResponseSchema, gameCommandSchema } from '../../shared/game/contracts'
import { chooseStarter, feed, initialGame, shiftDay } from '../../shared/game/game'
import { decodeGame } from '../../shared/game/stateCodec'
import { suggestMealItem } from '../../shared/meals/analysis'
import { foodGroupLabels } from '../../shared/meals/types'

// Published IDs and meal defaults from the catalog before the JSON-source expansion.
const publishedDishes = `
generic-pasta|パスタ|noodles|pasta|staple
generic-curry|カレー|rice|curry|staple
generic-fried-rice|チャーハン|rice|rice|staple
generic-hamburg|ハンバーグ|meat|rice|protein
generic-onigiri|おにぎり|rice|rice|staple
generic-donburi|丼もの|rice|rice|staple
generic-udon|うどん|noodles|pasta|staple
generic-soba|そば|noodles|pasta|staple
generic-ramen|ラーメン|noodles|pasta|staple
generic-yakisoba|焼きそば|noodles|pasta|staple
generic-soup|スープ|soup_hotpot|soup|
generic-miso-soup|みそ汁|soup_hotpot|soup|
generic-salad|サラダ|vegetables|rice|vegetable
generic-stir-fry|炒め物|other|rice|
generic-stew|煮物|other|soup|
generic-grilled-fish|焼き魚|seafood|rice|protein
generic-plain-rice|白ごはん|rice|rice|staple
generic-brown-rice|玄米・雑穀ごはん|rice|rice|staple
generic-omelet-rice|オムライス|rice|rice|staple,protein
generic-hayashi-rice|ハヤシライス|rice|curry|staple,protein
generic-keema-curry|キーマカレー|rice|curry|staple,protein
generic-dry-curry|ドライカレー|rice|curry|staple
generic-sushi|寿司|rice|rice|staple
generic-chirashi-sushi|ちらし寿司|rice|rice|staple
generic-inari-sushi|いなり寿司|rice|rice|staple,protein
generic-sushi-roll|巻き寿司|rice|rice|staple
generic-takikomi-rice|炊き込みごはん|rice|rice|staple
generic-mazegohan|混ぜごはん|rice|rice|staple
generic-pilaf|ピラフ|rice|rice|staple
generic-risotto|リゾット|rice|rice|staple
generic-doria|ドリア|rice|rice|staple
generic-porridge|おかゆ|rice|rice|staple
generic-zosui|雑炊|rice|rice|staple
generic-ochazuke|お茶漬け|rice|rice|staple
generic-egg-over-rice|卵かけごはん|rice|rice|staple,protein
generic-gyudon|牛丼|rice|rice|staple,protein
generic-oyakodon|親子丼|rice|rice|staple,protein
generic-katsudon|カツ丼|rice|rice|staple,protein
generic-pork-rice-bowl|豚丼|rice|rice|staple,protein
generic-tendon|天丼|rice|rice|staple
generic-seafood-rice-bowl|海鮮丼|rice|rice|staple,protein
generic-eel-rice-bowl|うな丼・うな重|rice|rice|staple,protein
generic-bibimbap|ビビンバ|rice|rice|staple,vegetable
generic-taco-rice|タコライス|rice|rice|staple,protein,vegetable
generic-natto-rice|納豆ごはん|rice|rice|staple,protein
generic-mochi|餅|rice|rice|staple
generic-somen|そうめん|noodles|pasta|staple
generic-nyumen|にゅうめん|noodles|pasta|staple
generic-cold-ramen|冷やし中華|noodles|pasta|staple
generic-tsukemen|つけ麺|noodles|pasta|staple
generic-mazesoba|まぜそば・油そば|noodles|pasta|staple
generic-tantanmen|担々麺|noodles|pasta|staple
generic-champon|ちゃんぽん|noodles|pasta|staple
generic-sara-udon|皿うどん|noodles|pasta|staple
generic-yaki-udon|焼きうどん|noodles|pasta|staple
generic-curry-udon|カレーうどん|noodles|pasta|staple
generic-napolitan|ナポリタン|noodles|pasta|staple
generic-meat-sauce-pasta|ミートソースパスタ|noodles|pasta|staple,protein
generic-carbonara|カルボナーラ|noodles|pasta|staple,protein,dairy
generic-peperoncino|ペペロンチーノ|noodles|pasta|staple
generic-udon-hotpot|煮込みうどん|noodles|pasta|staple
generic-pho|フォー|noodles|pasta|staple
generic-bifun|ビーフン|noodles|pasta|staple
generic-bread|パン|bread|rice|staple
generic-plain-bread|食パン・トースト|bread|rice|staple
generic-bread-roll|ロールパン|bread|rice|staple
generic-croissant|クロワッサン|bread|rice|staple
generic-baguette|フランスパン|bread|rice|staple
generic-sandwich|サンドイッチ|bread|rice|staple
generic-hot-sandwich|ホットサンド|bread|rice|staple
generic-hamburger|ハンバーガー|bread|rice|staple
generic-hot-dog|ホットドッグ|bread|rice|staple,protein
generic-pizza|ピザ|bread|rice|staple
generic-french-toast|フレンチトースト|bread|rice|staple
generic-pancakes|パンケーキ|bread|rice|staple
generic-okonomiyaki|お好み焼き|bread|rice|staple,vegetable
generic-takoyaki|たこ焼き|bread|rice|staple,protein
generic-chijimi|チヂミ|bread|rice|staple
generic-nikuman|肉まん|bread|rice|staple,protein
generic-bagel|ベーグル|bread|rice|staple
generic-cereal|シリアル|bread|rice|staple
generic-oatmeal|オートミール|bread|rice|staple
generic-karaage|唐揚げ|meat|rice|protein
generic-tonkatsu|とんかつ|meat|rice|protein
generic-chicken-katsu|チキンカツ|meat|rice|protein
generic-menchi-katsu|メンチカツ|meat|rice|protein
generic-korokke|コロッケ|other|rice|
generic-gyoza|餃子|meat|rice|
generic-shumai|焼売|meat|rice|
generic-spring-roll|春巻き|meat|rice|
generic-yakiniku|焼肉|meat|rice|protein
generic-steak|ステーキ|meat|rice|protein
generic-roast-beef|ローストビーフ|meat|rice|protein
generic-pork-ginger|豚のしょうが焼き|meat|rice|protein
generic-chicken-teriyaki|鶏の照り焼き|meat|rice|protein
generic-yakitori|焼き鳥|meat|rice|protein
generic-steamed-chicken|蒸し鶏|meat|rice|protein
generic-bang-bang-chicken|棒棒鶏|meat|rice|protein
generic-meatballs|肉団子|meat|rice|protein
generic-nikujaga|肉じゃが|meat|rice|protein
generic-pork-belly-stew|豚の角煮|meat|rice|protein
generic-sweet-sour-pork|酢豚|meat|rice|protein
generic-twice-cooked-pork|回鍋肉|meat|rice|protein,vegetable
generic-pepper-steak|青椒肉絲|meat|rice|protein,vegetable
generic-sausage|ソーセージ・ウインナー|meat|rice|protein
generic-chicken-nanban|チキン南蛮|meat|rice|protein
generic-meat-vegetable-stir-fry|肉野菜炒め|meat|rice|protein,vegetable
generic-meat-saute|肉のソテー|meat|rice|protein
generic-sashimi|刺身|seafood|rice|protein
generic-simmered-fish|煮魚|seafood|rice|protein
generic-saba-miso|さばのみそ煮|seafood|rice|protein
generic-fish-teriyaki|魚の照り焼き|seafood|rice|protein
generic-fish-meuniere|魚のムニエル|seafood|rice|protein
generic-fish-foil-bake|魚のホイル焼き|seafood|rice|protein
generic-fish-fry|魚のフライ|seafood|rice|protein
generic-shrimp-fry|エビフライ|seafood|rice|protein
generic-fried-oyster|カキフライ|seafood|rice|protein
generic-shrimp-chili|エビチリ|seafood|rice|protein
generic-shrimp-mayo|エビマヨ|seafood|rice|protein
generic-carpaccio|カルパッチョ|other|rice|
generic-seafood-nanbanzuke|魚の南蛮漬け|seafood|rice|protein
generic-clam-sake-steam|あさりの酒蒸し|seafood|rice|protein
generic-aquapazza|アクアパッツァ|seafood|rice|protein
generic-ahijo|アヒージョ|other|rice|
generic-fish-cake|かまぼこ・ちくわ|seafood|rice|protein
generic-fried-egg|目玉焼き|egg_soy|rice|protein
generic-rolled-omelet|卵焼き|egg_soy|rice|protein
generic-omelet|オムレツ|egg_soy|rice|protein
generic-scrambled-eggs|スクランブルエッグ|egg_soy|rice|protein
generic-boiled-egg|ゆで卵|egg_soy|rice|protein
generic-onsen-egg|温泉卵|egg_soy|rice|protein
generic-chawanmushi|茶碗蒸し|egg_soy|soup|protein
generic-chilled-tofu|冷ややっこ|egg_soy|rice|protein
generic-tofu-steak|豆腐ステーキ|egg_soy|rice|protein
generic-agedashi-tofu|揚げ出し豆腐|egg_soy|rice|protein
generic-mapo-tofu|麻婆豆腐|egg_soy|rice|protein
generic-natto|納豆|egg_soy|rice|protein
generic-atsuage|厚揚げ|egg_soy|rice|protein
generic-shiraae|白あえ|egg_soy|rice|protein
generic-iridofu|炒り豆腐|egg_soy|rice|protein
generic-simmered-beans|煮豆|egg_soy|rice|protein
generic-edamame|枝豆|egg_soy|rice|protein
generic-niratama|にら玉|egg_soy|rice|protein,vegetable
generic-nikudofu|肉豆腐|egg_soy|rice|protein
generic-vegetable-stir-fry|野菜炒め|vegetables|rice|vegetable
generic-vegetable-simmer|野菜の煮物|vegetables|soup|vegetable
generic-potato-salad|ポテトサラダ|vegetables|rice|
generic-macaroni-salad|マカロニサラダ|vegetables|rice|staple
generic-coleslaw|コールスロー|vegetables|rice|vegetable
generic-ohitashi|おひたし|vegetables|rice|vegetable
generic-gomaae|ごまあえ|vegetables|rice|vegetable
generic-namul|ナムル|vegetables|rice|vegetable
generic-sunomono|酢の物|other|rice|
generic-kinpira|きんぴら|vegetables|rice|vegetable
generic-hijiki|ひじきの煮物|vegetables|rice|vegetable
generic-kiriboshi-daikon|切り干し大根の煮物|vegetables|rice|vegetable
generic-pickles|漬物|vegetables|rice|vegetable
generic-kimchi|キムチ|vegetables|rice|vegetable
generic-ratatouille|ラタトゥイユ|vegetables|soup|vegetable
generic-mapo-eggplant|麻婆なす|vegetables|rice|vegetable
generic-tempura|天ぷら|other|rice|
generic-pork-miso-soup|豚汁|soup_hotpot|soup|protein
generic-clear-soup|お吸い物|soup_hotpot|soup|
generic-egg-soup|卵スープ|soup_hotpot|soup|protein
generic-corn-soup|コーンスープ|soup_hotpot|soup|
generic-potage|ポタージュ|soup_hotpot|soup|
generic-minestrone|ミネストローネ|soup_hotpot|soup|vegetable
generic-cream-stew|クリームシチュー|soup_hotpot|soup|
generic-beef-stew|ビーフシチュー|soup_hotpot|soup|protein
generic-pot-au-feu|ポトフ|soup_hotpot|soup|vegetable
generic-oden|おでん|soup_hotpot|soup|
generic-hotpot|鍋料理|soup_hotpot|soup|
generic-sukiyaki|すき焼き|soup_hotpot|soup|protein
generic-shabu-shabu|しゃぶしゃぶ|soup_hotpot|soup|protein
generic-kimchi-hotpot|キムチ鍋|soup_hotpot|soup|vegetable
generic-yudofu|湯豆腐|soup_hotpot|soup|protein
generic-gratin|グラタン|other|rice|
generic-fruit|果物|sweets|rice|fruit
generic-banana|バナナ|sweets|rice|fruit
generic-apple|りんご|sweets|rice|fruit
generic-citrus|みかん・オレンジ|sweets|rice|fruit
generic-berries|いちご・ベリー|sweets|rice|fruit
generic-yogurt|ヨーグルト|sweets|rice|dairy
generic-cheese|チーズ|sweets|rice|dairy
generic-pudding|プリン|sweets|rice|
generic-jelly|ゼリー|sweets|rice|
generic-ice-cream|アイスクリーム|sweets|rice|
generic-cake|ケーキ|sweets|rice|
generic-cookies|クッキー・ビスケット|sweets|rice|
generic-doughnut|ドーナツ|sweets|rice|
generic-crepe|クレープ|sweets|rice|
generic-cream-puff|シュークリーム|sweets|rice|
generic-dango|団子|sweets|rice|staple
generic-daifuku|大福|sweets|rice|staple
generic-taiyaki|たい焼き|sweets|rice|
generic-yokan|ようかん|sweets|rice|
generic-roasted-sweet-potato|焼きいも・ふかしいも|sweets|rice|
generic-happosai|八宝菜|other|rice|
generic-fried-food|揚げ物|other|rice|
generic-steamed-food|蒸し料理|other|rice|
generic-aemono|あえ物|other|rice|
`.trim()

const today = '2026-09-25'
const start = () => chooseStarter(initialGame(today), 'komugi')

describe('generic meal classification across commands, rewards and saves', () => {
  it('keeps the catalog addressable with unambiguous IDs, names, aliases and valid groups', () => {
    expect(new Set(genericDishes.map((dish) => dish.id)).size).toBe(genericDishes.length)
    expect(new Set(genericDishes.map((dish) => dish.name)).size).toBe(genericDishes.length)
    expect(new Set(genericDishes.map((dish) => dish.category))).toEqual(
      new Set(Object.keys(dishCategories)),
    )
    const names = new Map<string, string>()
    for (const dish of genericDishes) {
      expect(dish.id).toMatch(/^generic-[a-z]+(?:-[a-z]+)*$/)
      expect(dish.description.trim()).not.toBe('')
      expect(dishCategories).toHaveProperty(dish.category)
      expect(['rice', 'pasta', 'curry', 'soup']).toContain(dish.sample)
      expect(dish).not.toHaveProperty('foodGroups')
      expect(dish.aliases.length).toBeGreaterThan(0)
      expect(new Set(dish.suggestedGroups).size).toBe(dish.suggestedGroups.length)
      for (const group of dish.suggestedGroups) expect(foodGroupLabels).toHaveProperty(group)
      for (const name of [dish.name, ...dish.aliases]) {
        expect(name.trim()).toBe(name)
        expect(name).not.toBe('')
        const normalized = name
          .normalize('NFKC')
          .toLowerCase()
          .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
        expect(names.get(normalized) ?? dish.id, name).toBe(dish.id)
        names.set(normalized, dish.id)
      }
    }
  })

  it('preserves every published ID and its saved-meal defaults when merging the JSON catalog', () => {
    expect(genericDishes).toEqual(dishSource)
    for (const entry of publishedDishes.split('\n')) {
      const [id, name, category, sample, groups] = entry.split('|')
      expect(genericDishById(id), id).toMatchObject({
        id,
        name,
        category,
        sample,
        suggestedGroups: groups ? groups.split(',') : [],
      })
    }
  })

  it('keeps alternate incoming IDs attached to their existing meal classifications', () => {
    const equivalentNames = [
      ['generic-omelet-rice', 'オムライス', 'generic-omurice'],
      ['generic-cold-ramen', '冷やし中華', 'generic-hiyashi-chuka'],
      ['generic-hamburger', 'ハンバーガー', 'generic-burger'],
      ['generic-porridge', 'おかゆ', 'generic-rice-porridge'],
      ['generic-mazesoba', 'まぜそば・油そば', 'generic-abura-soba'],
      ['generic-eel-rice-bowl', 'うな丼・うな重', 'generic-unadon'],
      ['generic-pork-ginger', '豚のしょうが焼き', 'generic-shogayaki'],
      ['generic-chicken-teriyaki', '鶏の照り焼き', 'generic-teriyaki-chicken'],
    ] as const
    for (const [id, name, duplicateId] of equivalentNames) {
      expect(genericDishById(id)?.name).toBe(name)
      expect(genericDishById(duplicateId)).toBeUndefined()
    }
    expect(genericDishById('generic-fried-rice')?.aliases).toContain('焼き飯')
    expect(genericDishById('generic-hamburger')?.aliases).toContain('burger')
    expect(genericDishById('generic-eel-rice-bowl')?.aliases).toContain('うな丼')
    expect(genericDishById('generic-chicken-rice')?.aliases).not.toContain('チキンライス')
    expect(genericDishById('generic-green-curry')?.aliases).not.toContain('タイカレー')
    expect(genericDishById('generic-latte')?.aliases).not.toContain('カプチーノ')
  })

  it('offers distinct world dishes and retains broad choices for uncertain photographs', () => {
    const choices = [
      ['generic-biryani', 'rice'],
      ['generic-butter-chicken', 'rice'],
      ['generic-dosa', 'bread'],
      ['generic-idli', 'bread'],
      ['generic-samosa', 'other'],
      ['generic-rice', 'rice'],
      ['generic-dessert', 'sweets'],
      ['generic-drink', 'drinks'],
      ['generic-bento', 'meals'],
      ['generic-assorted-dishes', 'meals'],
    ] as const
    for (const [id, category] of choices) {
      expect(genericDishById(id), id).toMatchObject({ id, category })
    }
    for (const id of [
      'generic-biryani',
      'generic-butter-chicken',
      'generic-dosa',
      'generic-idli',
      'generic-samosa',
    ]) {
      expect(genericDishById(id)?.artPath).toMatch(/^\/expansion\/assets\/recipes\/r-[a-z-]+\.svg$/)
    }
  })

  it('keeps uncertain mixed meals and drinks free of inferred ingredient groups', () => {
    for (const id of [
      'generic-dessert',
      'generic-drink',
      'generic-bento',
      'generic-set-meal',
      'generic-assorted-dishes',
      'generic-thali',
      'generic-mezze',
      'generic-smoothie',
      'generic-juice',
      'generic-latte',
      'generic-green-curry',
    ]) {
      expect(suggestMealItem(id), id).toMatchObject({
        dishId: id,
        groups: [],
        portion: 'unknown',
        groupsConfirmed: false,
      })
    }
    for (const [id, groups] of [
      ['generic-rice', ['staple']],
      ['generic-biryani', ['staple']],
      ['generic-dosa', ['staple']],
      ['generic-idli', ['staple']],
      ['generic-milk', ['dairy']],
      ['generic-grapes', ['fruit']],
      ['generic-roast-chicken', ['protein']],
    ] as const) {
      expect(suggestMealItem(id), id).toMatchObject({
        dishId: id,
        groups,
        portion: 'unknown',
        groupsConfirmed: false,
      })
    }
  })

  it('preserves the original classifications and their conservative food group suggestions', () => {
    const legacy = [
      ['generic-pasta', 'パスタ', ['staple']],
      ['generic-curry', 'カレー', ['staple']],
      ['generic-fried-rice', 'チャーハン', ['staple']],
      ['generic-hamburg', 'ハンバーグ', ['protein']],
      ['generic-onigiri', 'おにぎり', ['staple']],
      ['generic-donburi', '丼もの', ['staple']],
      ['generic-udon', 'うどん', ['staple']],
      ['generic-soba', 'そば', ['staple']],
      ['generic-ramen', 'ラーメン', ['staple']],
      ['generic-yakisoba', '焼きそば', ['staple']],
      ['generic-soup', 'スープ', []],
      ['generic-miso-soup', 'みそ汁', []],
      ['generic-salad', 'サラダ', ['vegetable']],
      ['generic-stir-fry', '炒め物', []],
      ['generic-stew', '煮物', []],
      ['generic-grilled-fish', '焼き魚', ['protein']],
    ] as const
    for (const [id, name, groups] of legacy) {
      expect(suggestMealItem(id)).toMatchObject({ dishId: id, name, groups })
    }
  })

  it.each(genericDishes)('preserves $name in the command receipt and restored save', (dish) => {
    const command = gameCommandSchema.parse({
      type: 'feed',
      input: { title: ' ', sample: 'rice', dishId: dish.id },
    })
    const result = applyGameCommand(start(), command, { today, mealId: `meal-${dish.id}` })
    const response = { snapshot: { state: result.state, revision: 1 }, receipt: result.receipt }
    expect(commandResponseSchema.parse(JSON.parse(JSON.stringify(response)))).toEqual(response)
    expect(decodeGame(JSON.parse(JSON.stringify(result.state)), today)).toEqual(result.state)
    expect(result.receipt?.meal).toMatchObject({
      dishId: dish.id,
      title: dish.name,
      sample: dish.sample,
      xp: 45,
      coins: 30,
      cardBonus: 0,
    })
    expect(result.receipt?.meal).not.toHaveProperty('recipeId')
    expect(result.receipt?.newCards).toEqual([])
    expect(result.state.cards).toEqual([])
  })

  it('keeps generic curry separate from the collectible curry recipe and its repeat rewards', () => {
    const generic = { title: '', sample: 'rice', dishId: 'generic-curry' }
    const first = feed({ ...start(), subscriptionPlan: 'premium' }, generic, {
      mealId: 'generic-first',
    })
    const repeat = feed(first, generic, { mealId: 'generic-repeat' })
    expect(first.coins).toBe(150)
    expect(repeat.coins).toBe(150)
    expect(repeat.meals[0]).toMatchObject({ xp: 45, coins: 0, cardBonus: 0 })
    expect(repeat.cards).toEqual([])

    const recipeInput = { title: 'カレー', sample: 'curry', recipeId: 'curry' }
    const recipe = feed(repeat, recipeInput, { mealId: 'recipe-first' })
    expect(recipe.cards).toEqual(['curry'])
    expect(recipe.meals[0]).toMatchObject({ recipeId: 'curry', xp: 45, cardBonus: 70, coins: 70 })
    expect(recipe.meals[0]).not.toHaveProperty('dishId')
    const recipeRepeat = feed(recipe, recipeInput, { mealId: 'recipe-repeat' })
    expect(recipeRepeat.meals[0]).toMatchObject({ xp: 30, cardBonus: 0, coins: 0 })
  })

  it('preserves daily and streak rewards for generic meals', () => {
    let state = start()
    for (let offset = 0; offset < 3; offset += 1) {
      state = applyGameCommand(
        state,
        { type: 'feed', input: { title: '', sample: 'rice', dishId: 'generic-pasta' } },
        { today: shiftDay(today, offset), mealId: `meal-day-${offset}` },
      ).state
    }
    expect(state.meals.map(({ coins }) => coins)).toEqual([60, 30, 30])
    expect(state.meals[0]).toMatchObject({ streakBonus: 30, xp: 45, cardBonus: 0 })
    expect(state.cards).toEqual([])
  })

  it('preserves an edited title and ignores unregistered classifications', () => {
    const classified = feed(
      start(),
      { title: '  お昼のパスタ  ', sample: 'rice', dishId: 'generic-pasta' },
      { mealId: 'custom-title' },
    )
    expect(classified.meals[0]).toMatchObject({ title: 'お昼のパスタ', sample: 'pasta' })
    const unknown = feed(
      start(),
      { title: '', sample: 'soup', recipeId: 'missing-recipe', dishId: 'missing-dish' },
      { mealId: 'unknown' },
    )
    expect(unknown.meals[0]).toMatchObject({ title: '今日のごはん', sample: 'soup', xp: 45 })
    expect(unknown.meals[0]).not.toHaveProperty('dishId')
    expect(unknown.meals[0]).not.toHaveProperty('recipeId')
    expect(unknown.cards).toEqual([])
  })

  it('prefers a valid exact recipe and falls back to a valid generic dish', () => {
    const recipe = feed(
      start(),
      { title: 'カレー', sample: 'curry', recipeId: 'curry', dishId: 'generic-pasta' },
      { mealId: 'both-valid' },
    )
    expect(recipe.meals[0]).toMatchObject({ recipeId: 'curry', sample: 'curry', cardBonus: 70 })
    expect(recipe.meals[0]).not.toHaveProperty('dishId')
    expect(recipe.cards).toEqual(['curry'])
    const fallback = feed(
      start(),
      { title: '', sample: 'rice', recipeId: 'missing-recipe', dishId: 'generic-pasta' },
      { mealId: 'valid-dish' },
    )
    expect(fallback.meals[0]).toMatchObject({
      dishId: 'generic-pasta',
      title: 'パスタ',
      sample: 'pasta',
    })
    expect(fallback.meals[0]).not.toHaveProperty('recipeId')
    expect(fallback.cards).toEqual([])
  })
})
