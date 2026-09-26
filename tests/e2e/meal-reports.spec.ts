import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  chooseStarter,
  claimLogin,
  feed,
  initialGame,
  shiftDay,
  todayTokyo,
} from '../../src/app/game/browserGame'
import type { GameState } from '../../src/app/game/browserGame'
import { journey, sampleToTable, start, storedGame, waitForSceneMotion } from './helpers'

async function openSavedGame(page: Page, state: unknown, path = '/') {
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto(path)
  const pathname = new URL(page.url()).pathname
  await expect(
    page.getByRole('heading', {
      name:
        pathname === '/album'
          ? 'ごはんの記録'
          : pathname === '/reports'
            ? '自炊レポート'
            : 'ひろば',
      exact: true,
    }),
  ).toBeVisible()
}

async function reachMealReport(page: Page) {
  for (let step = 0; step < 12; step += 1) {
    const screen = journey(page)
    await expect(screen).toHaveCount(1)
    const scene = await screen.getAttribute('data-scene')
    if (scene === 'mealReport') return screen
    const current = journey(page, scene!)
    await current
      .getByRole('button', {
        name: scene === 'eating' ? '早送り' : /^(つづける|ひろばへ)$/,
        exact: true,
      })
      .click()
    await expect(current).toHaveCount(0)
  }
  throw new Error('The meal report did not appear after feeding')
}

function gameRewards(state: GameState) {
  return {
    xp: state.xp,
    coins: state.coins,
    gems: state.gems,
    cards: state.cards,
    companions: state.companions,
    meals: state.meals,
    owned: state.owned,
    tickets: state.tickets,
  }
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('a meal can be reviewed with a keyboard and its daily report fits a 320px phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  await start(page)
  await page.locator('.play-feed').click()
  await sampleToTable(page, 'curry')
  const disclosure = page.locator('summary').filter({ hasText: '食事の内容を確認' })
  const mealTime = page.getByRole('combobox', { name: '食事の時間', exact: true })
  await expect(disclosure.locator('..')).toHaveAttribute('open', '')
  await expect(mealTime).toBeVisible()
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(disclosure.locator('..')).not.toHaveAttribute('open', '')
  await expect(mealTime).not.toBeVisible()
  await page.keyboard.press('Enter')
  await expect(mealTime).toBeVisible()
  await mealTime.selectOption('dinner')
  await expect(page.getByRole('combobox', { name: '用意のしかた', exact: true })).toHaveCount(0)
  await page.getByRole('combobox', { name: '量', exact: true }).selectOption('regular')
  await page.getByRole('button', { name: '一品追加', exact: true }).click()
  const salad = page.getByRole('group', { name: '料理 2', exact: true })
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(disclosure.locator('..')).not.toHaveAttribute('open', '')
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(disclosure.locator('..')).toHaveAttribute('open', '')
  await expect(salad.getByRole('textbox', { name: '料理 2 の名前', exact: true })).toBeFocused()
  expect((await storedGame(page)).meals).toHaveLength(0)
  await salad.getByRole('textbox', { name: '料理 2 の名前', exact: true }).fill('サラダ')
  await salad.getByRole('checkbox', { name: '野菜・きのこ・海藻', exact: true }).check()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(journey(page, 'eating')).toBeVisible()
  const report = await reachMealReport(page)
  await expect(report.locator('.meal-report-score strong')).toHaveText('70')
  await expect(report).toContainText('記録 1食')
  await expect(report).toContainText('判定 1食')
  await expect(report).toContainText('自炊 1食')
  const saved = await storedGame(page)
  expect(saved.mealRecords).toHaveLength(1)
  expect(saved.mealRecords![0]).toMatchObject({
    slot: 'dinner',
    source: 'home',
    items: [
      { name: 'カレー', groups: ['staple', 'vegetable'], portion: 'regular' },
      { name: 'サラダ', groups: ['vegetable'], groupsConfirmed: true },
    ],
  })
  await waitForSceneMotion(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({ path: test.info().outputPath('meal-report-320.png') })
  await report.getByRole('button', { name: 'ごはんの記録を見る', exact: true }).click()
  await expect(page).toHaveURL(/\/album(?:\?.*)?$/)
  await expect(page.getByRole('heading', { name: 'ごはんの記録', exact: true })).toBeVisible()
  await expect(page.locator('.meal-report-score')).toHaveCount(0)
  await expect(page.locator('.memory-card')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '自炊を記録する', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'この日のレポートを見る', exact: true }).click()
  await expect(page).toHaveURL(/\/reports(?:\?.*)?$/)
  await expect(page.getByRole('heading', { name: '自炊レポート', exact: true })).toBeVisible()
  await expect(page.locator('.meal-report-score strong')).toHaveText('70')
  const week = page.getByRole('region', { name: '7日間のごはんバランス', exact: true })
  const days = week.locator('.meal-week-day:not(:disabled)')
  await expect(days).toHaveCount(3)
  await expect(week.locator('.meal-week-day:disabled')).toHaveCount(4)
  await days.first().focus()
  await page.keyboard.press('Enter')
  await expect(days.first()).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.meal-report-score strong')).toHaveText('—')
  await days.last().focus()
  await page.keyboard.press('Enter')
  await expect(days.last()).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.meal-report-score strong')).toHaveText('70')
  const foods = week.getByRole('table', { name: '食品を含む食事の数（食）', exact: true })
  const vegetables = foods.getByRole('row').filter({
    has: page.getByRole('rowheader', { name: '野菜・きのこ・海藻', exact: true }),
  })
  await expect(vegetables.getByRole('cell')).toHaveText(['', '', '', '', '—', '—', '1'])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const albumAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(albumAccessibility.violations).toEqual([])
  await week.screenshot({ path: test.info().outputPath('meal-week-320.png') })
  expect((await storedGame(page)).mealRecords).toEqual(saved.mealRecords)
})

test('editing a meal updates its graph and survives reload without awarding game progress', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const today = todayTokyo()
  let state = chooseStarter(initialGame(today), 'komugi')
  state = feed(state, {
    title: '朝のおにぎり',
    sample: 'rice',
    recipeId: 'onigiri',
    mealRecord: {
      slot: 'breakfast',
      source: 'home',
      items: [
        {
          name: 'おにぎり',
          recipeId: 'onigiri',
          groups: ['staple'],
          groupsConfirmed: true,
          portion: 'regular',
        },
      ],
    },
  })
  state = claimLogin({
    ...state,
    tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
  })
  await openSavedGame(page, state, '/reports')
  const before = await storedGame(page)
  const week = page.getByRole('region', { name: '7日間のごはんバランス', exact: true })
  await expect(week.locator('.meal-week-day[aria-pressed="true"]')).toHaveAttribute(
    'aria-label',
    /30点/,
  )
  await page.getByRole('button', { name: 'この日の記録を見る', exact: true }).click()
  await page.locator('.memory-card').filter({ hasText: '朝のおにぎり' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: '記録を編集', exact: true }).click()
  await dialog.getByRole('textbox', { name: '食事の名前', exact: true }).fill('おにぎりと卵と野菜')
  await dialog.getByRole('checkbox', { name: '肉・魚・卵・豆', exact: true }).check()
  await dialog.getByRole('checkbox', { name: '野菜・きのこ・海藻', exact: true }).check()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({ path: test.info().outputPath('meal-editor-320.png') })
  await dialog.getByRole('button', { name: '変更を保存', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '記録を編集', exact: true })).toBeVisible()
  const updated = await storedGame(page)
  expect(gameRewards(updated)).toEqual(gameRewards(before))
  expect(updated.mealRecords).toHaveLength(1)
  expect(updated.mealRecords![0]).toMatchObject({
    title: 'おにぎりと卵と野菜',
    items: [{ groups: ['staple', 'protein', 'vegetable'], groupsConfirmed: true }],
  })
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(page.locator('.memory-card')).toContainText('おにぎりと卵と野菜')
  await page.getByRole('button', { name: 'この日のレポートを見る', exact: true }).click()
  await expect(week.locator('.meal-week-day[aria-pressed="true"]')).toHaveAttribute(
    'aria-label',
    /100点/,
  )
  await page.reload()
  await expect(week.locator('.meal-week-day[aria-pressed="true"]')).toHaveAttribute(
    'aria-label',
    /100点/,
  )
  expect(gameRewards(await storedGame(page))).toEqual(gameRewards(before))
})

test('legacy meals remain visible and missing days never become zero-score days', async ({
  page,
}) => {
  const today = todayTokyo()
  const recordedDay = shiftDay(today, -2)
  let state = chooseStarter(initialGame(recordedDay), 'komugi')
  state = feed(state, { title: '以前のカレー', sample: 'curry', recipeId: 'curry' })
  state = claimLogin({
    ...state,
    today,
    tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
  })
  // This is an actual older save: no human-meal records or assessment metadata existed.
  const legacy = JSON.parse(JSON.stringify(state))
  delete legacy.mealRecords
  for (const meal of legacy.meals) delete meal.mealRecordId
  await openSavedGame(page, legacy, '/reports')
  const week = page.getByRole('region', { name: '7日間のごはんバランス', exact: true })
  await expect(week.locator('.meal-week-day')).toHaveCount(7)
  await expect(week.locator('.meal-week-day[aria-label*="0点"]')).toHaveCount(0)
  await expect(week.locator('.meal-week-day[aria-label*="未記録"]')).toHaveCount(2)
  await week.locator('.meal-week-day[aria-label*="以前の記録・未判定"]').click()
  await page.getByRole('button', { name: 'この日の記録を見る', exact: true }).click()
  await expect(page.locator('.memory-card').filter({ hasText: '以前のカレー' })).toContainText(
    '以前の記録・未判定',
  )
  expect((await storedGame(page)).meals[0].title).toBe('以前のカレー')
})

test('the weekly average counts a meal once when two companions shared it', async ({ page }) => {
  const today = todayTokyo()
  let state = chooseStarter(initialGame(today), 'komugi')
  state = {
    ...state,
    subscriptionPlan: 'premium',
    companions: [...state.companions, { id: 'mame', xp: 0, joinedDay: today }],
    tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
  }
  state = feed(state, {
    title: '分けたおにぎり',
    sample: 'rice',
    recipeId: 'onigiri',
    targetId: 'komugi',
  })
  state = feed(state, {
    title: '分けたおにぎり',
    sample: 'rice',
    mealRecordId: state.mealRecords![0].id,
    targetId: 'mame',
  })
  state = claimLogin(
    feed(state, {
      title: '夜のカレー',
      sample: 'curry',
      recipeId: 'curry',
      targetId: 'komugi',
    }),
  )
  expect(state.meals).toHaveLength(3)
  expect(state.mealRecords).toHaveLength(2)
  await openSavedGame(page, state, '/reports')
  const week = page.getByRole('region', { name: '7日間のごはんバランス', exact: true })
  await expect(week.locator('.meal-week-day[aria-pressed="true"]')).toHaveAttribute(
    'aria-label',
    /50点/,
  )
  await expect(page.locator('.meal-report-score strong')).toHaveText('50')
  await expect(week.locator('.meal-week-day[aria-label*="未記録"]')).toHaveCount(6)
  await page.getByRole('button', { name: 'この日の記録を見る', exact: true }).click()
  await expect(page.locator('.memory-card')).toHaveCount(2)
  await expect(page.locator('.memory-card').filter({ hasText: '分けたおにぎり' })).toHaveCount(1)
  expect(await storedGame(page)).toEqual(state)
})

test('sharing a saved meal from the album recruits a visitor without another human meal', async ({
  page,
}) => {
  const today = todayTokyo()
  let state = chooseStarter(initialGame(today), 'komugi')
  state = {
    ...state,
    visitors: ['mame'],
    tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
  }
  state = claimLogin(
    feed(state, {
      title: 'みんなのカレー',
      sample: 'curry',
      recipeId: 'curry',
      targetId: 'komugi',
    }),
  )
  await openSavedGame(page, state, '/album')
  const before = await storedGame(page)
  expect(before.companions.some((companion) => companion.id === 'mame')).toBe(false)
  await page.locator('.memory-card').filter({ hasText: 'みんなのカレー' }).click()
  await page.getByRole('button', { name: 'この食事をほかのもぐに分ける', exact: true }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  await page.getByRole('combobox', { name: 'ごはんをあげるもぐ', exact: true }).selectOption('mame')
  await page.getByRole('button', { name: 'まめにごはんをあげる', exact: true }).click()
  await expect(journey(page, 'eating')).toBeVisible()
  const shared = await storedGame(page)
  expect(shared.meals).toHaveLength(before.meals.length + 1)
  expect(shared.meals[0]).toMatchObject({
    targetId: 'mame',
    mealRecordId: before.mealRecords![0].id,
  })
  expect(shared.mealRecords).toEqual(before.mealRecords)
  expect(shared.cards).toEqual(before.cards)
  expect(shared.coins).toBe(before.coins)
  expect(shared.companions).toContainEqual({ id: 'mame', xp: 45, joinedDay: today })
  expect(shared.visitors).not.toContain('mame')
  const report = await reachMealReport(page)
  await expect(report.locator('.meal-report-score strong')).toHaveText('70')
  await expect(report).toContainText('記録 1食')
  await report.getByRole('button', { name: '7日間のレポートを見る', exact: true }).click()
  await expect(page.getByRole('heading', { name: '自炊レポート', exact: true })).toBeVisible()
  await expect(page.locator('.meal-report-score strong')).toHaveText('70')
  await page.getByRole('button', { name: 'この日の記録を見る', exact: true }).click()
  await expect(page.locator('.memory-card')).toHaveCount(1)
  await page.reload()
  expect((await storedGame(page)).mealRecords).toEqual(before.mealRecords)
})
