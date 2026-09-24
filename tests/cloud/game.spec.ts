import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { applyGameCommand } from '../../shared/game/commands'
import type { CommandRequest, CommandResponse, GameSnapshot } from '../../shared/game/contracts'
import { chooseStarter, initialGame } from '../../shared/game/game'

const userId = '00000000-0000-4000-8000-000000000001'
const day = '2026-09-26'
const origin = 'http://127.0.0.1:4190'
const scene = (page: Page, name: string) => page.locator(`main[data-scene="${name}"]`)

async function mockCloud(page: Page) {
  const state = chooseStarter(initialGame(day), 'komugi')
  state.tutorial = { version: 1, status: 'completed', step: 4, homeGuide: 'done' }
  state.claimedLoginDays = [day]
  let snapshot: GameSnapshot = { state, revision: 0 }
  const operations = new Map<string, CommandResponse>()
  const feedRequests: CommandRequest[] = []
  const authRequests: string[] = []
  const blockedExternal: string[] = []
  let loadFails = false
  let loseFeedResponse = false
  let release: (() => void) | undefined
  let hold: Promise<void> | undefined
  const accessToken = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        sub: userId,
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url'),
    'fake-test-signature',
  ].join('.')
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: true,
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: `${day}T00:00:00Z`,
  }
  const session = {
    access_token: accessToken,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  }

  // Deny every external host unless a test-owned route explicitly handles it.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === origin) return route.continue()
    blockedExternal.push(url.href)
    return route.abort()
  })
  await page.route('https://cloud-test.invalid/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Content-Type': 'application/json',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    authRequests.push(path)
    if (path === '/auth/v1/signup' || path === '/auth/v1/token')
      return route.fulfill({ status: 200, headers, json: session })
    if (path === '/auth/v1/user') return route.fulfill({ status: 200, headers, json: user })
    return route.fulfill({ status: 404, headers, json: { error: 'unexpected_test_auth_request' } })
  })
  await page.route(`${origin}/api/**`, async (route) => {
    const request = route.request()
    expect(request.headers().authorization).toBe(`Bearer ${accessToken}`)
    const path = new URL(request.url()).pathname
    if (path === '/api/game')
      return route.fulfill({
        status: loadFails ? 503 : 200,
        json: loadFails ? { error: 'storage_unavailable' } : snapshot,
      })
    if (path === '/api/game/commands') {
      const body = request.postDataJSON() as CommandRequest
      if (body.command.type === 'feed') feedRequests.push(body)
      let response = operations.get(body.operationId)
      if (!response) {
        const result = applyGameCommand(snapshot.state, body.command, {
          today: day,
          mealId: `meal-${body.operationId}`,
        })
        snapshot = { state: result.state, revision: snapshot.revision + 1 }
        response = { snapshot, receipt: result.receipt }
        operations.set(body.operationId, response)
      }
      if (body.command.type === 'feed') {
        if (hold) await hold
        if (loseFeedResponse) {
          loseFeedResponse = false
          return route.fulfill({ status: 503, json: { error: 'response_lost_after_commit' } })
        }
      }
      return route.fulfill({ json: { snapshot, receipt: response.receipt } })
    }
    return route.fulfill({ status: 404, json: { error: 'unexpected_test_api_request' } })
  })
  return {
    authRequests,
    feedRequests,
    blockedExternal,
    snapshot: () => snapshot,
    failLoad: (value: boolean) => {
      loadFails = value
    },
    loseFeedResponse: () => {
      loseFeedResponse = true
    },
    holdFeed: () => {
      hold = new Promise<void>((resolve) => {
        release = resolve
      })
    },
    releaseFeed: () => {
      release?.()
      hold = undefined
    },
  }
}

async function begin(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'はじめる', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ごはんのひろば' })).toBeVisible()
}

async function prepareMeal(page: Page) {
  await page.getByRole('button', { name: 'ごはんをあげる', exact: true }).click()
  await expect(scene(page, 'photo')).toBeVisible()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await expect(scene(page, 'serve')).toBeVisible()
}

test('cloud starts explicitly and a failed load never falls back to a local starter', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  cloud.failLoad(true)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'はじめる', exact: true })).toBeVisible()
  expect(cloud.authRequests).toEqual([])
  await page.getByRole('button', { name: 'はじめる', exact: true }).click()
  await expect(page.getByRole('heading', { name: '記録を読み込めませんでした' })).toBeVisible()
  await expect(page.getByRole('group', { name: '最初のなかま' })).toHaveCount(0)
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
  cloud.failLoad(false)
  await page.getByRole('button', { name: 'もう一度読み込む' }).click()
  await expect(page.getByRole('heading', { name: 'ごはんのひろば' })).toBeVisible()
  expect(cloud.blockedExternal).toEqual([])
})

test('a meal stays pending until the server confirms and starts its celebration once', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await prepareMeal(page)
  cloud.holdFeed()
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect.poll(() => cloud.feedRequests.length).toBe(1)
  await expect(page.getByRole('button', { name: 'ごはんを保存中', exact: true })).toBeDisabled()
  await expect(scene(page, 'eating')).toHaveCount(0)
  // Repeated form events cannot submit a second mutation while the first waits.
  await page
    .locator('#serve-meal')
    .evaluate((form) =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    )
  expect(cloud.feedRequests).toHaveLength(1)
  cloud.releaseFeed()
  await expect(scene(page, 'eating')).toBeVisible()
  expect(cloud.snapshot().state.meals).toHaveLength(1)
  expect(cloud.snapshot().state.xp).toBe(45)
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
  expect(cloud.blockedExternal).toEqual([])
})

test('a lost confirmation retains the meal and retries the same operation without another award', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await prepareMeal(page)
  await page.getByText('料理名をつける', { exact: true }).click()
  await page.getByRole('textbox', { name: /料理名/ }).fill('夜ごはん')
  cloud.loseFeedResponse()
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(scene(page, 'serve').getByRole('alert')).toBeVisible()
  await expect(page.getByRole('textbox', { name: /料理名/ })).toHaveValue('夜ごはん')
  await expect(scene(page, 'eating')).toHaveCount(0)
  expect(cloud.snapshot().state.meals).toHaveLength(1)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(scene(page, 'eating')).toBeVisible()
  expect(cloud.feedRequests).toHaveLength(2)
  expect(cloud.feedRequests[0]).toEqual(cloud.feedRequests[1])
  expect(cloud.snapshot().state.meals).toHaveLength(1)
  expect(cloud.snapshot().state.xp).toBe(45)
  expect(cloud.blockedExternal).toEqual([])
})
