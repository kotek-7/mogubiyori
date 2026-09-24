import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  chooseStarter,
  claimLogin,
  growthStages,
  initialGame,
  todayTokyo,
} from '../../src/app/game/browserGame'
import { navigate, storedGame, waitForSceneMotion } from './helpers'

test('five forms unlock in order and collected forms can be revisited without changing growth', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const { stage, name, threshold } of growthStages) {
    const state = claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi'))
    state.tutorial = { version: 1, step: 4, status: 'completed' }
    state.xp = threshold
    state.companions[0].xp = threshold
    await page.goto('/')
    await page.evaluate(
      (value) => localStorage.setItem('mogubiyori-v1', value),
      JSON.stringify(state),
    )
    await page.reload()
    await expect(page.locator('.play-name')).toContainText(`${name} · ${stage + 1}/5`)
    await expect(page.locator('.play-pet .pet-art')).toHaveClass(new RegExp(`pet-stage-${stage}`))
    await page.locator('.play-growth').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.growth-trail-step')).toHaveCount(5)
    await expect(dialog.locator('.growth-trail-step:disabled')).toHaveCount(4 - stage)
    // Future outlines invite discovery; only earned forms can be opened in full colour.
    await expect(dialog.locator('.growth-trail-step.is-unknown .discovery-silhouette')).toHaveCount(
      4 - stage,
    )
    await expect(
      dialog.locator('.growth-trail-step.is-discovered .discovery-silhouette'),
    ).toHaveCount(0)
    for (const future of growthStages.filter((entry) => entry.stage > stage)) {
      const outline = dialog.locator(`.growth-trail-step.is-unknown .pet-stage-${future.stage}`)
      await expect(outline).toBeVisible()
    }
    await dialog.getByRole('button', { name: 'うまれたての姿を見る' }).click()
    await expect(dialog.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-0/)
    await dialog.getByText('姿の特徴', { exact: true }).click()
    await expect(dialog.locator('.profile-form-description')).toBeVisible()
    await expect(dialog.locator('.profile-form-description')).not.toBeEmpty()
    await page.getByRole('button', { name: '閉じる', exact: true }).click()
    await expect(page.locator('.play-pet .pet-art')).toHaveClass(new RegExp(`pet-stage-${stage}`))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('the collection shows unseen companions and forms without revealing their names or changing progress', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const state = claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi'))
  state.tutorial = { version: 1, step: 4, status: 'completed' }
  state.visitors = ['mame']
  await page.addInitScript(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/')
  const before = await storedGame(page)
  await navigate(page, 'ずかん')
  await page.getByRole('button', { name: 'なかま', exact: true }).click()
  await expect(page.locator('.friend-card:not(.is-unknown)')).toHaveCount(1)
  await expect(page.locator('.friend-card.is-unknown')).toHaveCount(4)
  await expect(
    page.locator('.friend-card.is-unknown .friend-current .discovery-silhouette'),
  ).toHaveCount(4)
  await expect(page.locator('.friend-card.is-unknown .growth-trail-step.is-unknown')).toHaveCount(
    20,
  )
  await expect(page.locator('.friend-visitor')).toHaveCount(1)
  await expect(page.locator('.friend-visitor .discovery-silhouette')).toHaveCount(0)
  await expect(page.locator('.friend-visitor')).toContainText('まめ')
  await expect(page.locator('.friend-card.is-unknown').first()).not.toContainText('しずく')
  await expect(page.locator('.friend-card.is-unknown button')).toHaveCount(0)
  await waitForSceneMotion(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(await storedGame(page)).toEqual(before)
})

test('the five-form collection is readable with keyboard and assistive technology', async ({
  page,
}) => {
  const state = claimLogin(chooseStarter(initialGame(todayTokyo()), 'shizuku'))
  state.tutorial = { version: 1, step: 4, status: 'completed' }
  state.xp = 300
  state.companions[0].xp = 300
  await page.addInitScript(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/')
  await page.locator('.play-growth').click()
  await waitForSceneMotion(page)
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
  await page.getByRole('button', { name: 'うまれたての姿を見る' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-0/)
  await page.keyboard.press('Escape')
  await expect(page.locator('.play-growth')).toBeFocused()
})
