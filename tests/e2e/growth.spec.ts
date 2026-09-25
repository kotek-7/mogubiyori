import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  chooseStarter,
  claimLogin,
  growthStages,
  initialGame,
  species,
  todayTokyo,
} from '../../src/app/game/browserGame'
import { companionProfiles } from '../../shared/content/companionProfiles'
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
    await expect(dialog.getByRole('heading', { name: 'うまれたてのころ' })).toBeVisible()
    await expect(dialog.locator('.profile-form-description')).toBeVisible()
    await expect(dialog.locator('.profile-form-description')).not.toBeEmpty()
    await page.getByRole('button', { name: '閉じる', exact: true }).click()
    await expect(page.locator('.play-pet .pet-art')).toHaveClass(new RegExp(`pet-stage-${stage}`))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

for (const entry of species) {
  test(`${entry.name} keeps ecology and personality separate while browsing all five growth descriptions and habits`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const state = claimLogin(initialGame(todayTokyo()))
    state.tutorial = { version: 1, step: 4, status: 'completed' }
    state.xp = 1050
    state.activeId = entry.id
    state.name = entry.name
    state.companions = [{ id: entry.id, xp: 1050, joinedDay: state.today }]
    await page.goto('/')
    await page.evaluate(
      (value) => localStorage.setItem('mogubiyori-v1', value),
      JSON.stringify(state),
    )
    await page.reload()
    const before = await storedGame(page)
    await page.locator('.play-growth').click()
    const dialog = page.getByRole('dialog')
    const profile = companionProfiles[entry.id]
    const common = dialog.locator('.profile-description')
    await expect(common.locator('summary')).toHaveText('生態')
    await expect(common.locator('p')).toHaveText(profile.ecology)
    const personality = dialog.locator('.profile-personality')
    await expect(personality.getByRole('heading')).toHaveText(`${entry.name}の性格`)
    await expect(personality.locator('p')).toHaveText(profile.personality)
    const commonText = await common.textContent()
    const descriptions = new Set<string>()
    const habits = new Set<string>()
    const habit = dialog.locator('.profile-habit')
    await expect(habit.getByRole('heading')).toHaveText('しぐさ')
    for (const { stage, name } of growthStages) {
      await dialog.getByRole('button', { name: `${name}の姿を見る` }).click()
      await expect(dialog.getByRole('heading', { name: `${name}のころ` })).toBeVisible()
      const description = dialog.locator('.profile-form-description')
      await expect(description).toHaveText(profile.stages[stage])
      descriptions.add((await description.textContent())!)
      await expect(habit.locator('p')).toHaveText(profile.habits[stage])
      habits.add((await habit.locator('p').textContent())!)
      expect(await common.textContent()).toBe(commonText)
      await expect(personality.locator('p')).toHaveText(profile.personality)
    }
    expect(descriptions.size).toBe(5)
    expect(habits.size).toBe(5)
    await common.locator('summary').click()
    await expect(common.locator('p').first()).not.toBeVisible()
    await expect(personality.locator('p')).toBeVisible()
    await expect(dialog.locator('.profile-form-description')).toBeVisible()
    await expect(habit.locator('p')).toBeVisible()
    await dialog.getByRole('button', { name: 'きせかえ' }).scrollIntoViewIfNeeded()
    await expect(dialog.getByRole('button', { name: 'きせかえ' })).toBeInViewport()
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    )
    await page.getByRole('button', { name: '閉じる', exact: true }).click()
    expect(await storedGame(page)).toEqual(before)
  })
}

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
