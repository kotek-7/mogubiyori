import { expect, test } from '@playwright/test'
import type { Locator, Page, TestInfo } from '@playwright/test'
import { chooseStarter, claimLogin, initialGame } from '../../src/app/game/browserGame'
import type { GameState } from '../../src/app/game/browserGame'
import { waitForSceneMotion } from './helpers'

const rooms = ['plain', 'garden', 'night', 'seaside', 'brook', 'greenhouse'] as const
type Room = (typeof rooms)[number]

function starter(room: Room): GameState {
  const state = claimLogin(chooseStarter(initialGame('2026-09-24'), 'komugi'))
  return {
    ...state,
    tutorial: { version: 1, step: 4, status: 'completed', homeGuide: 'done' },
    owned: [...new Set([...state.owned, ...rooms])],
    equipped: { ...state.equipped, room },
  }
}

async function seedRoom(page: Page, room: Room) {
  await page.goto('/')
  await page.evaluate(
    (state) => localStorage.setItem('mogubiyori-v1', JSON.stringify(state)),
    starter(room),
  )
  await page.reload()
  await expect(page.locator('.play-app')).toHaveAttribute('data-page', 'room')
  await expect(page.locator(`.play-scenery.gathering-${room}`)).toBeVisible()
  await waitForSceneMotion(page)
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.mouse.move(0, 0)
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: false, animations: 'disabled' })
  await testInfo.attach(name, { path, contentType: 'image/png' })
}

async function expectUsableAtCenter(page: Page, control: Locator) {
  await expect(control).toBeVisible()
  const box = await control.boundingBox()
  const viewport = page.viewportSize()!
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(-1)
  expect(box!.y).toBeGreaterThanOrEqual(-1)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
  expect(
    await control.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return element.contains(
        document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2),
      )
    }),
    `${(await control.getAttribute('aria-label')) ?? (await control.innerText())} must receive input at its center`,
  ).toBe(true)
  await control.click({ trial: true })
}

async function expectFieldUsable(page: Page) {
  const viewport = page.viewportSize()!
  const scenery = page.locator('svg.play-scenery')
  await expect(scenery).toHaveAttribute('data-presentation', 'field')
  const field = await scenery.boundingBox()
  expect(field).not.toBeNull()
  expect(Math.abs(field!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(field!.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(field!.width - viewport.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(field!.height - viewport.height)).toBeLessThanOrEqual(1)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    'the full field and its HUD must not create horizontal overflow',
  ).toBe(true)

  const feed = page.locator('.play-feed')
  const navigation = page.getByRole('navigation', { name: 'メインナビゲーション' })
  const feedBox = await feed.boundingBox()
  const navBox = await navigation.boundingBox()
  expect(feedBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  expect(feedBox!.y + feedBox!.height, 'navigation must stay below the food action').toBeLessThan(
    navBox!.y,
  )

  await expectUsableAtCenter(page, feed)
  await expectUsableAtCenter(
    page,
    page.getByRole('button', { name: 'こむぎをなでる', exact: true }),
  )
  await expect(navigation.getByRole('button')).toHaveCount(3)
  for (const name of ['ひろば', 'ずかん', 'おみせ']) {
    await expectUsableAtCenter(page, navigation.getByRole('button', { name, exact: true }))
  }
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-24T03:00:00Z'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 1440, height: 900 },
]) {
  test(`all six fields fill ${viewport.width}×${viewport.height} and leave the main controls usable`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000)
    await page.setViewportSize(viewport)
    for (const room of rooms) {
      await test.step(room, async () => {
        await seedRoom(page, room)
        try {
          await expectFieldUsable(page)
        } finally {
          await capture(page, testInfo, `field-${room}-${viewport.width}x${viewport.height}`)
        }
      })
    }
  })
}

test('reduced transparency replaces the shared acrylic HUD with readable solid white', async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'The reduced-transparency media feature uses Chromium CDP.')
  await page.setViewportSize({ width: 390, height: 844 })
  const session = await page.context().newCDPSession(page)
  const setTransparency = (value: 'reduce' | 'no-preference') =>
    session.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-transparency', value },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    })
  try {
    await setTransparency('no-preference')
    await seedRoom(page, 'night')
    const surfaces = [
      page.locator('.play-wallet'),
      page.locator('.play-growth'),
      page.locator('.play-nav'),
    ]
    if (await page.evaluate(() => CSS.supports('backdrop-filter', 'blur(1px)'))) {
      for (const surface of surfaces) {
        await expect(surface).not.toHaveCSS('backdrop-filter', 'none')
        await expect(surface).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
      }
    }
    await setTransparency('reduce')
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches),
      'the browser must actually apply the reduced-transparency preference',
    ).toBe(true)
    for (const surface of surfaces) {
      await expect(surface).toHaveCSS('background-color', 'rgb(255, 255, 255)')
      await expect(surface).toHaveCSS('backdrop-filter', 'none')
    }
    await expectFieldUsable(page)
  } finally {
    await capture(page, testInfo, 'field-night-reduced-transparency-390x844')
    await session.detach()
  }
})

test('long companion names and visiting friends stay usable on a small field', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  const name = 'ひろばのこむぎちゃん'
  const state = starter('plain')
  state.name = name
  state.xp = 600
  state.companions[0].xp = 600
  for (const visitors of [[], ['mame', 'shizuku', 'yuzu']] as const) {
    await page.goto('/')
    await page.evaluate((value) => localStorage.setItem('mogubiyori-v1', JSON.stringify(value)), {
      ...state,
      visitors,
    })
    await page.reload()
    await expect(page.locator('.play-name strong')).toHaveText(name)
    await waitForSceneMotion(page)
    const text = await page.locator('.play-name strong').boundingBox()
    const growth = await page.locator('.play-growth').boundingBox()
    expect(text!.x + text!.width).toBeLessThanOrEqual(growth!.x + growth!.width)
    await expectUsableAtCenter(page, page.locator('.play-growth'))
    await expectUsableAtCenter(
      page,
      page.getByRole('button', { name: `${name}をなでる`, exact: true }),
    )
    for (const guest of await page.locator('.play-guests button').all()) {
      await expectUsableAtCenter(page, guest)
      expect(
        await guest.evaluate((element) => {
          const box = element.getBoundingClientRect()
          return element.contains(document.elementFromPoint(box.x + box.width / 2, box.bottom - 2))
        }),
        'visiting friends must not be covered by the interaction controls',
      ).toBe(true)
    }
    await expect(page.locator('.play-feed')).toHaveAccessibleDescription('今日のごはん 未記録')
    await capture(
      page,
      testInfo,
      `field-long-name-${visitors.length ? 'visitors' : 'alone'}-320x568`,
    )
  }
})
