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
import { enablePremium, feedSample, journey, returnToPlaza, storedGame } from './helpers'

const plainMeal = { title: '今日のごはん', sample: 'rice' }

async function seedStreak(page: Page, previousDays: number) {
  let state = chooseStarter(initialGame(shiftDay(todayTokyo(), -previousDays)), 'komugi')
  for (let day = 0; day < previousDays; day += 1) {
    state = feed(state, plainMeal)
    state = { ...state, today: shiftDay(state.today, 1) }
  }
  state = claimLogin({ ...state, tutorial: { version: 1, step: 4, status: 'completed' } })
  await page.goto('/')
  await page.evaluate(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.reload()
  await expect(page.locator('.play-feed')).toBeVisible()
  return state
}

async function reachStreak(page: Page): Promise<GameState> {
  await feedSample(page)
  const saved = await storedGame(page)
  await journey(page, 'eating').getByRole('button', { name: '早送り', exact: true }).click()
  for (const type of ['xp', 'growth', 'arrivals']) {
    const current = journey(page, type)
    if (type === 'xp') await expect(current).toBeVisible()
    if ((await current.count()) === 0) continue
    await current.getByRole('button', { name: 'つづける', exact: true }).click()
    await expect(current).toHaveCount(0)
  }
  await expect(journey(page, 'streak')).toBeVisible()
  return saved
}

async function observeStreak(page: Page) {
  await page.evaluate(() => {
    const samples: {
      phase: string
      days: number
      recorded: boolean
      bonus: boolean
      locked: boolean
    }[] = []
    const observer = new MutationObserver(() => {
      const root = document.querySelector('.feast-scene-streak .streak-celebration')
      const phase = root?.getAttribute('data-phase')
      if (!root || !phase || samples.at(-1)?.phase === phase) return
      samples.push({
        phase,
        days: Number(root.querySelector('.streak-celebration-number strong')?.textContent),
        recorded: root.querySelector('.is-latest')?.classList.contains('is-recorded') ?? false,
        bonus:
          root.querySelector('.streak-celebration-prize')?.getAttribute('aria-hidden') === 'false',
        locked: !!document.querySelector<HTMLButtonElement>(
          'main[data-scene="streak"] .journey-primary',
        )?.disabled,
      })
      document.documentElement.dataset.streakSamples = JSON.stringify(samples)
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    })
  })
}

test('a second cooking day fills its record and counts up without inventing a bonus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const before = await seedStreak(page, 1)
  await observeStreak(page)
  const saved = await reachStreak(page)
  const screen = journey(page, 'streak')
  await expect(screen.locator('.streak-celebration')).toHaveAttribute('data-phase', 'complete')
  const samples = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.streakSamples!),
  )
  expect(samples.map((sample: { phase: string }) => sample.phase)).toEqual([
    'waiting',
    'recorded',
    'counted',
    'complete',
  ])
  expect(samples[0]).toMatchObject({ days: 1, recorded: false, bonus: false, locked: true })
  expect(samples[1]).toMatchObject({ days: 1, recorded: true, bonus: false, locked: true })
  expect(samples[2]).toMatchObject({ days: 2, recorded: true, bonus: false, locked: true })
  expect(samples.every((sample: { bonus: boolean }) => !sample.bonus)).toBe(true)
  await expect(screen.locator('.streak-celebration-prize')).toHaveCount(0)
  await expect(screen.locator('.feast-scene-rewards')).toContainText('+30')
  expect(saved.coins - before.coins).toBe(30)
  expect(saved.meals[0].streakBonus).toBe(0)
  expect(await storedGame(page)).toEqual(saved)
  await page.screenshot({ path: test.info().outputPath('streak-second-day-390.png') })
  await screen.getByRole('button', { name: 'つづける', exact: true }).click()
  await expect(journey(page, 'mealReport')).toBeVisible()
  expect(await storedGame(page)).toEqual(saved)
  await journey(page, 'mealReport').getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(page.locator('.play-feed')).toBeVisible()
  await enablePremium(page)
  await feedSample(page)
  expect(await returnToPlaza(page)).not.toContain('streak')
  expect((await storedGame(page)).coins).toBe(saved.coins)
})

test('a cooking milestone fills the day, increments the streak and reveals coins in order', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const before = await seedStreak(page, 2)
  await observeStreak(page)
  const saved = await reachStreak(page)
  const screen = journey(page, 'streak')
  const celebration = screen.locator('.streak-celebration')
  await expect(celebration).toHaveAttribute('data-phase', 'complete')
  const samples = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.streakSamples!),
  )
  expect(samples.map((sample: { phase: string }) => sample.phase)).toEqual([
    'waiting',
    'recorded',
    'counted',
    'rewarded',
    'complete',
  ])
  expect(samples[0]).toMatchObject({ days: 2, recorded: false, bonus: false, locked: true })
  expect(samples[1]).toMatchObject({ days: 2, recorded: true, bonus: false, locked: true })
  expect(samples[2]).toMatchObject({ days: 3, recorded: true, bonus: false, locked: true })
  expect(samples[3]).toMatchObject({ days: 3, recorded: true, bonus: true, locked: true })
  await expect(screen.locator('.streak-celebration-prize')).toContainText('+30')
  expect(saved.coins - before.coins).toBe(60)
  expect(saved.meals[0].streakBonus).toBe(30)
  expect(await storedGame(page)).toEqual(saved)
  await page.screenshot({ path: test.info().outputPath('streak-three-days-390.png') })
  await screen
    .getByRole('button', { name: 'つづける', exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(journey(page, 'mealReport')).toBeVisible()
  expect(await storedGame(page)).toEqual(saved)
  await journey(page, 'mealReport').getByRole('button', { name: 'ひろばへ', exact: true }).click()
  await expect(page.locator('.play-feed')).toBeVisible()
  expect(await storedGame(page)).toEqual(saved)
  await enablePremium(page)
  await feedSample(page)
  expect(await returnToPlaza(page)).not.toContain('streak')
  const repeated = await storedGame(page)
  expect(repeated.coins).toBe(saved.coins)
  expect(repeated.meals[0].streakBonus).toBe(0)
})

test('the seven-day bonus settles immediately with reduced motion and fits a short phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const before = await seedStreak(page, 6)
  const saved = await reachStreak(page)
  const screen = journey(page, 'streak')
  await expect(screen.locator('.streak-celebration')).toHaveAttribute('data-phase', 'complete', {
    timeout: 500,
  })
  await expect(screen.locator('.streak-celebration-number strong')).toHaveText('7')
  await expect(screen.locator('.streak-celebration-prize')).toContainText('+100')
  const next = screen.getByRole('button', { name: 'つづける', exact: true })
  await expect(next).toBeEnabled()
  const box = await next.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(568)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(saved.coins - before.coins).toBe(130)
  expect(saved.meals[0].streakBonus).toBe(100)
  expect(await storedGame(page)).toEqual(saved)
  await page.screenshot({ path: test.info().outputPath('streak-seven-days-320.png') })
  await next.click()
  await expect(journey(page, 'gift')).toBeVisible()
  await expect(
    journey(page, 'gift').getByRole('heading', { name: '7日のおくりもの' }),
  ).toBeVisible()
  await returnToPlaza(page)
  const completed = await storedGame(page)
  expect(completed.equipped.hat).toBe('sprout')
  expect(completed.coins).toBe(saved.coins)
  await page.reload()
  expect(await storedGame(page)).toEqual(completed)
})
