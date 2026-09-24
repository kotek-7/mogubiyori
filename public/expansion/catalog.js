import { selectEntries } from './catalog-tools.js'
const $ = (selector) => document.querySelector(selector)
const esc = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const difficulty = ['', 'かんたん', 'ひと工夫', 'じっくり']
const duration = (minutes) =>
  minutes < 60
    ? `${minutes}分`
    : `${Math.floor(minutes / 60)}時間${minutes % 60 ? `${minutes % 60}分` : ''}`
const rarity = { common: 'ノーマル', rare: 'レア', special: 'スペシャル' }
const img = (path, alt = '', className = '') =>
  `<img src="${esc(path)}" alt="${esc(alt)}" class="${className}" loading="lazy" decoding="async">`
const clockIcon =
  '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 5v5l3 2"/></svg>'
const growthIcon =
  '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17V8M10 12Q2 12 3 5q7 0 7 7Zm0-3q0-7 7-6 1 6-7 6Z"/></svg>'
const coinIcon =
  '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="m10 5 3 5-3 5-3-5Z"/></svg>'
const nextIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5"/></svg>'
function hatTransform(character) {
  const t = character.stages[4].renderSpec.hatTransform
  return `translate(${t.translateX} ${t.translateY}) scale(${t.scaleX} ${t.scaleY})`
}
const hat = (item, character) =>
  `<svg class="hat" viewBox="0 0 300 300" aria-hidden="true"><image href="${esc(item.artPath)}" width="300" height="300" transform="${hatTransform(character)}"/></svg>`
let data,
  tab = 'recipes',
  page = 1,
  lastTrigger
const dialog = $('#detail')
dialog.querySelector('.close').addEventListener('click', () => dialog.close())
dialog.addEventListener('close', () => {
  document.body.style.overflow = ''
  lastTrigger?.focus()
})
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      dialog.close()
  }
})
function options() {
  const groups =
    tab === 'recipes'
      ? data.categories
      : tab === 'characters'
        ? data.collections
        : { hat: 'ぼうし', room: 'ひろば', ...data.collections }
  $('#category').innerHTML =
    '<option value="">すべて</option>' +
    Object.entries(groups)
      .map(([id, name]) => `<option value="${id}">${esc(name)}</option>`)
      .join('')
  document.querySelectorAll('.recipe-filter').forEach((el) => (el.hidden = tab !== 'recipes'))
  $('#filters').classList.toggle('is-simple', tab !== 'recipes')
  $('#query').placeholder = tab === 'recipes' ? '名前・材料で検索' : '名前・特徴で検索'
  $('#query-label').textContent = tab === 'recipes' ? '名前・材料で検索' : '名前・特徴で検索'
  $('#sort').querySelector('[value=time]').hidden = tab !== 'recipes'
}
function render() {
  if (!data) return
  const result = selectEntries(data[tab], {
    query: $('#query').value,
    category: $('#category').value,
    difficulty: tab === 'recipes' ? $('#difficulty').value : '',
    maxMinutes: tab === 'recipes' ? Number($('#time').value) : 0,
    sort: $('#sort').value,
    page,
    pageSize: 24,
    labels: { ...data.categories, ...data.collections },
  })
  page = result.page
  $('#result-count').textContent =
    `${result.total} 種類${result.total ? ` · ${(page - 1) * 24 + 1}–${Math.min(page * 24, result.total)} 件を表示` : ''}`
  $('#cards').innerHTML = result.entries
    .map((e) => {
      const isRecipe = tab === 'recipes',
        isCharacter = tab === 'characters',
        index = data[tab].indexOf(e) + 1
      const picture = isCharacter ? e.stages[4].artPath : e.artPath
      const pictureMarkup =
        !isRecipe && !isCharacter && e.kind === 'hat'
          ? `<svg viewBox="65 -8 170 118" aria-hidden="true"><image href="${esc(picture)}" width="300" height="300"/></svg>`
          : img(picture)
      const kicker = isRecipe
        ? data.categories[e.category]
        : isCharacter
          ? data.collections[e.habitat]
          : data.collections[e.collection]
      const meta = isRecipe
        ? `${duration(e.minutes)} · ${difficulty[e.difficulty]}`
        : isCharacter
          ? `${e.stages.length}段階`
          : `${e.price.toLocaleString()} ${e.currency === 'coins' ? 'コイン' : 'ジェム'}`
      const label = isRecipe
        ? 'レシピをひらく'
        : isCharacter
          ? '成長を見る'
          : e.kind === 'hat'
            ? 'かぶってみる'
            : 'ひろばを見る'
      return `<button class="card" data-id="${e.id}" aria-label="${esc(e.name)}：${label}"><span class="card-art ${isCharacter ? 'character' : !isRecipe ? 'item-' + e.kind : ''}"><span class="card-no">No. ${String(index).padStart(3, '0')}</span>${pictureMarkup}</span><span class="card-copy"><span class="card-kicker">${esc(kicker)}</span><strong class="card-name">${esc(e.name)}</strong><span class="card-meta"><span class="card-meta-info ${!isRecipe && !isCharacter ? 'card-price' : ''}">${isRecipe ? clockIcon : isCharacter ? growthIcon : coinIcon}${meta}</span><span class="card-next">${nextIcon}</span></span></span></button>`
    })
    .join('')
  $('#empty').hidden = !!result.total
  $('#page-number').textContent = `${page} / ${result.pages}`
  $('#prev').disabled = page === 1
  $('#next').disabled = page === result.pages
}
function detail(entry) {
  const e = entry
  let visual = '',
    info = ''
  if (tab === 'recipes') {
    visual = img(e.artPath, e.name)
    info = `<span class="edition">${esc(data.categories[e.category])} / ${esc(e.cuisine)}</span><h2 id="detail-title">${esc(e.name)}</h2><div><span class="pill">${duration(e.minutes)}</span><span class="pill">${difficulty[e.difficulty]}</span><span class="pill">${rarity[e.rarity]}</span></div><h3>材料（${e.servings}人分）</h3><ul class="ingredients">${e.ingredients.map((i) => `<li><span>${esc(i.name)}</span><strong>${esc(i.amount)}</strong></li>`).join('')}</ul><h3>つくり方</h3><ol>${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><h3>調理のコツ</h3><p class="tip">${esc(e.tip)}</p><p>道具：${e.equipment.map(esc).join('・')}</p><p>${e.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</p><p class="reward">${coinIcon}初回報酬 +${e.reward}コイン</p>`
  } else if (tab === 'characters') {
    visual =
      img(e.stages[4].artPath, `${e.name} ${e.stages[4].name}`, 'growth-preview') +
      `<div class="stages" role="group" aria-label="成長段階">${e.stages.map((s, i) => `<button class="stage" data-stage="${i}" aria-label="${esc(s.name)}（${i + 1} / ${e.stages.length}）" aria-pressed="${i === 4}">${img(s.artPath)}${esc(s.name)}</button>`).join('')}</div>`
    info = `<span class="edition">${esc(data.collections[e.habitat])}</span><h2 id="detail-title">${esc(e.name)}</h2><dl class="detail-facts"><div><dt>特徴</dt><dd>${esc(e.description)}</dd></div><div><dt>好物</dt><dd>${e.favoriteCategories.map((c) => esc(data.categories[c])).join('・')}<br>${e.favoriteTags.map(esc).join('・')}</dd></div><div><dt>出会い条件</dt><dd>おとなのなかま ${e.discovery.adultCompanions}匹<br>料理カード ${e.discovery.uniqueRecipes}種類</dd></div></dl>`
  } else {
    const pet = data.characters[0]
    visual = `<div class="tryon ${e.kind === 'room' ? 'is-room' : ''}">${e.kind === 'room' ? img(e.artPath, '', 'room') : ''}${img(pet.stages[4].artPath, pet.name, 'pet')}${e.kind === 'hat' ? hat(e, pet) : ''}</div><label class="preview-label" for="preview-friend">表示するなかま</label><select class="preview-select" id="preview-friend">${data.characters.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>`
    info = `<span class="edition">${esc(data.collections[e.collection])} / ${e.kind === 'hat' ? 'ぼうし' : 'ひろば'}</span><h2 id="detail-title">${esc(e.name)}</h2><dl class="detail-facts"><div><dt>価格</dt><dd>${e.price.toLocaleString()} ${e.currency === 'coins' ? 'コイン' : 'ジェム'}</dd></div><div><dt>解放条件</dt><dd>${e.unlock.uniqueRecipes ? `料理カード ${e.unlock.uniqueRecipes}種類` : 'なし'}</dd></div><div><dt>レア度</dt><dd>${rarity[e.rarity]}</dd></div></dl>`
  }
  $('#detail-body').innerHTML =
    `<div class="detail-layout"><div class="detail-visual">${visual}</div><article class="detail-info">${info}</article></div>`
  dialog.querySelectorAll('[data-stage]').forEach((button) =>
    button.addEventListener('click', () => {
      const i = Number(button.dataset.stage)
      $('.growth-preview').src = e.stages[i].artPath
      $('.growth-preview').alt = `${e.name} ${e.stages[i].name}`
      dialog
        .querySelectorAll('[data-stage]')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
    }),
  )
  $('#preview-friend')?.addEventListener('change', (event) => {
    const c = data.characters.find((c) => c.id === event.target.value)
    $('.tryon .pet').src = c.stages[4].artPath
    $('.tryon .pet').alt = c.name
    $('.tryon .hat image')?.setAttribute('transform', hatTransform(c))
  })
  dialog.showModal()
  document.body.style.overflow = 'hidden'
  dialog.scrollTop = 0
}
$('#cards').addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]')
  if (!button) return
  lastTrigger = button
  detail(data[tab].find((e) => e.id === button.dataset.id))
})
$('#filters').addEventListener('submit', (event) => event.preventDefault())
$('#filters').addEventListener('input', () => {
  page = 1
  render()
})
$('#filters').addEventListener('reset', () => {
  setTimeout(() => {
    page = 1
    render()
  }, 0)
})
document.querySelectorAll('[data-tab]').forEach((button) =>
  button.addEventListener('click', () => {
    if (!data) return
    tab = button.dataset.tab
    page = 1
    $('#filters').reset()
    options()
    document
      .querySelectorAll('[data-tab]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
    render()
  }),
)
for (const [id, delta] of [
  ['prev', -1],
  ['next', 1],
])
  $('#' + id).addEventListener('click', () => {
    if (!data) return
    page += delta
    render()
    $('#result-count').scrollIntoView({ block: 'start' })
  })
try {
  const response = await fetch('./catalog.json')
  if (!response.ok) throw new Error('catalog unavailable')
  data = await response.json()
  $('#counts').innerHTML =
    `<span>全 </span><strong>${data.recipes.length + data.characters.length + data.items.length}</strong><span>種類</span>`
  $('#recipe-count').textContent = data.recipes.length
  $('#character-count').textContent = data.characters.length
  $('#item-count').textContent = data.items.length
  options()
  render()
} catch {
  $('#result-count').textContent = '図鑑を読み込めませんでした。ページを再読み込みしてください。'
  $('#cards').innerHTML = '<a href="./index.html">再読み込み</a>'
}
