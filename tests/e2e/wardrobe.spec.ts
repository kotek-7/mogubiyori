import { expect, test, type Page } from '@playwright/test'
import {
  chooseStarter,
  claimLogin,
  growthStages,
  initialGame,
  items,
  species,
  todayTokyo,
} from '../../src/app/game/browserGame'
import { navigate, sampleToTable, storedGame, waitForSceneMotion } from './helpers'

async function openCategory(page: Page, name: string) {
  await navigate(page, 'おみせ')
  await page
    .getByRole('group', { name: 'おみせのカテゴリ' })
    .getByRole('button', { name, exact: true })
    .click()
}

function outfit(page: Page, scope = '.play-pet') {
  return {
    hat: page.locator(`${scope} .pet-hat[data-item="i-picnic-straw"]`),
    neck: page.locator(`${scope} .pet-neck[data-item="neck-bandana"]`),
    bag: page.locator(`${scope} .pet-bag[data-item="bag-satchel"]`),
  }
}

test('hat, neckwear and bag can be tried on, bought and removed independently on mobile', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const initial = claimLogin(chooseStarter(initialGame(todayTokyo()), 'komugi'))
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem('mogubiyori-v1'))
        localStorage.setItem('mogubiyori-v1', JSON.stringify(state))
    },
    {
      ...initial,
      tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
      coins: 5000,
    },
  )
  await page.goto('/')
  for (const [category, id] of [
    ['ぼうし', 'i-picnic-straw'],
    ['くびもと', 'neck-bandana'],
    ['かばん', 'bag-satchel'],
  ]) {
    await openCategory(page, category)
    for (const label of ['ぼうし', 'くびもと', 'かばん', 'ひろば'])
      await expect(
        page.getByRole('group', { name: 'おみせのカテゴリ' }).getByRole('button', { name: label }),
      ).toBeInViewport()
    const item = items.find((entry) => entry.id === id)!
    await page.locator('.shop-card').filter({ hasText: item.name }).click()
    const preview = outfit(page, '.item-preview')
    await expect(preview.hat).toBeVisible()
    if (id !== 'i-picnic-straw') await expect(preview.neck).toBeVisible()
    if (id === 'bag-satchel') {
      await expect(preview.bag).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('combined-try-on.png') })
    }
    await page.getByRole('dialog').getByRole('button', { name: '購入して使う' }).click()
    await expect(page.locator('.play-world')).toBeVisible()
  }
  const expected = {
    hat: 'i-picnic-straw',
    neck: 'neck-bandana',
    bag: 'bag-satchel',
    room: 'plain',
  }
  expect((await storedGame(page)).equipped).toEqual(expected)
  const coins = (await storedGame(page)).coins
  await page.reload()
  for (const layer of Object.values(outfit(page))) await expect(layer).toBeVisible()
  await waitForSceneMotion(page)
  await page.screenshot({ path: testInfo.outputPath('mobile-outfit.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await openCategory(page, 'くびもと')
  await page.locator('.shop-card').filter({ hasText: 'くびもとを外す' }).click()
  await expect(outfit(page, '.item-preview').neck).toHaveCount(0)
  await expect(outfit(page, '.item-preview').hat).toBeVisible()
  await expect(outfit(page, '.item-preview').bag).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: '使う', exact: true }).click()
  expect((await storedGame(page)).equipped).toEqual({ ...expected, neck: 'neck-none' })
  expect((await storedGame(page)).coins).toBe(coins)
  await openCategory(page, 'くびもと')
  await page.locator('.shop-card').filter({ hasText: '赤いバンダナ' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '使う', exact: true }).click()
  expect((await storedGame(page)).equipped).toEqual(expected)
  expect((await storedGame(page)).coins).toBe(coins)

  await page.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await sampleToTable(page)
  for (const layer of Object.values(outfit(page, '.journey-screen')))
    await expect(layer).toBeVisible()
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(page.locator('[data-scene="eating"]')).toBeVisible()
  for (const layer of Object.values(outfit(page, '[data-scene="eating"]')))
    await expect(layer).toBeVisible()
  await page.getByRole('button', { name: '早送り', exact: true }).click()
  await expect(page.locator('[data-scene="xp"]')).toBeVisible()
  for (const layer of Object.values(outfit(page, '[data-scene="xp"]')))
    await expect(layer).toBeVisible()
})

test('combined clothing fits all thirty forms and all new items render', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const day = todayTokyo()
  const hats = items.filter((item) => item.kind === 'hat' && item.artPath)
  const necks = items.filter((item) => item.kind === 'neck' && item.price > 0)
  const bags = items.filter((item) => item.kind === 'bag' && item.price > 0)
  const portraits: { name: string; form: string; image: string }[] = []
  await page.goto('/')
  for (const friend of species) {
    for (const { stage, name, threshold } of growthStages) {
      const index = species.indexOf(friend) * growthStages.length + stage
      const selected = {
        hat: hats[index % hats.length].id,
        neck: necks[index % necks.length].id,
        bag: bags[index % bags.length].id,
        room: 'plain',
      }
      const state = {
        ...initialGame(day),
        tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
        activeId: friend.id,
        name: friend.name,
        xp: threshold,
        companions: [{ id: friend.id, xp: threshold, joinedDay: day }],
        claimedLoginDays: [day],
        owned: items.map((item) => item.id),
        equipped: selected,
      }
      await page.evaluate((value) => {
        const key = 'mogubiyori-v1'
        const oldValue = localStorage.getItem(key)
        const newValue = JSON.stringify(value)
        localStorage.setItem(key, newValue)
        window.dispatchEvent(
          new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }),
        )
      }, state)
      const pet = page.locator(`.play-pet .pet-${friend.id}.pet-stage-${stage}`)
      await expect(pet).toBeVisible()
      for (const slot of ['hat', 'neck', 'bag'] as const) {
        const layer = pet.locator(`.pet-${slot}[data-item="${selected[slot]}"]`)
        await expect(layer).toBeVisible()
        const box = await layer.evaluate((element) => {
          const art = element.getBoundingClientRect()
          const frame = element.closest('svg')!.getBoundingClientRect()
          return {
            width: art.width,
            height: art.height,
            fits:
              art.left >= frame.left - 1 &&
              art.right <= frame.right + 1 &&
              art.top >= frame.top - 1 &&
              art.bottom <= frame.bottom + 1,
          }
        })
        expect(box.width, `${friend.id}/${stage}/${slot}`).toBeGreaterThan(4)
        expect(box.height, `${friend.id}/${stage}/${slot}`).toBeGreaterThan(4)
        // External hat image viewboxes include transparent padding; only native accessory
        // groups have their drawn bounds measured by the browser.
        if (slot !== 'hat') expect(box.fits, `${friend.id}/${stage}/${slot} clips`).toBe(true)
      }
      await pet.locator('image').evaluateAll((images) =>
        Promise.all(
          images.map(
            (element) =>
              new Promise<void>((resolve, reject) => {
                const image = new Image()
                image.onload = () => resolve()
                image.onerror = () => reject(new Error('Hat image failed to load'))
                image.src = element.getAttribute('href')!
              }),
          ),
        ),
      )
      portraits.push({
        name: friend.name,
        form: name,
        image: (await pet.screenshot({ animations: 'disabled' })).toString('base64'),
      })
    }
  }
  expect(errors).toEqual([])
  await page.setViewportSize({ width: 1250, height: 1000 })
  await page.setContent(`<!doctype html><html lang="ja"><meta charset="utf-8">
    <title>きせかえと成長</title><style>
    *{box-sizing:border-box}body{margin:0;padding:24px;background:#f3f1e8;color:#25273e;font:15px sans-serif}
    h1{font-size:24px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
    figure{margin:0;padding:10px;background:white;border-radius:16px}
    img{display:block;width:100%;aspect-ratio:1;object-fit:contain}figcaption{text-align:center}
    </style><h1>きせかえと成長</h1><main>${portraits
      .map(
        (p) =>
          `<figure><img src="data:image/png;base64,${p.image}" alt="${p.name} ${p.form}"><figcaption>${p.name} · ${p.form}</figcaption></figure>`,
      )
      .join('')}</main></html>`)
  await page
    .locator('img')
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    )
  await page.screenshot({ path: testInfo.outputPath('wardrobe-thirty-forms.png'), fullPage: true })
})
