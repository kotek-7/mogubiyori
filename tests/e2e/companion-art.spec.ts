import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { growthStages, initialGame, species, todayTokyo } from '../../src/app/game/browserGame'

test('all thirty companion forms have distinct geometry and support every hat', async ({
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(180_000)
  // A separate normal browser context holds only synthetic, valid saves for this test.
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    timezoneId: 'Asia/Tokyo',
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const portraits: { name: string; form: string; image: string }[] = []
  const geometryBySpecies: Record<string, string[]> = {}
  const day = todayTokyo()
  const hats = ['beret', 'sprout', 'chef'] as const
  async function displaySave(value: string) {
    const previousPortrait = await page
      .locator('.play-pet')
      .evaluateAll((elements) => elements[0]?.innerHTML ?? null)
    await page.evaluate((newValue) => {
      const key = 'mogubiyori-v1'
      const oldValue = localStorage.getItem(key)
      localStorage.setItem(key, newValue)
      // The local gateway observes the same event sent by another browser tab.
      // Persistence/reload is tested elsewhere; art coverage needs 120 states.
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          oldValue,
          newValue,
          storageArea: localStorage,
          url: location.href,
        }),
      )
    }, value)
    await expect.poll(() => page.locator('.play-pet').innerHTML()).not.toBe(previousPortrait)
  }
  try {
    await page.goto('/')
    await expect(page.getByRole('group', { name: '最初のなかま' })).toBeVisible()
    for (const friend of species) {
      const signatures: string[] = []
      for (const { stage, name, threshold } of growthStages) {
        const state = {
          ...initialGame(day),
          tutorial: { version: 1, step: 4, status: 'completed' },
          activeId: friend.id,
          name: friend.name,
          xp: threshold,
          companions: [{ id: friend.id, xp: threshold, joinedDay: day }],
          claimedLoginDays: [day],
          owned: ['none', 'plain', ...hats],
        }
        await displaySave(JSON.stringify(state))
        await expect(page.locator('.play-name')).toContainText(`${name} · ${stage + 1}/5`)
        const portrait = page.locator('.play-pet .pet-art')
        await expect(portrait).toBeVisible()
        const condition = page.locator('.play-condition')
        await expect(condition).toBeVisible()
        await expect(condition).toHaveText('空腹')
        expect(
          await condition.evaluate((element) => {
            const box = element.getBoundingClientRect()
            const foreground = document.elementFromPoint(
              box.x + box.width / 2,
              box.y + box.height / 2,
            )
            return foreground === element || element.contains(foreground)
          }),
          `${friend.id}/${stage}: condition must stay readable above companion artwork`,
        ).toBe(true)
        const geometry = await portrait.evaluate((svg) => {
          const body = svg.querySelector('.pet-body')!
          const attributes = [
            'd',
            'cx',
            'cy',
            'r',
            'rx',
            'ry',
            'x',
            'y',
            'width',
            'height',
            'x1',
            'x2',
            'y1',
            'y2',
            'points',
          ]
          return [...body.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line')]
            .filter((shape) => !shape.closest('defs,.pet-hat'))
            .map((shape) => ({
              tag: shape.tagName,
              geometry: Object.fromEntries(
                attributes.flatMap((attribute) => {
                  const value = shape.getAttribute(attribute)
                  return value === null ? [] : [[attribute, value]]
                }),
              ),
            }))
        })
        expect(geometry.length, `${friend.id}/${stage} must contain drawn shapes`).toBeGreaterThan(
          4,
        )
        // Fill, stroke, CSS classes, IDs and outer transforms cannot make this pass.
        const signature = createHash('sha256').update(JSON.stringify(geometry)).digest('hex')
        expect(
          signatures,
          `${friend.id}/${stage} repeats an earlier form's geometry`,
        ).not.toContain(signature)
        signatures.push(signature)
        const image = await portrait.screenshot({ animations: 'disabled' })
        portraits.push({
          name: friend.name,
          form: `${stage + 1}. ${name}`,
          image: image.toString('base64'),
        })

        const hatSignatures: string[] = []
        for (const hat of hats) {
          await displaySave(JSON.stringify({ ...state, equipped: { ...state.equipped, hat } }))
          await expect(page.locator('.play-name')).toContainText(`${name} · ${stage + 1}/5`)
          const hatArt = page.locator('.play-pet .pet-art .pet-hat')
          await expect(hatArt).toBeVisible()
          const hatGeometry = await hatArt.evaluate((element) => {
            const hatBox = element.getBoundingClientRect()
            const svgBox = element.closest('svg')!.getBoundingClientRect()
            return {
              intersectsPortrait:
                hatBox.width > 0 &&
                hatBox.height > 0 &&
                hatBox.right > svgBox.left &&
                hatBox.left < svgBox.right &&
                hatBox.bottom > svgBox.top &&
                hatBox.top < svgBox.bottom,
              paths: [...element.querySelectorAll('path')].map((path) => path.getAttribute('d')),
            }
          })
          expect(hatGeometry.intersectsPortrait, `${friend.id}/${stage}/${hat}`).toBe(true)
          expect(hatGeometry.paths.length, `${hat} must contain actual artwork`).toBeGreaterThan(0)
          hatSignatures.push(JSON.stringify(hatGeometry.paths))
          expect(errors, `${friend.id}/${stage}/${hat} produced a browser error`).toEqual([])
        }
        expect(new Set(hatSignatures).size).toBe(3)
      }
      expect(new Set(signatures).size, `${friend.id} should have five shapes`).toBe(5)
      geometryBySpecies[friend.id] = signatures
    }
    expect(portraits).toHaveLength(30)
    await testInfo.attach('companion-geometry-signatures', {
      body: JSON.stringify(geometryBySpecies, null, 2),
      contentType: 'application/json',
    })

    const sheet = await context.newPage()
    await sheet.setViewportSize({ width: 1250, height: 1000 })
    await sheet.setContent(`<!doctype html><html lang="ja"><meta charset="utf-8">
      <title>なかまの成長 — 実アプリ30姿</title>
      <style>
        *{box-sizing:border-box}body{margin:0;padding:24px;background:#e8f2ee;color:#243b53;font:15px sans-serif}
        h1{font-size:23px;margin:0 0 8px}p{margin:0 0 20px;color:#526777}
        main{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
        figure{margin:0;padding:10px;background:#fffef8;border:1px solid #c8dad5;border-radius:16px}
        img{display:block;width:100%;aspect-ratio:1;object-fit:contain}figcaption{text-align:center}
        strong,span{display:block}strong{font-size:16px;margin:4px 0}span{font-size:13px}
      </style><h1>なかまの成長 — 実アプリ30姿</h1>
      <p>ひろばで表示したSVGのスクリーンショット。各行が同じなかま、左から成長の順。</p>
      <main>${portraits.map((portrait) => `<figure><img src="data:image/png;base64,${portrait.image}" alt="${portrait.name} ${portrait.form}"><figcaption><strong>${portrait.name}</strong><span>${portrait.form}</span></figcaption></figure>`).join('')}</main></html>`)
    await sheet
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
      )
    const sheetImage = await sheet.screenshot({
      path: testInfo.outputPath('companion-growth-contact.png'),
      fullPage: true,
    })
    await writeFile(join(tmpdir(), 'mogubiyori-companion-growth-contact.png'), sheetImage)
    await testInfo.attach('thirty-companion-forms', { body: sheetImage, contentType: 'image/png' })
  } finally {
    await context.close()
  }
})
