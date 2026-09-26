import { test, expect } from '@playwright/test'
import {
  advanceXp,
  chooseStarter,
  completeConceptIntro,
  confirmUnclassifiedMeal,
  enablePremium,
  expectFocusedScene,
  feedSample,
  journey,
  navigate,
  nextDay,
  returnToPlaza,
  sampleToTable,
  selectMealRecipe,
  selectedMealRecipe,
  start,
  storedGame,
  submitSample,
  uploadPhoto,
  waitForSceneMotion,
} from './helpers'

async function attachViewport(page: import('@playwright/test').Page, name: string) {
  await waitForSceneMotion(page)
  const path = test.info().outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: false })
  await test.info().attach(name, { path, contentType: 'image/png' })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('each starter appears in meal practice and its choice survives reload', async ({ page }) => {
  for (const [id, name] of [
    ['komugi', 'こむぎ'],
    ['mame', 'まめ'],
    ['shizuku', 'しずく'],
  ]) {
    await completeConceptIntro(page)
    await expect(page.getByRole('group', { name: '最初のなかま' }).getByRole('button')).toHaveCount(
      3,
    )
    await chooseStarter(page, name)
    await expectFocusedScene(page, 'welcome')
    const welcome = journey(page, 'welcome')
    await welcome.getByRole('button', { name: 'サンプル写真を使う', exact: true }).click()
    await welcome.getByRole('button', { name: 'この写真でごはんをあげる', exact: true }).click()
    await expect(welcome.locator('.tutorial-meal-world')).toHaveClass(/is-eating/)
    await expect(welcome.locator('.tutorial-pet-name')).toHaveText(name)
    await page.getByRole('button', { name: 'チュートリアルをスキップしてひろばへ' }).click()
    await waitForSceneMotion(page)
    await page.reload()
    await expect(page.locator('.play-name')).toContainText(name)
    const state = await storedGame(page)
    expect(state.activeId).toBe(id)
    expect(state.companions).toHaveLength(1)
    expect(state.companions[0].id).toBe(id)
    expect(state.xp).toBe(0)
    expect(state.coins).toBe(140)
    expect(state.meals).toEqual([])
    await page.evaluate(() => localStorage.removeItem('mogubiyori-v1'))
    await page.reload()
  }
})

test('the first meal rewards cooking while keeping the initial form recognizable', async ({
  page,
}) => {
  await start(page)
  await page.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await expectFocusedScene(page, 'photo')
  await sampleToTable(page, 'curry')
  await expectFocusedScene(page, 'serve')
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expectFocusedScene(page, 'eating')
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await expectFocusedScene(page, 'xp')
  await expect(journey(page, 'xp').getByLabel('45 XP獲得', { exact: true })).toBeVisible()
  await advanceXp(page)
  await expectFocusedScene(page, 'card')
  await expect(journey(page)).toContainText('カレー')
  await expect(journey(page).locator('.feast-growth-art')).toHaveCount(0)
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expectFocusedScene(page, 'streak')
  await expect(journey(page, 'streak').locator('.streak-celebration-number strong')).toHaveText('1')
  await expect(journey(page, 'streak').locator('.streak-celebration-prize')).toHaveCount(0)
  await page.getByRole('button', { name: 'つづける', exact: true }).click()
  await expectFocusedScene(page, 'mealReport')
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(page.locator('.play-name')).toContainText('うまれたて')
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
  await page.reload()
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
  expect((await storedGame(page)).xp).toBe(45)
  expect((await storedGame(page)).cards).toEqual(['curry'])
})

test('varied meals grow the companion and visitors join only after being fed', async ({ page }) => {
  test.setTimeout(90000)
  await start(page)
  await enablePremium(page)
  const dishes = [
    'egg-rice',
    'tofu-soup',
    'curry',
    'onigiri',
    'miso-soup',
    'tomato-pasta',
    'cream-soup',
  ]
  for (const [index, recipe] of dishes.entries()) {
    await feedSample(page, recipe)
    const scenes = await returnToPlaza(page)
    expect(scenes.includes('growth')).toBe(index === 2 || index === 6)
    expect(scenes.includes('arrivals')).toBe(index === 6)
    await expect(page.locator('.play-name')).toContainText(
      index < 2 ? 'うまれたて' : index < 6 ? 'ちびっこ' : 'わんぱく',
    )
  }
  expect((await storedGame(page)).companions).toHaveLength(1)
  await expect(page.locator('.field-visitor')).toHaveCount(3)
  await page.getByRole('button', { name: 'お客さんのまめにごはんをあげる' }).click()
  expect((await storedGame(page)).companions).toHaveLength(1)
  await submitSample(page, 'fried-rice', 'まめ')
  const joinedScenes = await returnToPlaza(page)
  expect(joinedScenes).toContain('joined')
  await expect(page.locator('.play-name')).toContainText('まめ')
  const state = await storedGame(page)
  expect(state.companions.map((buddy) => [buddy.id, buddy.xp])).toEqual([
    ['komugi', 315],
    ['mame', 45],
  ])
  expect(state.visitors).not.toContain('mame')
  expect(state.visitors).toHaveLength(3)
  await navigate(page, 'ずかん')
  await page
    .getByRole('group', { name: 'ずかんのカテゴリ' })
    .getByRole('button', { name: 'なかま', exact: true })
    .click()
  await expect(page.locator('.friend-card:not(.is-unknown)')).toHaveCount(2)
  await expect(page.locator('.friend-card.is-unknown')).toHaveCount(1)
  await expect(page.locator('.friend-visitor')).toHaveCount(3)
  await page.getByRole('button', { name: 'こむぎと暮らす' }).click()
  await expect(page.locator('.play-name')).toContainText('こむぎ')
  expect((await storedGame(page)).xp).toBe(315)
})

test('repeated recipes reduce growth while the card bonus is awarded once', async ({ page }) => {
  test.setTimeout(60000)
  await start(page)
  await enablePremium(page)
  for (const xp of [45, 30, 15]) {
    await page.locator('.play-feed').click()
    await sampleToTable(page, 'curry')
    if (xp < 45) await expect(journey(page)).toContainText(`+${xp} XP`)
    await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
    await expect(journey(page, 'eating')).toBeVisible()
    expect((await storedGame(page)).meals[0].xp).toBe(xp)
    await returnToPlaza(page)
  }
  const state = await storedGame(page)
  expect(state.xp).toBe(90)
  expect(state.coins).toBe(240)
  expect(state.cards).toEqual(['curry'])
  expect(state.meals.map((meal) => meal.cardBonus)).toEqual([0, 0, 70])
  await navigate(page, 'ずかん')
  await expect(page.locator('.recipe-collection-card.is-discovered')).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'カレーのレシピを見る', exact: true }),
  ).toBeVisible()
})

test('an undiscovered recipe guides cooking and becomes a collected card afterward', async ({
  page,
}) => {
  await start(page)
  await navigate(page, 'ずかん')
  await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill('カレー')
  const curry = page.getByRole('button', { name: 'カレーのレシピを見る（未獲得）', exact: true })
  await expect(curry).toHaveClass(/is-unknown/)
  await curry.click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('カレー')
  await expect(page.getByRole('dialog')).toContainText('材料')
  await expect(page.getByRole('dialog')).toContainText('つくりかた')
  await page.getByRole('button', { name: 'この料理を記録する' }).click()
  await expectFocusedScene(page, 'photo')
  await page.getByRole('button', { name: 'サンプル写真で体験する' }).click()
  await expect(selectedMealRecipe(page)).toHaveText('カレー')
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  expect(await returnToPlaza(page)).toContain('card')
  await navigate(page, 'ずかん')
  await expect(page.getByRole('button', { name: 'カレーのレシピを見る', exact: true })).toHaveClass(
    /is-discovered/,
  )
})

test('daily login and three/seven-day cooking bonuses cannot be claimed twice', async ({
  page,
}) => {
  test.setTimeout(60000)
  // This checks seven days of accounting; animation timing is covered by streak.spec.ts.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await start(page)
  await page.reload()
  expect((await storedGame(page)).coins).toBe(140)
  for (let day = 1; day <= 7; day += 1) {
    await feedSample(page)
    const state = await storedGame(page)
    if (day === 3) expect(state.meals[0].streakBonus).toBe(30)
    if (day === 7) expect(state.meals[0].streakBonus).toBe(100)
    const scenes = await returnToPlaza(page)
    expect(scenes).toContain('streak')
    if (day === 7) expect(scenes).toContain('gift')
    if (day < 7) await nextDay(page)
  }
  let state = await storedGame(page)
  expect(state.claimedLoginDays).toHaveLength(7)
  expect(new Set(state.claimedLoginDays).size).toBe(7)
  expect(state.coins).toBe(600)
  expect(state.equipped.hat).toBe('sprout')
  expect(state.meals.filter((meal) => meal.streakBonus)).toHaveLength(2)
  await page.reload()
  expect((await storedGame(page)).coins).toBe(600)
  await enablePremium(page)
  await feedSample(page)
  expect(await returnToPlaza(page)).not.toContain('streak')
  state = await storedGame(page)
  expect(state.coins).toBe(600)
  expect(state.meals[0].streakBonus).toBe(0)
  await expect(page.locator('.play-streak')).toContainText('7日連続')
})

test('photo and optional inputs survive going back, and cancellation never feeds', async ({
  page,
}) => {
  await start(page)
  const before = await storedGame(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  const photo = await journey(page).locator('img[src^="data:image/"]').getAttribute('src')
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await expectFocusedScene(page, 'serve')
  await selectMealRecipe(page, 'curry')
  await page.getByText('料理名をつける', { exact: true }).click()
  await page.getByRole('textbox', { name: '料理名（任意）', exact: true }).fill('はじめてのカレー')
  await page.getByRole('button', { name: '写真にもどる', exact: true }).click()
  await expectFocusedScene(page, 'photo')
  await expect(journey(page).locator('img[src^="data:image/"]')).toHaveAttribute('src', photo!)
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await expect(selectedMealRecipe(page)).toHaveText('カレー')
  await page.getByText('料理名をつける', { exact: true }).click()
  await expect(page.getByRole('textbox', { name: '料理名（任意）', exact: true })).toHaveValue(
    'はじめてのカレー',
  )
  await page.getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  expect(await storedGame(page)).toEqual(before)
})

test('a real photo alone persists in the meal album without a required recipe or title', async ({
  page,
}) => {
  await start(page)
  await page.locator('.play-feed').click()
  await uploadPhoto(page)
  await page.getByRole('button', { name: '食卓へ', exact: true }).click()
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await confirmUnclassifiedMeal(page)
  await returnToPlaza(page)
  await page.reload()
  await navigate(page, 'ずかん')
  await page.getByRole('button', { name: 'ごはんの記録' }).click()
  await expect(page.locator('.memory-card')).toHaveCount(1)
  await page.locator('.memory-card').click()
  await expect(page.getByRole('dialog')).toContainText('今日のごはん')
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute(
    'src',
    /^data:image\/jpeg;base64,/,
  )
  const state = await storedGame(page)
  expect(state.meals[0].title).toBe('今日のごはん')
  expect(state.meals[0].photo).toMatch(/^data:image\/jpeg;base64,/)
  expect(state.cards).toEqual([])
})

test('an ordinary meal keeps XP visible until the user returns to the plaza', async ({ page }) => {
  await start(page)
  await enablePremium(page)
  await feedSample(page)
  await returnToPlaza(page)
  await feedSample(page)
  await expect(journey(page, 'xp')).toBeVisible({ timeout: 5000 })
  await expect(journey(page, 'xp').getByRole('progressbar', { name: '次の成長まで' })).toBeVisible()
  await expect(
    journey(page, 'xp').getByRole('button', { name: 'つづける', exact: true }),
  ).toBeVisible()
  await expect(journey(page).getByRole('button', { name: 'ひろばへ' })).toHaveCount(0)
  const saved = await storedGame(page)
  await journey(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
  await expectFocusedScene(page, 'mealReport')
  expect(await storedGame(page)).toEqual(saved)
  await journey(page, 'mealReport').getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(journey(page)).toHaveCount(0)
  expect((await storedGame(page)).meals).toHaveLength(2)
  await expect(page.locator('.play-feed')).toHaveAccessibleName('もう一度あげる')
  await expect(page.locator('.play-condition')).toHaveText('満腹')
})

test('fast-forward advances once and never grants rewards twice', async ({ page }) => {
  await start(page)
  await feedSample(page, 'curry')
  const saved = await storedGame(page)
  await journey(page, 'eating')
    .getByRole('button', { name: '早送り', exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(journey(page, 'xp')).toBeVisible()
  expect(await storedGame(page)).toEqual(saved)
  await advanceXp(page)
  await expect(journey(page, 'card')).toBeVisible()
  expect(await storedGame(page)).toEqual(saved)
  await returnToPlaza(page)
  await page.reload()
  expect(await storedGame(page)).toEqual(saved)
  expect((await storedGame(page)).meals).toHaveLength(1)
})

test('cosmetics can temporarily be bought with insufficient or zero coins', async ({ page }) => {
  await start(page)
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await page.getByRole('button', { name: '購入して使う' }).click()
  expect((await storedGame(page)).coins).toBe(20)
  await navigate(page, 'おみせ')
  await page.locator('.shop-card').first().click()
  await page.getByRole('button', { name: '使う', exact: true }).click()
  await navigate(page, 'おみせ')
  await page.getByRole('button', { name: /ふたばのかんむり/ }).click()
  await page.getByRole('button', { name: '使う', exact: true }).click()
  await expect(page.getByRole('button', { name: /ジェム/ })).toHaveCount(0)
  await navigate(page, 'おみせ')
  const before = await storedGame(page)
  await page.getByRole('button', { name: /コックさんの帽子/ }).click()
  const detail = page.getByRole('dialog')
  await expect(detail.getByRole('button', { name: '購入して使う', exact: true })).toBeEnabled()
  await expect(detail).toContainText('現在はコインが足りなくても購入できます')
  expect(await storedGame(page)).toEqual(before)
  await detail.getByRole('button', { name: '購入して使う', exact: true }).click()
  expect((await storedGame(page)).coins).toBe(0)
  await navigate(page, 'おみせ')
  await page
    .getByRole('group', { name: 'おみせのカテゴリ' })
    .getByRole('button', { name: 'ひろば', exact: true })
    .click()
  await page.getByRole('button', { name: /木もれびのひろば/ }).click()
  await page.getByRole('button', { name: '購入して使う' }).click()
  await expect(page.locator('.play-world')).toHaveClass(/theme-garden/)
  const state = await storedGame(page)
  expect(state.coins).toBe(0)
  expect(state.gems).toBe(0)
  expect(state.equipped).toEqual({
    hat: 'chef',
    neck: 'neck-none',
    bag: 'bag-none',
    room: 'garden',
  })
  expect(state.xp).toBe(0)
  expect(state.meals).toEqual([])
  await page.reload()
  expect(await storedGame(page)).toEqual(state)
  await expect(page.locator('.play-world')).toHaveClass(/theme-garden/)
})

test('mobile scenes keep the main action in view and keyboard cancellation restores focus', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 390, height: 844 })
  await start(page)
  const action = page.locator('.play-feed')
  await expect(page.locator('main .primary-button')).toHaveCount(1)
  const rect = await action.boundingBox()
  expect(rect!.y + rect!.height).toBeLessThan(764)
  await action.click()
  await expectFocusedScene(page, 'photo')
  await page.keyboard.press('Escape')
  await expect(journey(page)).toHaveCount(0)
  await expect(action).toBeFocused()
  await action.click()
  await uploadPhoto(page)
  for (const name of ['食卓へ', 'こむぎにごはんをあげる']) {
    const button = page.getByRole('button', { name, exact: true })
    await expect(button).toBeVisible()
    await waitForSceneMotion(page)
    const bounds = await button.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await attachViewport(page, name === '食卓へ' ? 'mobile-photo' : 'mobile-serve')
    await button.click()
    if (name === 'こむぎにごはんをあげる') await confirmUnclassifiedMeal(page)
  }
  await returnToPlaza(page)
  await expect(page.locator('.play-name')).toContainText('うまれたて')
  await enablePremium(page)
  await feedSample(page, 'curry')
  await returnToPlaza(page)
  await feedSample(page, 'tofu-soup')
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await advanceXp(page)
  await expect(journey(page, 'growth')).toBeVisible()
  await attachViewport(page, 'mobile-growth')
  await returnToPlaza(page)
  for (const route of ['ずかん', 'おみせ', 'ひろば'] as const) {
    await navigate(page, route)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'こむぎをなでる' }).click()
  await expect(page.locator('.play-pet')).toHaveClass(/is-petted/)
  await expect(page.locator('.play-pet .companion-reaction-effects')).toBeVisible()
})

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop-short', width: 1280, height: 720 },
]) {
  test(`${viewport.name} first visit keeps the next action inside the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await completeConceptIntro(page)
    for (const scene of ['choose', 'welcome']) {
      await expect(journey(page, scene)).toBeVisible()
      await waitForSceneMotion(page)
      const action =
        scene === 'welcome'
          ? journey(page, scene).getByRole('button', { name: '今日の料理を一枚', exact: true })
          : journey(page, scene).locator('.journey-primary')
      const bounds = await action.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.y).toBeGreaterThanOrEqual(0)
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await attachViewport(page, `${viewport.name}-${scene}`)
      if (scene === 'choose') await chooseStarter(page)
    }
  })
}

test('submitting across midnight uses the new date before the timer refreshes', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-09-24T14:59:59Z'))
  await page.evaluate(() => localStorage.removeItem('mogubiyori-v1'))
  await page.reload()
  await start(page)
  await page.locator('.play-feed').click()
  await sampleToTable(page)
  await page.clock.setFixedTime(new Date('2026-09-24T15:00:01Z'))
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await confirmUnclassifiedMeal(page)
  await returnToPlaza(page)
  const state = await storedGame(page)
  expect(state.today).toBe('2026-09-25')
  expect(state.meals[0].day).toBe('2026-09-25')
  expect(state.meals.some((meal) => meal.day === '2026-09-24')).toBe(false)
  expect(state.claimedLoginDays).toEqual(['2026-09-24', '2026-09-25'])
  await expect(page.locator('.play-streak')).toContainText('1日連続')
})
