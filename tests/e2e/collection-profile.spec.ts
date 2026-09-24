import { expect, test } from '@playwright/test'
import { chooseStarter, claimLogin, initialGame, todayTokyo } from '../../src/app/game/browserGame'
import { companionProfiles } from '../../shared/content/companionProfiles'
import { navigate, storedGame, waitForSceneMotion } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const state = claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi'))
  state.tutorial = { version: 1, step: 4, status: 'completed', homeGuide: 'done' }
  state.xp = 120
  state.companions[0].xp = 120
  state.companions.push({ id: 'mame', xp: 300, joinedDay: state.today })
  state.visitors = ['shizuku']
  state.owned.push('sprout', 'neck-bandana', 'bag-satchel')
  state.equipped = {
    ...state.equipped,
    hat: 'sprout',
    neck: 'neck-bandana',
    bag: 'bag-satchel',
  }
  await page.addInitScript(
    (value) => localStorage.setItem('mogubiyori-v1', value),
    JSON.stringify(state),
  )
  await page.goto('/')
  await navigate(page, 'ずかん')
  await page.getByRole('button', { name: 'なかま', exact: true }).click()
  await waitForSceneMotion(page)
})

test('reading another companion from the collection preserves progress and returns focus to its card', async ({
  page,
}) => {
  const before = await storedGame(page)
  const openProfile = page.getByRole('button', { name: 'まめの説明を見る', exact: true })
  await openProfile.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.profile-description summary')).toHaveText('生態')
  await expect(dialog.locator('.profile-description p')).toHaveText(companionProfiles.mame.ecology)
  await expect(dialog.getByRole('heading', { name: 'まめの性格', exact: true })).toBeVisible()
  await expect(dialog.locator('.profile-personality p')).toHaveText(
    companionProfiles.mame.personality,
  )
  await expect(dialog.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-2/)
  await expect(dialog.locator('.growth-trail-step:enabled')).toHaveCount(3)
  await expect(dialog.locator('.growth-trail-step:disabled')).toHaveCount(2)
  await expect(dialog.getByRole('progressbar', { name: '次の成長まで' })).toBeVisible()
  await expect(dialog.locator('.pet-hat, .pet-neck, .pet-bag')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'きせかえ', exact: true })).toHaveCount(0)

  await dialog.getByRole('button', { name: 'うまれたての姿を見る', exact: true }).click()
  await expect(dialog.locator('.profile-form-description')).toHaveText(
    companionProfiles.mame.stages[0],
  )
  await expect(dialog.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-0/)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(openProfile).toBeFocused()
  await expect(page.getByRole('heading', { name: 'ずかん', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'なかま', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await storedGame(page)).toEqual(before)

  await openProfile.click()
  await expect(dialog.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-2/)
  await expect(dialog.locator('.profile-form-description')).toHaveText(
    companionProfiles.mame.stages[2],
  )
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(openProfile).toBeFocused()
  expect(await storedGame(page)).toEqual(before)
})

test('visitors have readable descriptions without owned progress and unknown companions remain hidden', async ({
  page,
}) => {
  const before = await storedGame(page)
  await expect(page.locator('.friend-card.is-unknown')).toHaveCount(3)
  await expect(page.locator('.friend-card.is-unknown button')).toHaveCount(0)
  const openProfile = page.getByRole('button', { name: 'しずくの説明を見る', exact: true })
  await openProfile.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.profile-description p')).toHaveText(
    companionProfiles.shizuku.ecology,
  )
  await expect(dialog.getByRole('heading', { name: 'しずくの性格', exact: true })).toBeVisible()
  await expect(dialog.locator('.profile-personality p')).toHaveText(
    companionProfiles.shizuku.personality,
  )
  await expect(dialog.locator('.profile-form-description')).toHaveText(
    companionProfiles.shizuku.stages[0],
  )
  await expect(dialog.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-0/)
  await expect(dialog.locator('.growth-trail-step:enabled')).toHaveCount(1)
  await expect(dialog.locator('.growth-trail-step:disabled')).toHaveCount(4)
  await expect(dialog.getByRole('progressbar')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'きせかえ', exact: true })).toHaveCount(0)
  await expect(dialog.locator('.pet-hat, .pet-neck, .pet-bag')).toHaveCount(0)
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(openProfile).toBeFocused()
  await expect(page.getByRole('button', { name: 'なかま', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await storedGame(page)).toEqual(before)
})

test('the active companion keeps its outfit when viewed and living with another companion remains a separate action', async ({
  page,
}) => {
  const before = await storedGame(page)
  await page.getByRole('button', { name: 'こむぎの説明を見る', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.profile-sheet > .pet-art')).toHaveClass(/pet-stage-1/)
  await expect(
    dialog.locator('.profile-sheet > .pet-art .pet-hat[data-item="sprout"]'),
  ).toBeVisible()
  await expect(
    dialog.locator('.profile-sheet > .pet-art .pet-neck[data-item="neck-bandana"]'),
  ).toBeVisible()
  await expect(
    dialog.locator('.profile-sheet > .pet-art .pet-bag[data-item="bag-satchel"]'),
  ).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'きせかえ', exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  expect(await storedGame(page)).toEqual(before)

  await page.getByRole('button', { name: 'まめと暮らす', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば', exact: true })).toBeVisible()
  await expect(page.locator('.play-pet .pet-art')).toHaveClass(/pet-stage-2/)
  expect(await storedGame(page)).toEqual({ ...before, activeId: 'mame', name: 'まめ', xp: 300 })
})
