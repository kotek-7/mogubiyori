import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import {
  chooseStarter,
  claimLogin,
  demoGame,
  feed,
  initialGame,
  todayTokyo,
} from '../../src/app/game/browserGame'
import type { GameState } from '../../src/app/game/browserGame'
import { selectMealRecipe } from './helpers'

const plainMeal = { title: '今日のごはん', sample: 'rice' }
const scene = (page: Page, name: string) => page.locator(`main[data-scene="${name}"]`)
const starter = () => {
  const state = claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi'))
  return { ...state, tutorial: { version: 1, step: 4, status: 'completed' } } satisfies GameState
}

async function stored(page: Page): Promise<GameState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mogubiyori-v1')!))
}

async function seed(page: Page, state: GameState) {
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.reload()
  await expect(page.locator('.play-pet')).toBeVisible()
}

async function serve(page: Page, recipeId = '', recipient = 'こむぎ', skipEating = true) {
  if (recipient === 'こむぎ') await page.locator('.play-feed').click()
  else await page.getByRole('button', { name: `お客さんの${recipient}にごはんをあげる` }).click()
  await page.getByRole('button', { name: '写真なしで体験する', exact: true }).click()
  await selectMealRecipe(page, recipeId)
  await page.getByRole('button', { name: `${recipient}にごはんをあげる`, exact: true }).click()
  await expect(scene(page, 'eating')).toBeVisible()
  const saved = await stored(page)
  if (skipEating) await page.getByRole('button', { name: '早送り', exact: true }).click()
  else {
    await page.clock.fastForward(2000)
    await expect(scene(page, 'eating')).toBeVisible()
    await page.clock.fastForward(1600)
  }
  await expect(scene(page, 'xp')).toBeVisible()
  return saved
}

async function displayedTotal(page: Page): Promise<number> {
  const text = await scene(page, 'xp').locator('.feast-xp-total strong').innerText()
  return Number(text.replace(/[^\d.-]/g, ''))
}

async function meterPercent(meter: Locator): Promise<number> {
  const minimum = Number((await meter.getAttribute('aria-valuemin')) ?? 0)
  const maximum = Number(await meter.getAttribute('aria-valuemax'))
  const current = Number(await meter.getAttribute('aria-valuenow'))
  expect(Number.isFinite(current)).toBe(true)
  expect(maximum).toBeGreaterThan(minimum)
  expect(current).toBeGreaterThanOrEqual(minimum)
  expect(current).toBeLessThanOrEqual(maximum)
  return ((current - minimum) / (maximum - minimum)) * 100
}

async function expectGainUnobstructed(page: Page) {
  const body = await scene(page, 'xp').locator('.pet-body').boundingBox()
  const gain = await scene(page, 'xp').locator('.feast-xp-gain strong').boundingBox()
  expect(body).not.toBeNull()
  expect(gain).not.toBeNull()
  expect(body!.y + body!.height, 'the companion must not cover the earned XP').toBeLessThanOrEqual(
    gain!.y,
  )
}

async function finishMealReport(page: Page, saved: GameState) {
  await expect(scene(page, 'mealReport')).toBeVisible()
  await expect(
    scene(page, 'mealReport').getByRole('heading', {
      name: '今日のごはんを振り返ろう',
      exact: true,
    }),
  ).toBeVisible()
  expect(await stored(page)).toEqual(saved)
  await scene(page, 'mealReport').getByRole('button', { name: 'ひろばへ', exact: true }).click()
}

test.use({ viewport: { width: 390, height: 844 } })

test('the first meal lingers while eating and keeps XP and streak rewards until continued', async ({
  page,
}, testInfo) => {
  await seed(page, starter())
  await page.clock.install()
  await page.evaluate(() => {
    const samples: number[] = []
    const observer = new MutationObserver(() => {
      const text = document.querySelector('.feast-xp-total strong')?.textContent
      if (text === undefined || text === null) return
      const value = Number(text.replace(/[^\d.-]/g, ''))
      if (Number.isFinite(value) && samples.at(-1) !== value) {
        samples.push(value)
        document.documentElement.dataset.xpSamples = JSON.stringify(samples)
      }
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
  })
  const saved = await serve(page, '', 'こむぎ', false)
  await expect(scene(page, 'xp').locator('.feast-xp-gain')).toContainText('+45')
  await expect.poll(() => displayedTotal(page)).toBe(45)
  const values: number[] = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.xpSamples ?? '[]'),
  )
  expect(values.length).toBeGreaterThan(1)
  expect(values[0]).toBeLessThan(45)
  expect(values.at(-1)).toBe(45)
  expect(values.every((value, index) => index === 0 || value >= values[index - 1])).toBe(true)
  const progress = await meterPercent(
    scene(page, 'xp').getByRole('progressbar', { name: '次の成長まで' }),
  )
  expect(progress).toBeGreaterThanOrEqual(37)
  expect(progress).toBeLessThanOrEqual(38)
  await page.screenshot({ path: testInfo.outputPath('xp-first-meal-390.png') })
  await page.clock.fastForward(30000)
  await expect(scene(page, 'xp')).toBeVisible()
  await scene(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(scene(page, 'streak')).toBeVisible()
  await expect(scene(page, 'streak').locator('.streak-celebration-number strong')).toHaveText('1')
  await expect(scene(page, 'streak').locator('.streak-celebration-prize')).toHaveCount(0)
  await page.clock.fastForward(30000)
  await expect(scene(page, 'streak')).toBeVisible()
  expect(await stored(page)).toEqual(saved)
  await scene(page, 'streak').getByRole('button', { name: 'つづける', exact: true }).click()
  await finishMealReport(page, saved)
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
  expect(saved.xp).toBe(45)
  expect(await stored(page)).toEqual(saved)
  await page.reload()
  expect((await stored(page)).xp).toBe(45)
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-0/)
})

test('a threshold fills the previous growth meter before revealing the next form', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [fromXp, toXp, stage] of [
    [75, 120, 1],
    [90, 135, 1],
    [270, 315, 2],
    [1035, 1080, 4],
  ]) {
    const state = starter()
    state.xp = fromXp
    state.companions[0].xp = fromXp
    await seed(page, state)
    const saved = await serve(page)
    await expect.poll(() => displayedTotal(page)).toBe(toXp)
    expect(
      await meterPercent(scene(page, 'xp').getByRole('progressbar', { name: '次の成長まで' })),
    ).toBe(100)
    await expect(scene(page, 'xp')).toContainText('成長')
    await scene(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
    await expect(scene(page, 'growth')).toBeVisible()
    await expect(scene(page, 'growth').locator('.feast-growth-reveal')).toHaveClass(
      new RegExp(`pet-stage-${stage}`),
    )
    expect(await stored(page)).toEqual(saved)
  }
})

test('repeated recipes show the actual 30 and 15 XP even when daily coins are exhausted', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let state = feed(
    { ...starter(), subscriptionPlan: 'premium' },
    { ...plainMeal, recipeId: 'curry' },
  )
  for (const [gained, total] of [
    [30, 75],
    [15, 90],
  ]) {
    await seed(page, state)
    const saved = await serve(page, 'curry')
    await expect(scene(page, 'xp').locator('.feast-xp-gain')).toContainText(`+${gained}`)
    await expect.poll(() => displayedTotal(page)).toBe(total)
    expect(saved.meals[0].coins).toBe(0)
    expect(saved.coins).toBe(state.coins)
    await scene(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
    await finishMealReport(page, saved)
    await expect(page.locator('.play-feed')).toBeVisible()
    expect(await stored(page)).toEqual(saved)
    state = saved
  }
})

test('a visitor starts at zero XP without borrowing the previous active companion total', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = claimLogin(
    feed({ ...demoGame(todayTokyo()), subscriptionPlan: 'premium' }, plainMeal),
  )
  await seed(page, state)
  const saved = await serve(page, '', 'まめ')
  await expect(scene(page, 'xp')).toContainText('まめ')
  await expect(scene(page, 'xp').locator('.feast-xp-gain')).toContainText('+45')
  await expect.poll(() => displayedTotal(page)).toBe(45)
  const progress = await meterPercent(
    scene(page, 'xp').getByRole('progressbar', { name: '次の成長まで' }),
  )
  expect(progress).toBeGreaterThanOrEqual(37)
  expect(progress).toBeLessThanOrEqual(38)
  expect(saved.companions.map(({ id, xp }) => [id, xp])).toEqual([
    ['komugi', 315],
    ['mame', 45],
  ])
  await scene(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(scene(page, 'joined')).toBeVisible()
  await expect(scene(page, 'joined').locator('.pet-art')).toHaveClass(/pet-stage-0/)
  expect(await stored(page)).toEqual(saved)
})

test('the final form still earns XP without promising a sixth form or resetting its meter', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = feed({ ...starter(), subscriptionPlan: 'premium' }, plainMeal)
  state.xp = 1050
  state.companions[0].xp = 1050
  state.visitors = ['mame', 'shizuku', 'yuzu']
  await seed(page, state)
  const saved = await serve(page)
  await expect(scene(page, 'xp').locator('.feast-xp-gain')).toContainText('+45')
  await expect.poll(() => displayedTotal(page)).toBe(1095)
  expect(
    await meterPercent(scene(page, 'xp').getByRole('progressbar', { name: '次の成長まで' })),
  ).toBe(100)
  await expect(scene(page, 'xp')).not.toContainText('あと 0 XP')
  await scene(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
  await finishMealReport(page, saved)
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-4/)
  expect(await stored(page)).toEqual(saved)
})

test('reduced motion presents the settled reward and fast-forward cannot grant it twice', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seed(page, starter())
  const saved = await serve(page, 'curry')
  await expect.poll(() => displayedTotal(page), { timeout: 500 }).toBe(45)
  const buttonBox = await scene(page, 'xp')
    .getByRole('button', { name: 'つづける', exact: true })
    .boundingBox()
  await page.screenshot({ path: testInfo.outputPath('xp-reduced-motion-320.png') })
  await expectGainUnobstructed(page)
  expect(buttonBox).not.toBeNull()
  expect(buttonBox!.y).toBeGreaterThanOrEqual(0)
  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(568)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await scene(page, 'xp')
    .getByRole('button', { name: 'つづける', exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(scene(page, 'card')).toBeVisible()
  expect(await stored(page)).toEqual(saved)
  await scene(page, 'card').getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(scene(page, 'streak')).toBeVisible()
  await scene(page, 'streak').getByRole('button', { name: 'つづける', exact: true }).click()
  await finishMealReport(page, saved)
  await expect(page.locator('.play-feed')).toBeVisible()
  await page.reload()
  expect(await stored(page)).toEqual(saved)
  expect(saved.meals).toHaveLength(1)
})

test('a short mobile additional meal keeps its summary and finish button inside the viewport', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const before = feed({ ...starter(), subscriptionPlan: 'premium' }, plainMeal)
  await seed(page, before)
  const saved = await serve(page)
  await expect.poll(() => displayedTotal(page)).toBe(90)
  await expect(scene(page, 'xp').locator('.feast-scene-rewards')).toContainText('+0')
  expect(saved.coins).toBe(before.coins)
  const buttonBox = await scene(page, 'xp')
    .getByRole('button', { name: 'つづける', exact: true })
    .boundingBox()
  await page.screenshot({ path: testInfo.outputPath('xp-ordinary-320.png') })
  await expectGainUnobstructed(page)
  expect(buttonBox).not.toBeNull()
  expect(buttonBox!.y).toBeGreaterThanOrEqual(0)
  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(568)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await scene(page, 'xp').getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(scene(page, 'mealReport')).toBeVisible()
  const finishButton = scene(page, 'mealReport').getByRole('button', {
    name: 'ひろばへ',
    exact: true,
  })
  // The reading report scrolls; the preceding XP action still fits without scrolling.
  await finishButton.scrollIntoViewIfNeeded()
  const finishBox = await finishButton.boundingBox()
  expect(finishBox).not.toBeNull()
  expect(finishBox!.y).toBeGreaterThanOrEqual(0)
  expect(finishBox!.y + finishBox!.height).toBeLessThanOrEqual(568)
  await finishMealReport(page, saved)
  await expect(page.locator('.play-feed')).toBeVisible()
  expect(await stored(page)).toEqual(saved)
})
