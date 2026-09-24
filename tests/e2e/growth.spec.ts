import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  chooseStarter,
  claimLogin,
  growthStages,
  initialGame,
  todayTokyo,
} from '../../src/app/game/browserGame'
import { waitForSceneMotion } from './helpers'

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
    // Undiscovered forms have no illustration in the DOM, including hidden future silhouettes.
    await expect(dialog.locator('.growth-trail-step.is-unknown .pet-art')).toHaveCount(0)
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
