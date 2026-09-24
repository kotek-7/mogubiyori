import { expect, test, type Page } from '@playwright/test'
import { claimLogin, chooseStarter, initialGame, todayTokyo } from '../../src/app/game/browserGame'
import { navigate, storedGame, waitForSceneMotion } from './helpers'

const rooms = [
  { id: 'plain', name: 'いつものひろば' },
  { id: 'garden', name: '木もれびのひろば' },
  { id: 'night', name: '星あかりのひろば' },
  { id: 'seaside', name: '夕なぎの浜辺' },
  { id: 'brook', name: '小川のほとり' },
  { id: 'greenhouse', name: '温室のひろば' },
] as const

async function openRoomShop(page: Page) {
  await navigate(page, 'おみせ')
  await page
    .getByRole('group', { name: 'おみせのカテゴリ' })
    .getByRole('button', { name: 'ひろば', exact: true })
    .click()
}

async function attachScene(page: Page, name: string) {
  await waitForSceneMotion(page)
  const path = test.info().outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: true, animations: 'disabled' })
  await test.info().attach(name, { path, contentType: 'image/png' })
}

for (const [layout, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test.describe(layout, () => {
    test.use({ viewport, reducedMotion: 'reduce' })

    test('room previews match purchased backgrounds and selections survive reload', async ({
      page,
    }) => {
      test.setTimeout(90_000)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      const initial = claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi'))
      await page.addInitScript(
        (state) => {
          if (!localStorage.getItem('mogubiyori-v1'))
            localStorage.setItem('mogubiyori-v1', JSON.stringify(state))
        },
        {
          ...initial,
          tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
          coins: 1000,
          gems: 1000,
        },
      )
      await page.goto('/')
      await expect(page.locator('.play-world svg.gathering-plain')).toBeVisible()
      await openRoomShop(page)
      await expect(page.locator('.shop-card')).toHaveCount(rooms.length)
      for (const room of rooms) {
        const card = page.locator('.shop-card').filter({ hasText: room.name })
        await expect(card.locator(`svg.gathering-${room.id}`)).toBeVisible()
      }
      await attachScene(page, `${layout}-shop-gallery`)
      await navigate(page, 'ひろば')

      for (const room of rooms) {
        if (room.id !== 'plain') {
          await openRoomShop(page)
          await page.locator('.shop-card').filter({ hasText: room.name }).click()
          const detail = page.getByRole('dialog')
          await expect(detail.locator(`.item-preview svg.gathering-${room.id}`)).toBeVisible()
          await detail.getByRole('button', { name: '購入して使う', exact: true }).click()
        }
        await expect(page.locator(`.play-world svg.gathering-${room.id}`)).toBeVisible()
        await expect.poll(async () => (await storedGame(page)).equipped.room).toBe(room.id)
        await page.reload()
        await expect(page.locator(`.play-world svg.gathering-${room.id}`)).toBeVisible()
        expect((await storedGame(page)).owned).toContain(room.id)
        await expect(page.locator('.play-feed')).toBeInViewport()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `${room.name} should fit the ${layout} viewport`,
        ).toBe(true)
        await attachScene(page, `${layout}-${room.id}`)
      }

      await openRoomShop(page)
      await page.locator('.shop-card').filter({ hasText: 'いつものひろば' }).click()
      await page.getByRole('dialog').getByRole('button', { name: '使う', exact: true }).click()
      await expect(page.locator('.play-world svg.gathering-plain')).toBeVisible()
      await openRoomShop(page)
      await page.locator('.shop-card').filter({ hasText: '温室のひろば' }).click()
      await page.getByRole('dialog').getByRole('button', { name: '使う', exact: true }).click()
      await expect(page.locator('.play-world svg.gathering-greenhouse')).toBeVisible()
      expect(errors).toEqual([])
    })
  })
}
