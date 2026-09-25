import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { applyGameCommand } from '../../shared/game/commands'
import type { CommandRequest, CommandResponse, GameSnapshot } from '../../shared/game/contracts'
import { chooseStarter, initialGame } from '../../shared/game/game'
import { canRecordMeal } from '../../shared/game/subscription'

const userId = '00000000-0000-4000-8000-000000000001'
const day = '2026-09-26'
const origin = 'http://127.0.0.1:4190'
const scene = (page: Page, name: string) => page.locator(`main[data-scene="${name}"]`)

const googleUserId = '00000000-0000-4000-8000-000000000002'
const freshUserId = '00000000-0000-4000-8000-000000000003'

type OAuthRequest = { path: string; params: URLSearchParams; authorization?: string }

async function mockCloud(page: Page) {
  function initialSnapshot(): GameSnapshot {
    const state = chooseStarter(initialGame(day), 'komugi')
    state.tutorial = { version: 1, status: 'completed', step: 4, homeGuide: 'done' }
    state.claimedLoginDays = [day]
    return { state, revision: 0 }
  }
  const snapshots = new Map([
    [userId, initialSnapshot()],
    [googleUserId, initialSnapshot()],
    [freshUserId, initialSnapshot()],
  ])
  const operations = new Map<string, CommandResponse>()
  const feedRequests: CommandRequest[] = []
  const resetRequests: CommandRequest[] = []
  const authRequests: string[] = []
  const oauthRequests: OAuthRequest[] = []
  const exchanges: { auth_code: string; code_verifier: string }[] = []
  const loadUsers: string[] = []
  const blockedExternal: string[] = []
  let loadFails = false
  let signupFails = false
  let cancelOAuth = false
  let signedOut = false
  let pendingOAuth: 'link' | 'signin' = 'link'
  let loseFeedResponse = false
  let resetFails = false
  let loseResetResponse = false
  let release: (() => void) | undefined
  let hold: Promise<void> | undefined
  function makeSession(id: string, anonymous: boolean) {
    const accessToken = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({
          sub: id,
          aud: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url'),
      'fake-test-signature',
    ].join('.')
    const user = {
      id,
      aud: 'authenticated',
      role: 'authenticated',
      is_anonymous: anonymous,
      app_metadata: { provider: anonymous ? 'anonymous' : 'google' },
      user_metadata: {},
      identities: anonymous
        ? []
        : [{ identity_id: 'google-identity', provider: 'google', user_id: id }],
      created_at: `${day}T00:00:00Z`,
    }
    return {
      access_token: accessToken,
      refresh_token: `test-refresh-token-${id}`,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }
  }
  let session = makeSession(userId, true)
  function callback(params: URLSearchParams) {
    const target = new URL(params.get('redirect_to')!)
    expect(target.origin).toBe(origin)
    expect(target.pathname).toBe('/auth/callback')
    if (cancelOAuth) {
      target.searchParams.set('error', 'access_denied')
      target.searchParams.set('error_description', 'Google sign-in was canceled')
    } else target.searchParams.set('code', `test-${pendingOAuth}-code`)
    return target.href
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
    const url = new URL(request.url())
    const path = url.pathname
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Content-Type': 'application/json',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    authRequests.push(path)
    if (path === '/auth/v1/signup') {
      if (signupFails)
        return route.fulfill({
          status: 400,
          headers,
          json: { code: 'anonymous_provider_disabled', msg: 'Anonymous sign-in is unavailable' },
        })
      session = makeSession(signedOut ? freshUserId : userId, true)
      return route.fulfill({ status: 200, headers, json: session })
    }
    if (path === '/auth/v1/user/identities/authorize' || path === '/auth/v1/authorize') {
      pendingOAuth = path.includes('/identities/') ? 'link' : 'signin'
      oauthRequests.push({
        path,
        params: url.searchParams,
        authorization: request.headers().authorization,
      })
      if (pendingOAuth === 'link') {
        expect(request.headers().authorization).toBe(`Bearer ${session.access_token}`)
        return route.fulfill({ headers, json: { url: callback(url.searchParams) } })
      }
      return route.fulfill({
        status: 302,
        headers: { ...headers, Location: callback(url.searchParams) },
      })
    }
    if (path === '/auth/v1/token') {
      if (url.searchParams.get('grant_type') === 'pkce') {
        exchanges.push(request.postDataJSON())
        session = makeSession(pendingOAuth === 'link' ? userId : googleUserId, false)
      }
      return route.fulfill({ status: 200, headers, json: session })
    }
    if (path === '/auth/v1/user') return route.fulfill({ status: 200, headers, json: session.user })
    if (path === '/auth/v1/logout') {
      signedOut = true
      return route.fulfill({ status: 204, headers })
    }
    return route.fulfill({ status: 404, headers, json: { error: 'unexpected_test_auth_request' } })
  })
  await page.route(`${origin}/api/**`, async (route) => {
    const request = route.request()
    expect(request.headers().authorization).toBe(`Bearer ${session.access_token}`)
    const id = session.user.id
    const snapshot = snapshots.get(id)!
    const path = new URL(request.url()).pathname
    if (path === '/api/game') {
      loadUsers.push(id)
      return route.fulfill({
        status: loadFails ? 503 : 200,
        json: loadFails ? { error: 'storage_unavailable' } : snapshot,
      })
    }
    if (path === '/api/game/commands') {
      const body = request.postDataJSON() as CommandRequest
      if (body.command.type === 'feed') feedRequests.push(body)
      if (body.command.type === 'resetProgress') {
        resetRequests.push(body)
        if (resetFails)
          return route.fulfill({ status: 503, json: { error: 'storage_unavailable' } })
      }
      const key = `${id}:${body.operationId}`
      let response = operations.get(key)
      if (!response) {
        const result = applyGameCommand(snapshot.state, body.command, {
          today: day,
          mealId: `meal-${body.operationId}`,
        })
        if (body.command.type === 'feed' && !result.receipt)
          return route.fulfill({
            status: 422,
            json: {
              error:
                !body.command.input.mealRecordId && !canRecordMeal(snapshot.state)
                  ? 'daily_meal_limit_reached'
                  : 'command_not_applied',
            },
          })
        const updated = { state: result.state, revision: snapshot.revision + 1 }
        snapshots.set(id, updated)
        response = { snapshot: updated, receipt: result.receipt }
        operations.set(key, response)
      }
      if (body.command.type === 'feed') {
        if (hold) await hold
        if (loseFeedResponse) {
          loseFeedResponse = false
          return route.fulfill({ status: 503, json: { error: 'response_lost_after_commit' } })
        }
      }
      if (body.command.type === 'resetProgress' && loseResetResponse) {
        loseResetResponse = false
        return route.fulfill({ status: 503, json: { error: 'response_lost_after_commit' } })
      }
      return route.fulfill({ json: { snapshot: snapshots.get(id), receipt: response.receipt } })
    }
    return route.fulfill({ status: 404, json: { error: 'unexpected_test_api_request' } })
  })
  return {
    authRequests,
    oauthRequests,
    exchanges,
    loadUsers,
    feedRequests,
    resetRequests,
    blockedExternal,
    snapshot: (id = userId) => snapshots.get(id)!,
    freshGame: () => {
      snapshots.set(userId, { state: initialGame(day), revision: 0 })
    },
    failSignup: (value: boolean) => {
      signupFails = value
    },
    cancelOAuth: () => {
      cancelOAuth = true
    },
    failLoad: (value: boolean) => {
      loadFails = value
    },
    loseFeedResponse: () => {
      loseFeedResponse = true
    },
    failReset: (value: boolean) => {
      resetFails = value
    },
    loseResetResponse: () => {
      loseResetResponse = true
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
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Googleで続きから', exact: true })).toHaveCount(0)
}

async function openSettings(page: Page) {
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
}

async function prepareMeal(page: Page) {
  await page.locator('.play-feed').click()
  await expect(scene(page, 'photo')).toBeVisible()
  await page.getByRole('button', { name: '写真なしで体験する' }).click()
  await expect(scene(page, 'serve')).toBeVisible()
}

test('cloud starts anonymously and a failed load never falls back to a local starter', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  cloud.failLoad(true)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '記録を読み込めませんでした' })).toBeVisible()
  await expect(page.getByRole('group', { name: '最初のなかま' })).toHaveCount(0)
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
  cloud.failLoad(false)
  await page.getByRole('button', { name: 'もう一度読み込む' }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
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

async function saveMeal(page: Page, title: string) {
  await prepareMeal(page)
  await page.getByText('料理名をつける', { exact: true }).click()
  await page.getByRole('textbox', { name: /料理名/ }).fill(title)
  await page.getByRole('button', { name: 'こむぎにごはんをあげる', exact: true }).click()
  await expect(scene(page, 'eating')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
}

for (const account of ['anonymous', 'Google-linked'] as const) {
  test(`${account} players can cancel a progress reset or start over while keeping their account`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    test.skip(account === 'Google-linked' && process.env.E2E_GOOGLE_AUTH_ENABLED === 'false')
    if (account === 'anonymous') await page.setViewportSize({ width: 390, height: 844 })
    const cloud = await mockCloud(page)
    await begin(page)
    await saveMeal(page, 'リセット前のごはん')
    if (account === 'Google-linked') {
      await openSettings(page)
      await page.getByRole('button', { name: 'Googleと連携する', exact: true }).click()
      await expect.poll(() => cloud.exchanges.length).toBe(1)
      await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
    }
    await openSettings(page)
    await page.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
    await expect(
      page.getByRole('button', { name: '有料プランを利用中', exact: true }),
    ).toBeDisabled()
    await page.getByRole('button', { name: '閉じる', exact: true }).click()
    const before = structuredClone(cloud.snapshot())
    const otherAccount = structuredClone(cloud.snapshot(googleUserId))
    await openSettings(page)
    if (account === 'Google-linked')
      await expect(
        page.getByText('Googleアカウントに連携済みです。', { exact: true }),
      ).toBeVisible()
    const authBefore = [...cloud.authRequests]
    await expect(page.getByText('おためし設定', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '進捗をリセット', exact: true }).click()
    await expect(
      page.getByRole('button', { name: '記録を消して始める', exact: true }),
    ).toBeVisible()
    expect(cloud.resetRequests).toEqual([])
    if (account === 'anonymous') {
      await page.getByRole('region', { name: '進捗リセットの確認' }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: test.info().outputPath('reset-confirmation-mobile.png') })
    }
    await page.getByRole('button', { name: 'やめる', exact: true }).click()
    await expect(page.getByRole('button', { name: '記録を消して始める', exact: true })).toHaveCount(
      0,
    )
    expect(cloud.snapshot()).toEqual(before)
    expect(cloud.resetRequests).toEqual([])

    await page.getByRole('button', { name: '進捗をリセット', exact: true }).click()
    await page.getByRole('button', { name: '記録を消して始める', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true }),
    ).toBeVisible()
    expect(cloud.resetRequests).toHaveLength(1)
    expect(cloud.resetRequests[0].command).toEqual({ type: 'resetProgress' })
    expect(cloud.snapshot().state).toEqual({ ...initialGame(day), subscriptionPlan: 'premium' })
    expect(cloud.snapshot().revision).toBe(before.revision + 1)
    expect(cloud.snapshot(googleUserId)).toEqual(otherAccount)
    expect(cloud.authRequests).toEqual(authBefore)
    await page.reload()
    await expect(
      page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true }),
    ).toBeVisible()
    expect(cloud.snapshot().state).toEqual({ ...initialGame(day), subscriptionPlan: 'premium' })
    expect(cloud.loadUsers.every((id) => id === userId)).toBe(true)
    expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
    expect(cloud.authRequests).not.toContain('/auth/v1/logout')
    await page.getByRole('button', { name: 'こむぎを選ぶ', exact: true }).click()
    await page.getByRole('button', { name: 'この子とはじめる', exact: true }).click()
    await expect(scene(page, 'welcome')).toBeVisible()
    await page.getByRole('button', { name: 'ひろばを見てみる', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'コイン 140枚、おみせへ', exact: true }),
    ).toBeVisible()
    expect(cloud.snapshot().state.meals).toEqual([])
    expect(cloud.snapshot().state.claimedLoginDays).toEqual([day])
    if (account === 'Google-linked') {
      await openSettings(page)
      await expect(
        page.getByText('Googleアカウントに連携済みです。', { exact: true }),
      ).toBeVisible()
    }
    expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
    expect(cloud.blockedExternal).toEqual([])
  })
}

test('a failed reset keeps the existing progress and confirmation until saving succeeds', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, '保存しておくごはん')
  const before = structuredClone(cloud.snapshot())
  await openSettings(page)
  await page.getByRole('button', { name: '進捗をリセット', exact: true }).click()
  cloud.failReset(true)
  await page.getByRole('button', { name: '記録を消して始める', exact: true }).click()
  await expect(
    page.getByRole('region', { name: '進捗リセットの確認' }).getByRole('alert'),
  ).toContainText('保存サービスに接続できませんでした')
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '記録を消して始める', exact: true })).toBeEnabled()
  await expect(page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true })).toHaveCount(
    0,
  )
  expect(cloud.snapshot()).toEqual(before)
  cloud.failReset(false)
  await page.getByRole('button', { name: '記録を消して始める', exact: true }).click()
  await expect(page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true })).toBeVisible()
  expect(cloud.resetRequests).toHaveLength(2)
  expect(cloud.resetRequests[0]).toEqual(cloud.resetRequests[1])
  expect(cloud.snapshot().state).toEqual(initialGame(day))
  expect(cloud.snapshot().revision).toBe(before.revision + 1)
  expect(cloud.blockedExternal).toEqual([])
})

test('a lost reset response keeps the current screen and retries the same operation only once', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, '応答を待つごはん')
  const revision = cloud.snapshot().revision
  await openSettings(page)
  await page.getByRole('button', { name: '進捗をリセット', exact: true }).click()
  cloud.loseResetResponse()
  await page.getByRole('button', { name: '記録を消して始める', exact: true }).click()
  await expect(
    page.getByRole('region', { name: '進捗リセットの確認' }).getByRole('alert'),
  ).toContainText('保存サービスに接続できませんでした')
  await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true })).toHaveCount(
    0,
  )
  expect(cloud.snapshot().state).toEqual(initialGame(day))
  await page.getByRole('button', { name: '記録を消して始める', exact: true }).click()
  await expect(page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true })).toBeVisible()
  expect(cloud.resetRequests).toHaveLength(2)
  expect(cloud.resetRequests[0]).toEqual(cloud.resetRequests[1])
  expect(cloud.snapshot().revision).toBe(revision + 1)
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(cloud.blockedExternal).toEqual([])
})

test('cloud membership survives reload, unlocks extra meals and preserves records on downgrade', async ({
  page,
}) => {
  test.setTimeout(60_000)
  const cloud = await mockCloud(page)
  await begin(page)
  await expect(
    page.getByRole('button', { name: 'プラスに加入：もぐ日和プラスの特典を見る', exact: true }),
  ).toBeVisible()
  await page.goto('/book')
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toBeVisible()
  await page.goto('/')
  await saveMeal(page, '無料プランのごはん')
  await page.locator('.play-feed').click()
  await expect(
    page.getByRole('heading', { name: 'ごはんをもっと記録する', exact: true }),
  ).toBeVisible()
  await expect(scene(page, 'photo')).toHaveCount(0)
  expect(cloud.feedRequests).toHaveLength(1)
  await page.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
  await expect(page.getByRole('button', { name: '有料プランを利用中', exact: true })).toBeDisabled()
  expect(cloud.snapshot().state.subscriptionPlan).toBe('premium')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'プラス会員：会員プランを確認', exact: true }),
  ).toBeVisible()
  await page.goto('/book')
  await expect(page.locator('.recipe-collection-card').first()).toBeVisible()
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toHaveCount(0)
  await page.goto('/')
  await saveMeal(page, '有料プランの追加ごはん')
  expect(cloud.snapshot().state.mealRecords).toHaveLength(2)
  expect(cloud.snapshot().state.meals).toHaveLength(2)
  await openSettings(page)
  await page.getByRole('button', { name: '無料プランに切り替える', exact: true }).click()
  await expect(page.getByRole('button', { name: '無料プランを利用中', exact: true })).toBeDisabled()
  expect(cloud.snapshot().state.subscriptionPlan).toBe('free')
  expect(cloud.snapshot().state.mealRecords).toHaveLength(2)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'プラスに加入：もぐ日和プラスの特典を見る', exact: true }),
  ).toBeVisible()
  await page.locator('.play-feed').click()
  await expect(
    page.getByRole('heading', { name: 'ごはんをもっと記録する', exact: true }),
  ).toBeVisible()
  expect(cloud.feedRequests).toHaveLength(2)
  await page.goto('/album')
  await expect(page.getByText('無料プランのごはん', { exact: true })).toBeVisible()
  await expect(page.getByText('有料プランの追加ごはん', { exact: true })).toBeVisible()
  await page.goto('/book')
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toBeVisible()
  expect(cloud.blockedExternal).toEqual([])
})

test('switching accounts loads that user’s plan without carrying over paid membership', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await openSettings(page)
  await page.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
  await expect(page.getByRole('button', { name: '有料プランを利用中', exact: true })).toBeDisabled()
  expect(cloud.snapshot().state.subscriptionPlan).toBe('premium')
  await page.getByRole('button', { name: 'Googleで続きから', exact: true }).click()
  await page.getByRole('button', { name: 'Googleの記録を開く', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect.poll(() => cloud.loadUsers.at(-1)).toBe(googleUserId)
  await expect(
    page.getByRole('button', { name: 'プラスに加入：もぐ日和プラスの特典を見る', exact: true }),
  ).toBeVisible()
  await page.goto('/book')
  await expect(page.getByRole('complementary', { name: '広告', exact: true })).toBeVisible()
  await page.goto('/')
  await openSettings(page)
  await expect(page.getByRole('button', { name: '無料プランを利用中', exact: true })).toBeDisabled()
  expect(cloud.snapshot(googleUserId).state.subscriptionPlan).toBe('free')
  await page.getByRole('button', { name: '有料プランに切り替える', exact: true }).click()
  await expect(page.getByRole('button', { name: '有料プランを利用中', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect.poll(() => cloud.loadUsers.at(-1)).toBe(freshUserId)
  await openSettings(page)
  await expect(page.getByRole('button', { name: '無料プランを利用中', exact: true })).toBeDisabled()
  expect(cloud.snapshot(freshUserId).state.subscriptionPlan).toBe('free')
  expect(cloud.snapshot(googleUserId).state.subscriptionPlan).toBe('premium')
  expect(cloud.snapshot().state.subscriptionPlan).toBe('premium')
  expect(cloud.blockedExternal).toEqual([])
})

function expectPkce(cloud: Awaited<ReturnType<typeof mockCloud>>, path: string) {
  expect(cloud.oauthRequests).toHaveLength(1)
  const request = cloud.oauthRequests[0]
  expect(request.path).toBe(path)
  expect(request.params.get('provider')).toBe('google')
  expect(request.params.get('code_challenge_method')).toBe('s256')
  expect(request.params.get('code_challenge')).toMatch(/^[\w-]{43}$/)
  expect(cloud.exchanges).toHaveLength(1)
  expect(cloud.exchanges[0].code_verifier.length).toBeGreaterThanOrEqual(43)
  expect(cloud.blockedExternal).toEqual([])
}

test('anonymous startup runs once under StrictMode and reuses the saved session and meal on reload', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  await saveMeal(page, '匿名の晩ごはん')
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(cloud.loadUsers.every((id) => id === userId)).toBe(true)
  expect(cloud.snapshot().state.meals).toHaveLength(1)
  await page.goto('/album')
  await expect(page.getByText('匿名の晩ごはん', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
  expect(cloud.blockedExternal).toEqual([])
})

test('Google availability follows deployment settings while anonymous saves still work', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, '自動保存のごはん')
  await openSettings(page)
  await expect(page.getByText('記録は自動で保存されています。', { exact: true })).toBeVisible()
  if (process.env.E2E_GOOGLE_AUTH_ENABLED === 'false') {
    await expect(page.getByRole('button', { name: /Google/ })).toHaveCount(0)
    await expect(page.getByText('Googleと連携すると、ほかの端末でも続けられます。')).toHaveCount(0)
  } else {
    await expect(page.getByRole('button', { name: 'Googleと連携する', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Googleで続きから', exact: true })).toBeVisible()
  }
  expect(cloud.oauthRequests).toEqual([])
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(cloud.snapshot().state.meals[0].title).toBe('自動保存のごはん')
  expect(cloud.blockedExternal).toEqual([])
})

test('failed anonymous authentication offers retry without entering a local game', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  cloud.failSignup(true)
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '接続できませんでした', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('group', { name: '最初のなかま' })).toHaveCount(0)
  expect(cloud.loadUsers).toEqual([])
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(await page.evaluate(() => localStorage.getItem('mogubiyori-v1'))).toBeNull()
  cloud.failSignup(false)
  await page.getByRole('button', { name: 'もう一度試す', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(2)
  expect(cloud.blockedExternal).toEqual([])
})

test('optional Google linking uses PKCE and keeps the anonymous user and saved meals', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, '連携前のごはん')
  await openSettings(page)
  await page.getByRole('button', { name: 'Googleと連携する', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await openSettings(page)
  await expect(page.getByText('Googleアカウントに連携済みです。', { exact: true })).toBeVisible()
  expectPkce(cloud, '/auth/v1/user/identities/authorize')
  expect(cloud.exchanges[0].auth_code).toBe('test-link-code')
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(cloud.loadUsers.every((id) => id === userId)).toBe(true)
  expect(cloud.snapshot().state.meals[0].title).toBe('連携前のごはん')
  await page.goto('/album')
  await expect(page.getByText('連携前のごはん', { exact: true })).toBeVisible()
})

test('opening an existing Google account requires confirmation and switches to its independent saved game', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, 'この端末のごはん')
  await openSettings(page)
  await page.getByRole('button', { name: 'Googleで続きから', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Googleの記録を開く', exact: true })).toBeVisible()
  expect(cloud.oauthRequests).toEqual([])
  await page.getByRole('button', { name: 'Googleの記録を開く', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect.poll(() => cloud.loadUsers.at(-1)).toBe(googleUserId)
  expectPkce(cloud, '/auth/v1/authorize')
  expect(cloud.exchanges[0].auth_code).toBe('test-signin-code')
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(cloud.snapshot().state.meals[0].title).toBe('この端末のごはん')
  expect(cloud.snapshot(googleUserId).state.meals).toHaveLength(0)
  await page.goto('/album')
  await expect(page.getByText('この端末のごはん', { exact: true })).toHaveCount(0)
  await page.goto('/')
  await saveMeal(page, 'Googleのごはん')
  expect(cloud.snapshot(googleUserId).state.meals[0].title).toBe('Googleのごはん')
  expect(cloud.snapshot().state.meals).toHaveLength(1)
})

test('canceling Google linking returns to the original anonymous account without another signup', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, 'キャンセル前のごはん')
  cloud.cancelOAuth()
  await openSettings(page)
  await page.getByRole('button', { name: 'Googleと連携する', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Googleとの連携を完了できませんでした', exact: true }),
  ).toBeVisible()
  expect(cloud.exchanges).toEqual([])
  await page.getByRole('link', { name: 'ひろばへ戻る', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await openSettings(page)
  await expect(page.getByRole('button', { name: 'Googleと連携する', exact: true })).toBeVisible()
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  expect(cloud.loadUsers.every((id) => id === userId)).toBe(true)
  expect(cloud.snapshot().state.meals[0].title).toBe('キャンセル前のごはん')
  expect(cloud.blockedExternal).toEqual([])
})

test('logging out of Google starts a fresh anonymous account and leaves the previous game intact', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  await begin(page)
  await saveMeal(page, 'Googleに残すごはん')
  await openSettings(page)
  await page.getByRole('button', { name: 'Googleと連携する', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await openSettings(page)
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect.poll(() => cloud.loadUsers.at(-1)).toBe(freshUserId)
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(2)
  expect(cloud.snapshot().state.meals[0].title).toBe('Googleに残すごはん')
  expect(cloud.snapshot(freshUserId).state.meals).toHaveLength(0)
  await openSettings(page)
  await expect(page.getByRole('button', { name: 'Googleと連携する', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ログアウト', exact: true })).toHaveCount(0)
  expect(cloud.blockedExternal).toEqual([])
})

test('a new anonymous player can restore Google from the starter screen before playing', async ({
  page,
}) => {
  const cloud = await mockCloud(page)
  cloud.freshGame()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '最初のなかまを選ぶ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'はじめる', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Googleで続きから', exact: true })).toHaveCount(0)
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
  await page.getByRole('button', { name: '設定', exact: true }).click()
  await page.getByRole('button', { name: 'Googleで続きから', exact: true }).click()
  await page.getByRole('button', { name: 'Googleの記録を開く', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ひろば' })).toBeVisible()
  await expect.poll(() => cloud.loadUsers.at(-1)).toBe(googleUserId)
  expect(cloud.snapshot().state.activeId).toBeNull()
  expect(cloud.snapshot().state.meals).toHaveLength(0)
  expectPkce(cloud, '/auth/v1/authorize')
  expect(cloud.authRequests.filter((path) => path === '/auth/v1/signup')).toHaveLength(1)
})
