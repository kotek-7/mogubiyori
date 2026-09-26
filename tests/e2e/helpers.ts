import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import type { GameState } from '../../src/app/game/browserGame'
import { recipes } from '../../src/app/game/browserGame'

export const journey = (page: Page, name?: string) =>
  page.locator(`main.journey-screen${name ? `[data-scene="${name}"]` : ''}`)

export async function waitForSceneMotion(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    // React's scene update and View Transition snapshots can begin after the click returns.
    // Observe the real animations, leaving perpetual pet/ambient motion running.
    await frame()
    await frame()
    for (;;) {
      const pending = document.getAnimations().filter((animation) => {
        const end = animation.effect?.getComputedTiming().endTime
        return (
          (animation.pending || animation.playState === 'running') &&
          typeof end === 'number' &&
          Number.isFinite(end)
        )
      })
      if (pending.length === 0) return
      await Promise.allSettled(pending.map((animation) => animation.finished))
      await frame()
    }
  })
}

export async function storedGame(page: Page): Promise<GameState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mogubiyori-v1')!))
}

export async function chooseStarter(page: Page, name = 'こむぎ') {
  await page.getByRole('button', { name: `${name}を選ぶ`, exact: true }).click()
  await page.getByRole('button', { name: 'この子とはじめる' }).click()
  await expect(journey(page, 'welcome')).toBeVisible()
}

export async function start(page: Page, name = 'こむぎ') {
  await chooseStarter(page, name)
  await page.getByRole('button', { name: 'チュートリアルをスキップしてひろばへ' }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'コイン 140枚、おみせへ' })).toBeVisible()
}

export async function enablePremium(page: Page) {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
  await expect(
    dialog.getByRole('button', { name: '有料プランを利用中', exact: true }),
  ).toBeDisabled()
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(dialog).toHaveCount(0)
}

export async function navigate(
  page: Page,
  name: 'ひろば' | '記録' | 'レポート' | 'ずかん' | 'おみせ',
) {
  const destination = page
    .getByRole('navigation', { name: 'メインナビゲーション' })
    .getByRole('button', { name, exact: true })
  await destination.click()
  // Lazy route content commits after the click and URL update.
  await expect(destination).toHaveAttribute('aria-current', 'page')
}

export async function sampleToTable(page: Page, recipeId = '') {
  await expect(journey(page, 'photo')).toBeVisible()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await expect(journey(page, 'serve')).toBeVisible()
  await selectMealRecipe(page, recipeId)
}

export const selectedMealRecipe = (page: Page) => page.getByLabel('つくった料理', { exact: true })

export async function selectMealRecipe(page: Page, recipeId: string) {
  if (!recipeId && (await selectedMealRecipe(page).textContent()) === '今日のごはん') return
  await page.getByRole('button', { name: '料理を選ぶ', exact: true }).click()
  await expect(journey(page, 'recipe-pick')).toBeVisible()
  if (recipeId) {
    const recipe = recipes.find((entry) => entry.id === recipeId)!
    await page.getByRole('searchbox', { name: '名前・材料で検索' }).fill(recipe.name)
    await page.getByRole('button', { name: `${recipe.name}を選ぶ`, exact: true }).click()
  } else {
    await page.getByRole('button', { name: '今日のごはんにする', exact: true }).click()
  }
  await expect(journey(page, 'serve')).toBeVisible()
}

export async function confirmUnclassifiedMeal(page: Page) {
  const dialog = page.getByRole('dialog', {
    name: '栄養記録なしでごはんをあげますか？',
    exact: true,
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'このままごはんをあげる', exact: true }).click()
}

export async function submitSample(page: Page, recipeId = '', name = 'こむぎ') {
  await sampleToTable(page, recipeId)
  await page.getByRole('button', { name: `${name}にごはんをあげる`, exact: true }).click()
  if (!recipeId) await confirmUnclassifiedMeal(page)
  await expect(journey(page, 'eating')).toBeVisible()
}

export async function feedSample(page: Page, recipeId = '') {
  await page.locator('.play-feed').click()
  await submitSample(page, recipeId)
}

export async function advanceXp(page: Page) {
  const screen = journey(page, 'xp')
  await expect(screen).toBeVisible()
  await screen.getByRole('button', { name: /^(つづける|ひろばへ)$/ }).click()
  await expect(screen).toHaveCount(0)
}

export async function returnToPlaza(page: Page): Promise<string[]> {
  const scenes: string[] = []
  await expect(journey(page)).toHaveAttribute(
    'data-scene',
    /^(eating|xp|growth|joined|card|arrivals|streak|gift|mealReport)$/,
  )
  for (let step = 0; step < 12; step += 1) {
    await waitForSceneMotion(page)
    const current = await page.evaluate(() =>
      document.querySelector('main.journey-screen')?.getAttribute('data-scene'),
    )
    if (!current) break
    const screen = journey(page, current)
    scenes.push(current)
    if (current === 'eating') {
      await screen.getByRole('button', { name: '早送り', exact: true }).click()
    } else {
      await screen.getByRole('button', { name: /^(つづける|ひろばへ)$/ }).click()
    }
    // Do not resolve the next button against the outgoing scene while its update is pending.
    await expect(screen).toHaveCount(0)
  }
  await expect(journey(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  return scenes
}

export async function nextDay(page: Page) {
  const before = await storedGame(page)
  await page.keyboard.press('Control+Alt+d')
  const dialog = page.getByRole('dialog', { name: 'デバッグ設定', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '翌日に進む', exact: true }).click()
  await expect.poll(async () => (await storedGame(page)).dayOffset).toBe(before.dayOffset + 1)
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

export async function uploadPhoto(page: Page) {
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 60
    const context = canvas.getContext('2d')!
    context.fillStyle = '#dfc992'
    context.fillRect(0, 0, 100, 60)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page
    .getByLabel('料理の写真', { exact: true })
    .and(page.locator('input[type="file"]'))
    .setInputFiles({
      name: 'meal.png',
      mimeType: 'image/png',
      buffer: Buffer.from(fixture, 'base64'),
    })
  await expect(journey(page, 'photo').locator('img[src^="data:image/"]')).toBeVisible()
}

export async function expectFocusedScene(page: Page, name: string) {
  const screen = journey(page, name)
  await expect(screen).toBeVisible()
  await expect(screen.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page.locator('.play-header')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
