#!/usr/bin/env node
/** Assemble a searchable, offline presentation media kit from completed capture manifests. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const kit = path.resolve(root, process.env.PRESENTATION_KIT_DIR ?? 'artifacts/presentation-kit')
const zipPath = path.resolve(kit, '../mogubiyori-presentation-kit.zip')
const manifestDefinitions = [
  ['assets-manifest.json', 'assets', 'asset'],
  ['screenshots-manifest.json', 'screenshots', 'screen'],
  ['02-videos/videos-manifest.json', 'videos', 'video'],
  ['visuals-manifest.json', 'visuals', 'visual'],
  ['layouts-manifest.json', 'layouts', 'layout'],
]
const groups = {
  screen: 'ゲーム画面',
  video: '操作動画',
  companion: 'もぐ',
  item: 'アイテム',
  recipe: '料理',
  background: '背景',
  visual: 'キービジュアル・挿絵',
  layout: 'スライド用レイアウト',
  brand: 'ロゴ・装飾',
  demo: 'デモ写真',
}
const originLabels = {
  game: 'ゲームの原画',
  'demo-ui': '実画面・デモデータ',
  'expansion-catalog': '拡張カタログの原画',
  'legacy-art': '旧版の原画',
  'generated-illustration': '発表用の生成イラスト',
  'presentation-layout': '原画・実画面のレイアウト',
  'brand-and-ui': 'ロゴ・UI素材',
}
const files = new Set()
const entries = []
const loaded = []
const skipped = []
const identities = new Set()
const imagePaths = new Set()

function escape(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
function groupFor(entry, kind) {
  if (entry.category === 'demo-input') return 'demo'
  if (['screen', 'video', 'visual', 'layout'].includes(kind)) return kind
  if (entry.category?.startsWith('companions')) return 'companion'
  if (entry.category?.startsWith('items')) return 'item'
  if (entry.category?.startsWith('recipes')) return 'recipe'
  if (entry.category?.startsWith('background')) return 'background'
  return 'brand'
}
function ratioFor(width, height) {
  const ratio = width / height
  return Math.abs(ratio - 16 / 9) < 0.02
    ? '16:9'
    : Math.abs(ratio - 1) < 0.02
      ? '正方形'
      : ratio > 1
        ? '横長'
        : '縦長'
}
async function include(relative) {
  if (!relative) return
  const absolute = path.resolve(kit, relative)
  if (!absolute.startsWith(kit + path.sep)) throw new Error(`File outside kit: ${relative}`)
  const stat = await fs.stat(absolute)
  if (!stat.isFile() || !stat.size) throw new Error(`Empty or missing file: ${relative}`)
  files.add(relative)
  return absolute
}

for (const [filename, key, kind] of manifestDefinitions) {
  let document
  try {
    document = JSON.parse(await fs.readFile(path.join(kit, filename), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      skipped.push(filename)
      continue
    }
    throw error
  }
  loaded.push(filename)
  await include(filename)
  const source = Array.isArray(document) ? document : document[key]
  if (!Array.isArray(source)) throw new Error(`Expected ${key} array in ${filename}`)
  for (const original of source) {
    const entry = {
      ...original,
      title: original.title ?? original.label ?? original.name ?? original.id,
      kind,
    }
    entry.category ??= kind === 'video' ? '操作動画' : kind
    if (original.file?.endsWith('.mp4')) entry.mp4 ??= original.file
    if (original.path?.endsWith('.png')) entry.png ??= original.path
    if (original.path?.endsWith('.mp4')) entry.mp4 ??= original.path
    if (original.path?.endsWith('.webm')) entry.webm ??= original.path
    entry.poster ??= original.posterPath
    entry.group = groupFor(entry, kind)
    entry.groupLabel = groups[entry.group]
    entry.availability ??=
      kind === 'screen' || kind === 'video'
        ? 'demo-ui'
        : kind === 'visual'
          ? 'generated-illustration'
          : kind === 'layout'
            ? 'presentation-layout'
            : 'brand-and-ui'
    entry.originLabel = originLabels[entry.availability] ?? entry.availability
    entry.uid = `${kind}:${entry.category}:${entry.id}`
    if (identities.has(entry.uid)) throw new Error(`Duplicate entry: ${entry.uid}`)
    identities.add(entry.uid)
    const primary = entry.png ?? entry.mp4 ?? entry.webm ?? entry.svg
    if (!primary) throw new Error(`No media path for ${entry.uid}`)
    if (imagePaths.has(primary)) throw new Error(`Duplicate media path: ${primary}`)
    imagePaths.add(primary)
    for (const field of ['png', 'svg', 'mp4', 'webm', 'poster']) await include(entry[field])
    if (entry.png) {
      const buffer = await fs.readFile(path.join(kit, entry.png))
      if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
        throw new Error(`Invalid PNG: ${entry.png}`)
      const width = buffer.readUInt32BE(16),
        height = buffer.readUInt32BE(20)
      if ((entry.width && entry.width !== width) || (entry.height && entry.height !== height))
        throw new Error(`PNG dimensions differ: ${entry.png}`)
      entry.width = width
      entry.height = height
    }
    if (entry.mp4 ?? entry.webm) {
      const probe = JSON.parse(
        execFileSync(
          'ffprobe',
          [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height,codec_name:format=duration',
            '-of',
            'json',
            path.join(kit, entry.mp4 ?? entry.webm),
          ],
          { encoding: 'utf8' },
        ),
      )
      if (!probe.streams?.[0] || Number(probe.format.duration) <= 0)
        throw new Error(`Invalid video: ${primary}`)
      entry.width = probe.streams[0].width
      entry.height = probe.streams[0].height
      entry.durationSeconds = Number(probe.format.duration)
    }
    entry.ratio = ratioFor(entry.width, entry.height)
    entry.note ??= entry.description ?? ''
    entry.use =
      entry.group === 'screen' || entry.group === 'video'
        ? '操作説明'
        : entry.group === 'companion'
          ? '成長・なかま'
          : entry.group === 'recipe' || entry.group === 'demo'
            ? '料理・食'
            : entry.group === 'item' || entry.group === 'background'
              ? '着せ替え・背景'
              : entry.group === 'brand'
                ? '装飾'
                : /keyvisual|cover|title|ending|表紙|締め/.test(
                      entry.category + ' ' + entry.id + ' ' + entry.title,
                    )
                  ? '表紙・締め'
                  : 'サービス紹介'
    entries.push(entry)
  }
}
if (!entries.length) throw new Error('No completed manifests found')

// Editorial defaults keep the first screen useful; the full library remains one click away.
const preferred = [
  ...entries.filter((e) => e.kind === 'visual' && e.group !== 'demo').slice(0, 5),
  ...entries.filter((e) => e.kind === 'layout').slice(0, 5),
  ...entries.filter((e) => e.kind === 'video').slice(0, 4),
  ...entries
    .filter(
      (e) =>
        e.kind === 'screen' && /10-plaza-plain|20-recipe|21-recipe|meal|photo|profile/.test(e.id),
    )
    .slice(0, 5),
  ...entries.filter((e) => e.category === 'companions-core' && e.stage === 2),
  ...entries.filter((e) => e.id === 'wordmark-navy' || e.id === 'komugi-picnic'),
]
const recommended = new Set(preferred.map((e) => e.uid))
for (const entry of entries) {
  entry.recommended = recommended.has(entry.uid)
  if (entry.recommended)
    entry.recommendationRank = preferred.findIndex((item) => item.uid === entry.uid)
}
const counts = Object.fromEntries(
  Object.keys(groups).map((key) => [key, entries.filter((e) => e.group === key).length]),
)
const catalog = {
  title: 'もぐ日和 発表素材ライブラリ',
  generatedAt: new Date().toISOString(),
  total: entries.length,
  counts,
  loadedManifests: loaded,
  entries,
}
await fs.writeFile(path.join(kit, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
await include('catalog.json')
const csvFields = [
  'title',
  'groupLabel',
  'category',
  'use',
  'originLabel',
  'ratio',
  'width',
  'height',
  'transparent',
  'durationSeconds',
  'png',
  'svg',
  'mp4',
  'webm',
  'poster',
  'note',
  'sourceCommit',
]
const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
await fs.writeFile(
  path.join(kit, 'catalog.csv'),
  '\ufeff' +
    [
      csvFields.map(quote).join(','),
      ...entries.map((e) => csvFields.map((field) => quote(e[field])).join(',')),
    ].join('\r\n') +
    '\r\n',
)
await include('catalog.csv')

const css = `
:root{font-family:"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;color:#1b1c33;background:#f6f5f1;font-synthesis:none}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button,a,input,select{touch-action:manipulation}a{color:inherit}button{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #d32734;outline-offset:3px}.wrap{max-width:1520px;margin:auto;padding:0 40px}header{border-bottom:1px solid #d9d8d1;background:#fff}.top{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px 0}.wordmark{width:182px;height:auto}.toplinks{display:flex;gap:22px;font-size:13px}.hero{padding:42px 0 38px;display:flex;align-items:flex-end;justify-content:space-between;gap:32px}.eyebrow{font-size:12px;letter-spacing:.16em;color:#8c3c37;margin:0 0 12px;font-weight:700}.hero h1{font-size:clamp(28px,3vw,45px);letter-spacing:-.04em;line-height:1.35;margin:0 0 14px}.hero p{font-size:15px;line-height:1.9;margin:0;color:#5f606b}.total{text-align:right;white-space:nowrap}.total strong{font-size:44px;font-weight:800}.total span{display:block;color:#656670;font-size:12px}.toolbar{padding:26px 0 20px}.searchline{display:flex;gap:12px;align-items:center}.searchbox{flex:1;min-width:200px}.searchbox input{width:100%;border:1px solid #cccac3;border-radius:9px;background:#fff;padding:15px 17px;font-size:16px}.selects{display:flex;gap:10px}.selects label{font-size:11px;color:#696973;display:grid;gap:3px}.selects select{border:1px solid #cccac3;border-radius:7px;background:#fff;max-width:230px;padding:9px 12px;color:#1b1c33}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-top:21px}.tab{border:1px solid #d7d5cd;border-radius:24px;background:#fff;color:#515260;padding:9px 15px;font-size:13px;line-height:1.5}.tab[aria-pressed=true]{background:#1b1c33;color:#fff;border-color:#1b1c33}.tab small{margin-left:5px;opacity:.66;font-size:11px}.results-head{display:flex;justify-content:space-between;align-items:baseline;gap:15px;margin:14px 0 18px}.results-head h2{font-size:20px;margin:0}.results-head p{font-size:12px;color:#686871;margin:0}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}.card{border:1px solid #deddd6;border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 3px 12px #1b1c3304}.preview{height:228px;width:100%;padding:18px;border:0;border-bottom:1px solid #eeede9;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#f4f3ee 0% 25%,#fff 0% 50%) 50%/18px 18px}.preview.dark{background:#373849}.preview img{display:block;width:100%;height:100%;object-fit:contain;transition:transform .18s}.preview:hover img{transform:scale(1.025)}video.preview{padding:0;background:#ecebe6;object-fit:contain}.info{padding:17px 18px 18px}.kicker{display:flex;justify-content:space-between;gap:5px;color:#777780;font-size:10px;line-height:1.6;margin-bottom:8px}.info h3{font-size:15px;margin:0 0 8px;line-height:1.6;min-height:48px}.meta{font-size:11px;color:#6a6b73;margin:0 0 12px;line-height:1.7}.formats{display:flex;flex-wrap:wrap;gap:7px}.formats a{font-size:11px;text-decoration:none;border:1px solid #d6d5cd;padding:5px 9px;border-radius:5px;font-weight:700}.formats a:hover{background:#1b1c33;color:white}.more{text-align:center;padding:30px}.more button{background:#1b1c33;color:#fff;border:0;border-radius:7px;padding:13px 32px;font-size:14px}.empty{text-align:center;padding:70px 20px;background:white;border:1px solid #ddd;border-radius:12px}.notes{margin:36px 0 46px;padding:24px 27px;border-top:1px solid #d4d2cb;display:grid;grid-template-columns:1fr 1fr;gap:30px;font-size:12px;line-height:1.95;color:#62626b}.notes h2{font-size:13px;color:#333443;margin:0 0 9px}.notes p{margin:0}.notes a{text-decoration:underline}dialog{width:min(1220px,94vw);max-height:94vh;border:0;border-radius:14px;padding:0;background:#f6f5f1;box-shadow:0 20px 90px #0005}dialog::backdrop{background:#17182cc9}.dialog-head{display:flex;justify-content:space-between;align-items:center;padding:15px 22px;border-bottom:1px solid #d9d7cf;background:white}.dialog-head h2{font-size:16px;margin:0}.dialog-head button{border:1px solid #ccc;background:white;border-radius:6px;padding:8px 13px}.dialog-image{width:100%;height:65vh;object-fit:contain;padding:24px;background:repeating-conic-gradient(#eae9e3 0% 25%,#fafaf7 0% 50%) 50%/22px 22px}.dialog-foot{padding:16px 22px;background:#fff;display:flex;gap:20px;align-items:center;justify-content:space-between}.dialog-foot p{font-size:12px;line-height:1.7;max-width:750px;margin:0;color:#686871}.jump{font-size:12px;color:#555;display:block;margin-top:14px}footer{padding:16px 0 22px;border-top:1px solid #dedcd5;font-size:11px;color:#777}.sheet-title{font-size:34px;margin:0 0 10px}.sheet-sub{font-size:16px;color:#696871;margin:0 0 30px}.sheet{padding:44px;background:#f5f4ef}.sheet .grid{grid-template-columns:repeat(4,1fr);gap:18px}.sheet .preview{height:230px}.sheet .info{padding:12px 15px}.sheet .info h3{min-height:0;font-size:16px;margin:0}.sheet .meta{font-size:11px;margin:4px 0 0}@media(max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.searchline{align-items:stretch;flex-direction:column}.selects label{flex:1}.selects select{max-width:none;width:100%}}@media(max-width:760px){.wrap{padding:0 18px}.hero{padding:30px 0;align-items:flex-start}.total strong{font-size:30px}.hero p{font-size:13px}.hero h1{font-size:27px}.toplinks{font-size:11px;gap:12px}.wordmark{width:143px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.preview{height:175px;padding:10px}.info{padding:12px}.info h3{font-size:13px}.kicker{font-size:9px}.meta{font-size:10px}.selects{gap:6px}.selects select{font-size:12px;padding:9px 5px}.selects label{min-width:0}.tab{padding:8px 12px;font-size:12px}.notes{grid-template-columns:1fr;gap:20px;padding:20px 3px}.dialog-foot{display:block}.dialog-foot .formats{margin-top:12px}.results-head{align-items:flex-start;flex-direction:column;gap:6px}.total{display:none}}@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`
const brand = entries.find((entry) => entry.id === 'wordmark-navy')?.png
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>もぐ日和 発表素材ライブラリ</title><style>${css}</style></head><body>
<header><div class="wrap"><div class="top">${brand ? `<img class="wordmark" src="${brand}" alt="もぐ日和">` : '<strong>もぐ日和</strong>'}<nav class="toplinks" aria-label="資料"><a href="README.md">使い方</a><a href="catalog.csv" download>一覧 CSV</a><a href="#notes">素材について</a></nav></div></div></header>
<main class="wrap"><section class="hero"><div><p class="eyebrow">PRESENTATION MEDIA LIBRARY</p><h1>伝えたい場面に、<br>ちょうどいい素材を。</h1><p>ゲーム画面、操作動画、もぐたちの原画、発表用のイラスト。<br>用途やサイズを選んで、そのままスライドへ。</p></div><div class="total"><strong>${entries.length.toLocaleString('ja-JP')}</strong><span>種類の素材 / PNG・SVG・MP4</span></div></section>
<section class="toolbar" aria-label="素材を絞り込む"><div class="searchline"><label class="searchbox"><input id="search" type="search" placeholder="こむぎ、料理、ひろば、16:9…" aria-label="素材を検索"></label><div class="selects"><label>用途<select id="use"><option value="">すべての用途</option>${['表紙・締め', 'サービス紹介', '操作説明', '成長・なかま', '料理・食', '着せ替え・背景', '装飾'].map((v) => `<option>${v}</option>`).join('')}</select></label><label>サイズ<select id="ratio"><option value="">すべての比率</option>${['16:9', '横長', '正方形', '縦長'].map((v) => `<option>${v}</option>`).join('')}</select></label><label>素材の由来<select id="origin"><option value="">すべての由来</option>${Object.entries(
  originLabels,
)
  .map(([v, label]) => `<option value="${v}">${label}</option>`)
  .join(
    '',
  )}</select></label></div></div><div class="tabs" id="tabs"><button class="tab" data-group="recommended" aria-pressed="true">おすすめ</button><button class="tab" data-group="all" aria-pressed="false">すべて<small>${entries.length}</small></button>${Object.entries(
  groups,
)
  .filter(([key]) => counts[key])
  .map(
    ([key, label]) =>
      `<button class="tab" data-group="${key}" aria-pressed="false">${label}<small>${counts[key]}</small></button>`,
  )
  .join('')}</div></section>
<div class="results-head"><h2 id="results-title">まずはこちらから</h2><p id="results-count" role="status" aria-live="polite"></p></div><section id="grid" class="grid" aria-label="素材一覧"></section><div id="empty" class="empty" hidden>条件に合う素材がありません。検索語や絞り込みを変更してください。</div><div class="more"><button id="more" hidden>さらに36件表示</button><a class="jump" href="#search">検索・絞り込みへ戻る ↑</a></div>
<section class="notes" id="notes"><div><h2>スライドへの取り込み</h2><p>透過PNGは、そのまま置いて背景になじませられます。SVGは拡大や編集に、MP4はスライド内の操作デモに。画像を押すと大きく確認できます。白いロゴは濃い背景に合わせてください。オフラインでもすべての操作が使えます。</p></div><div><h2>素材の由来</h2><p>画面と動画は実アプリを使ったデモデータの撮影です。育成状況・所持品・食事記録・料理判定は撮影用です。生成イラストは発表向けの表現で、実際のUIとは区別しています。「拡張カタログの原画」は素材カタログ内のデータで、ゲームで利用できる機能・キャラクター数を示すものではありません。詳細は<a href="README.md">使い方と収録内容</a>にまとめています。</p></div></section></main>
<footer><div class="wrap">もぐ日和 発表素材ライブラリ · ローカル閲覧用 · <a href="catalog.json">JSON</a> · <a href="contact-sheets/01-overview.png">素材見本</a></div></footer>
<dialog id="viewer"><div class="dialog-head"><h2 id="viewer-title"></h2><button id="close-viewer">閉じる</button></div><img class="dialog-image" id="viewer-image" alt=""><div class="dialog-foot"><p id="viewer-note"></p><div class="formats" id="viewer-formats"></div></div></dialog>
<script type="application/json" id="catalog-data">${JSON.stringify(entries).replaceAll('<', '\\u003c')}</script>
<script>
const entries=JSON.parse(document.getElementById('catalog-data').textContent);const groups=${JSON.stringify(groups)};let active='recommended',limit=36;let filtered=[];
const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function links(e){return ['png','svg','mp4','webm'].filter(f=>e[f]).map(f=>'<a href="'+esc(e[f])+'" download>'+f.toUpperCase()+'</a>').join('')}
function card(e){const duration=e.durationSeconds?' · '+Math.round(e.durationSeconds)+'秒':'';const media=e.mp4||e.webm?'<video class="preview" controls preload="none" poster="'+esc(e.poster??'')+'" aria-label="'+esc(e.title)+'"><source src="'+esc(e.mp4??e.webm)+'" type="'+(e.mp4?'video/mp4':'video/webm')+'"></video>':'<button class="preview '+(e.id.includes('wordmark-white')?'dark':'')+'" data-view="'+esc(e.uid)+'" aria-label="'+esc(e.title)+'を拡大"><img src="'+esc(e.png??e.svg)+'" alt="'+esc(e.title)+'" loading="lazy" decoding="async"></button>';return '<article class="card">'+media+'<div class="info"><div class="kicker"><span>'+esc(e.groupLabel)+'</span><span>'+esc(e.ratio)+'</span></div><h3>'+esc(e.title)+'</h3><p class="meta">'+esc(e.originLabel)+'<br>'+e.width+' × '+e.height+(e.transparent?' · 透過':'')+duration+'</p><div class="formats">'+links(e)+'</div></div></article>'}
function render(){const query=$('search').value.trim().toLocaleLowerCase();const use=$('use').value,ratio=$('ratio').value,origin=$('origin').value;filtered=entries.filter(e=>(active==='all'||active==='recommended'&&e.recommended||e.group===active)&&(!use||e.use===use)&&(!ratio||e.ratio===ratio)&&(!origin||e.availability===origin)&&(!query||[e.title,e.id,e.category,e.groupLabel,e.originLabel,e.note,e.ratio,e.use].join(' ').toLocaleLowerCase().includes(query)));if(active==='recommended')filtered.sort((a,b)=>a.recommendationRank-b.recommendationRank);$('grid').innerHTML=filtered.slice(0,limit).map(card).join('');$('empty').hidden=!!filtered.length;$('more').hidden=filtered.length<=limit;$('results-title').textContent=active==='recommended'?'まずはこちらから':active==='all'?'すべての素材':groups[active];$('results-count').textContent=filtered.length+'件'+(filtered.length>limit?' / '+limit+'件を表示中':'');document.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.group===active));}
$('tabs').addEventListener('click',event=>{const b=event.target.closest('[data-group]');if(!b)return;active=b.dataset.group;limit=36;render()});for(const id of ['search','use','ratio','origin'])$(id).addEventListener(id==='search'?'input':'change',()=>{active=active==='recommended'?'all':active;limit=36;render()});$('more').addEventListener('click',()=>{limit+=36;render()});$('grid').addEventListener('click',event=>{const button=event.target.closest('[data-view]');if(!button)return;const e=entries.find(e=>e.uid===button.dataset.view);$('viewer-title').textContent=e.title;$('viewer-image').src=e.png??e.svg;$('viewer-image').alt=e.title;$('viewer-image').style.background=e.id.includes('wordmark-white')?'#373849':'';$('viewer-note').textContent=e.originLabel+' / '+e.width+' × '+e.height+(e.note?' — '+e.note:'');$('viewer-formats').innerHTML=links(e);$('viewer').showModal()});$('close-viewer').addEventListener('click',()=>$('viewer').close());$('viewer').addEventListener('click',e=>{if(e.target===$('viewer'))$('viewer').close()});render();
</script></body></html>`
await fs.writeFile(path.join(kit, 'index.html'), html)
await include('index.html')

const sheetDefinitions = [
  ['01-overview', '発表素材の見本', preferred.slice(0, 16)],
  [
    '02-companions',
    'もぐたちの成長と表情',
    entries.filter((e) => e.category === 'companions-core').slice(0, 24),
  ],
  [
    '03-game-screens',
    '実際のゲーム画面',
    entries
      .filter((e) => e.kind === 'screen')
      .filter((e) => !e.id.includes('mobile'))
      .slice(0, 16),
  ],
  [
    '04-food-and-items',
    '料理とアイテム',
    [
      ...entries.filter((e) => e.category === 'items-game').slice(0, 8),
      ...entries.filter((e) => e.category?.startsWith('recipes-cutout/')).slice(0, 8),
    ],
  ],
  [
    '05-visuals-layouts',
    'キービジュアルとレイアウト',
    [
      ...entries.filter((e) => e.kind === 'visual').slice(0, 12),
      ...entries.filter((e) => e.kind === 'layout').slice(0, 12),
    ],
  ],
]
await fs.mkdir(path.join(kit, 'contact-sheets'), { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({
    viewport: { width: 2000, height: 1200 },
    deviceScaleFactor: 1,
  })
  for (const [id, title, candidates] of sheetDefinitions) {
    const selected = candidates.filter((e) => e.png || e.poster)
    if (!selected.length) continue
    const sheet = `<!doctype html><html lang="ja"><meta charset="utf-8"><title>${title}</title><style>${css}</style><body class="sheet"><h1 class="sheet-title">${title}</h1><p class="sheet-sub">もぐ日和 · 発表素材ライブラリ</p><div class="grid">${selected.map((e) => `<article class="card"><div class="preview ${e.id.includes('wordmark-white') ? 'dark' : ''}"><img src="../${e.png ?? e.poster}" alt=""></div><div class="info"><h3>${escape(e.title)}</h3><p class="meta">${escape(e.groupLabel)} · ${e.width} × ${e.height}</p></div></article>`).join('')}</div></body></html>`
    const relative = `contact-sheets/${id}.html`
    await fs.writeFile(path.join(kit, relative), sheet)
    await page.goto(`file://${path.join(kit, relative)}`)
    await page.evaluate(async () => {
      await Promise.all([...document.images].map((img) => img.decode()))
    })
    await page.screenshot({ path: path.join(kit, `contact-sheets/${id}.png`), fullPage: true })
    await include(relative)
    await include(`contact-sheets/${id}.png`)
  }
} finally {
  await browser.close()
}

for (const filename of ['03-assets/licenses/lucide.txt', '03-assets/licenses/noto-sans-jp.txt']) {
  try {
    await include(filename)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
// Keep the selected prompts and capture guide with the portable media, not only in Git.
await fs.mkdir(path.join(kit, 'production-notes'), { recursive: true })
for (const filename of ['README.md', 'image-prompts.json', 'extra-image-prompts.json']) {
  const source = path.join(root, 'docs/presentation', filename)
  try {
    const destination = `production-notes/${filename}`
    await fs.copyFile(source, path.join(kit, destination))
    await include(destination)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
for (const reference of [
  '05-demo-input/characters-reference.png',
  '05-demo-input/characters-reference.svg',
]) {
  try {
    await include(reference)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
const readme = `# もぐ日和 発表素材キット

**index.html を開くと、日本語で検索できる素材一覧が表示されます。ネット接続は不要です。**

収録: **${entries.length.toLocaleString('ja-JP')}種類**。おすすめから選ぶか、用途・比率・由来を絞り込んで探せます。PNG・SVG・MP4等の形式違いは同じ素材の個別リンクにまとめています。

## すぐ使う

1. index.html をブラウザで開く。
2. 「表紙・締め」「操作説明」など用途を選び、画像を押して拡大確認する。
3. カードの PNG / SVG / MP4 を開くか、該当ファイルをスライドへ挿入する。

PNGはPowerPoint・Googleスライドなどへ直接置けます。透過PNGは背景を選ばず使えます。SVGは拡大・ベクター編集に適しています。アプリによってSVGや埋め込みフォントの対応が異なる場合はPNGを使用してください。MP4は操作の流れを見せるための動画で、音声を前提としません。白いロゴは濃い背景に置いてください。

## 収録内容

| 種類 | 点数 |
|---|---:|
${Object.entries(groups)
  .filter(([key]) => counts[key])
  .map(([key, label]) => `| ${label} | ${counts[key]} |`)
  .join('\n')}

- 01-screenshots: 実際のアプリ画面。モバイルと横長画面。
- 02-videos: 主要操作のキャプチャ。再生用動画とプレビュー画像。
- 03-assets: もぐ、成長段階、表情、着せ替え、料理、背景、ロゴ、UI素材。
- 04-visuals: 発表向けキービジュアル、挿絵、背景。
- 05-demo-input: 撮影に使用したデモ用写真。
- 06-layouts: 原画・実画面を配置したスライド用レイアウト。
- contact-sheets: 代表素材を見渡せるPNGとHTML。
- catalog.csv / catalog.json: 全件の日本語名・分類・寸法・由来・相対パス。
- production-notes: 画像生成に使ったプロンプトと撮影・再生成の手順。

存在する完成済みmanifestの内容を収録しています。${skipped.length ? '今回の梱包時点では ' + skipped.join('、') + ' は未作成です。再実行時に追加されます。' : 'すべての種類のmanifestを取り込み済みです。'}

## 素材の由来

画面と動画は実アプリを撮影しています。育成状況・所持品・所持金・食事記録などは発表用の架空データで、料理判定の応答も撮影用に固定しています。実際の利用者データやサービスの実績を示すものではありません。料理写真は生成したデモ素材です。

「ゲームの原画」は実装のReact SVGや配布SVGから書き出しています。「拡張カタログの原画」はカタログに含まれる素材で、ゲーム内に実装済みの種類数や到達可能な状態を意味しません。「旧版の原画」は現行のひろばとは別の室内イラストです。

「発表用の生成イラスト」は、既存のもぐを参考に発表向けに描いたビジュアルです。実画面とは区別して、表紙や機能紹介の挿絵として利用してください。「原画・実画面のレイアウト」はそれらを配置した構成素材です。

料理の透過版は、元のSVGから用紙の背景・余白の罫線やクロスだけを外しています。料理そのものの描画は原画を保っています。編集可能なSVGとPNGを対にして収録しています。

## ライセンスと再生成

UIアイコンとロゴに含むフォントのライセンスは 03-assets/licenses に同梱しています。その他の原画の出典は各manifestおよびcatalog.jsonのsourceを参照してください。

プロジェクト内で node scripts/presentation/package-kit.mjs を実行すると、完成したmanifestから一覧・この説明・コンタクトシート・ZIPを再生成できます。個別の撮影・素材出力方法はプロジェクトの scripts/presentation/README.md を参照してください。

梱包時に全参照ファイルの存在・重複、PNG寸法、動画の再生時間と映像ストリームを検証済みです。生成日時: ${catalog.generatedAt}
`
await fs.writeFile(path.join(kit, 'README.md'), readme)
await include('README.md')

// Only manifest-backed media and library files enter the ZIP; stale capture outputs stay out.
const zipInputs = [...files].sort().map((relative) => `${path.basename(kit)}/${relative}`)
const temporaryZip = `${zipPath}.tmp.zip`
await fs.rm(temporaryZip, { force: true })
execFileSync('zip', ['-q', '-1', temporaryZip, '-@'], {
  cwd: path.dirname(kit),
  input: zipInputs.join('\n') + '\n',
  maxBuffer: 10 * 1024 * 1024,
})
await fs.rename(temporaryZip, zipPath)
const archive = await fs.stat(zipPath)
console.log(
  JSON.stringify(
    {
      entries: entries.length,
      counts,
      loaded,
      skipped,
      files: files.size,
      zip: zipPath,
      zipBytes: archive.size,
    },
    null,
    2,
  ),
)
