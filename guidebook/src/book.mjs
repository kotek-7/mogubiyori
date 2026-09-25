import { chapters } from './chapters.mjs'
import {
  places,
  species,
  people,
  glossary,
  foodStories,
  dayMoments,
  islandSpecies,
} from './world-data.ts'
import { stories, discoveries, openingLetter } from './stories.mjs'
import { peopleNotes, foodNotes, moreGlossary } from './details.mjs'

export const pages = []
const e = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
const href = (path) => `/${path}${path ? '/' : ''}`
const p = (paragraphs) => paragraphs.map((text) => `<p>${e(text)}</p>`).join('')
const img = (name, alt, eager = false, cls = '') =>
  `<img src="/art/${name}.webp" alt="${e(alt)}" width="1536" height="1024" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" class="${cls}">`
const artKey = {
  hoeri: 'komugi',
  yabumimi: 'mame',
  mizuwatari: 'shizuku',
  mitsubao: 'yuzu',
  kagene: 'momo',
  iwame: 'goma',
}
const names = {
  hoeri: 'こむぎ',
  yabumimi: 'まめ',
  mizuwatari: 'しずく',
  mitsubao: 'ゆず',
  kagene: 'もも',
  iwame: 'ごま',
}
const islands = places.filter((place) => place.id !== 'kaya')
const kaya = places.find((place) => place.id === 'kaya')
const islandIds = ['ashiro', 'tonu', 'sera', 'nika', 'une', 'yorba']
const islandByName = (location) =>
  islands.find((island) => location.includes(island.name.replace('島', '')))
const islandFromStory = (story) => islandByName(story.location) || islands[0]
const plateClass = (art) => (art === 'field-plate' ? 'plate' : '')
const add = (path, title, chapter, body, description = '', extra = {}) =>
  pages.push({ path, title, chapter, body, description, ...extra })
const chapter = (slug) => chapters.find((item) => item.slug === slug)
const link = (path, title, className = 'text-link') =>
  `<a class="${className}" href="${href(path)}">${e(title)} <span aria-hidden="true">↗</span></a>`
const specimen = (id, stage = 4, eager = false) =>
  `<img src="/art/characters/${artKey[id]}-${stage}.svg" alt="${e(species.find((item) => item.id === id)?.name)}・${['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき'][stage]}" width="300" height="300" ${eager ? '' : 'loading="lazy"'} decoding="async">`
const sectionHeading = (label, title, path, action) =>
  `<div class="section-heading"><div><p class="eyebrow">${e(label)}</p><h2>${e(title)}</h2></div>${path ? link(path, action) : ''}</div>`
const map = () =>
  `<figure><div class="map">${img('atlas', '中央のアシロ、西のトヌ、南のセラ、東のニカ、北のウネ、北東のヨルバを描いたナロ諸島の絵地図')}${islands
    .map((island) => {
      const xy = {
        ashiro: [49, 46],
        tonu: [16, 32],
        sera: [47, 82],
        nika: [85, 55],
        une: [47, 13],
        yorba: [83, 19],
      }[island.id]
      return `<a class="map-pin" style="--x:${xy[0]}%;--y:${xy[1]}%" href="/islands/${island.id}/">${e(island.name)}</a>`
    })
    .join(
      '',
    )}</div><figcaption class="map-legend"><span>島の名前から、それぞれの地誌へ。</span><span>ナロ諸島 絵地図<br>島の位置と景色を楽しむための見取り図</span></figcaption></figure>`
const chapterCard = (ch) =>
  `<a class="chapter-card" href="/${ch.slug}/"><figure class="${plateClass(ch.art)}">${img(ch.art, ch.title === 'もぐを知る' ? 'ホエリ、ヤブミミ、ミズワタリの図譜' : ch.title)}</figure><p class="eyebrow">${ch.number === '序' || ch.number === '末' ? ch.number + 'の章' : '第' + ch.number + '章'}</p><h3>${e(ch.title)} <span class="arrow" aria-hidden="true">↗</span></h3><p>${e(ch.description)}</p></a>`
const sceneFor = (location) =>
  location.includes('ニカ')
    ? 'market'
    : location.includes('ウネ')
      ? 'tea-path'
      : location.includes('アシロ')
        ? 'village'
        : 'atlas'
const storyArt = (story) =>
  story.slug === 'three-stones-in-winter' ? 'winter-night' : sceneFor(story.location)
const night = (story) => /夜|冬|白い布/.test(story.title + story.category)
const storyCard = (story, index) =>
  `<a class="story-card ${night(story) ? 'night' : ''}" href="/stories/${story.slug}/" data-category="${e(storyGroup(story))}"><figure style="--focus:${index % 2 ? '65% 65%' : '30% 45%'}">${img(storyArt(story), story.location)}</figure><p class="eyebrow">${e(story.category)}</p><h3>${e(story.title)}</h3><p>${e(story.summary)}</p><small>${e(islandFromStory(story).name)} · 約${Math.max(3, Math.ceil(story.paragraphs.join('').length / 350))}分</small></a>`
const storyGroup = (story) =>
  /夜|冬|白い布/.test(story.title + story.category)
    ? '夜の物語'
    : /島の道|手仕事|季節/.test(story.category)
      ? '旅と手仕事'
      : '食卓と日々'
const creatureCard = (s, index) =>
  `<a class="specimen-card" href="/mogs/${s.id}/"><figure><span class="specimen-number">NO. ${String(index + 1).padStart(2, '0')}</span>${specimen(s.id)}</figure><h3>${e(s.name)}</h3><p>${e(s.catchphrase)}</p></a>`
const detourCard = (item, index) =>
  `<a class="story-card" href="/village/${item.slug}/"><figure style="--focus:${index % 2 ? '25% 60%' : '75% 40%'}">${img(sceneFor(item.location), item.location)}</figure><p class="eyebrow">${e(item.location)}</p><h3>${e(item.title)}</h3><p>${e(item.summary)}</p></a>`
const related = (links) =>
  `<div class="related"><h2>このページから、もうひとつ。</h2>${links.map((item) => `<a href="${href(item.path)}">${e(item.title)} <span aria-hidden="true">→</span></a>`).join('')}</div>`
const turns = (items, current, base) => {
  const index = items.findIndex((item) => (item.id || item.slug) === current)
  const before = items[(index - 1 + items.length) % items.length]
  const after = items[(index + 1) % items.length]
  return `<nav class="page-turn" aria-label="前後のページ"><a href="/${base}/${before.id || before.slug}/"><small>← 前のページ</small>${e(before.name || before.title)}</a><a href="/${base}/${after.id || after.slug}/"><small>次のページ →</small>${e(after.name || after.title)}</a></nav>`
}
const aside = (ch, current) =>
  `<aside class="article-aside"><div class="aside-sticky"><h2 class="aside-title">この章のページ</h2><nav class="aside-links" aria-label="章内のページ">${pages
    .filter((page) => page.chapter === ch && page.path !== ch)
    .map(
      (page) =>
        `<a href="${href(page.path)}"${page.path === current ? ' aria-current="page"' : ''}>${e(page.title)}</a>`,
    )
    .join(
      '',
    )}<a href="/${ch}/">${e(chapter(ch).title)} の扉へ</a></nav><figure class="aside-illustration">${specimen('hoeri', 1)}<figcaption>急がず、気になる方へ。</figcaption></figure></div></aside>`
const article = (main, ch, path) =>
  `<div class="wrap article"><article class="article-main">${main}</article><!--ASIDE:${ch}:${path}--></div>`
const chapterHero = (ch) =>
  `<section class="wrap chapter-hero tone-${ch.tone}"><div><p class="eyebrow">${ch.number === '序' ? '巻頭の手紙' : ch.number === '末' ? '巻末のしおり' : '第' + ch.number + '章'}</p><h1>${e(ch.title)}</h1><p class="subtitle">${e(ch.subtitle)}</p><p class="description">${e(ch.description)}</p></div><figure class="${plateClass(ch.art)}">${img(ch.art, ch.art === 'field-plate' ? 'ホエリ、ヤブミミ、ミズワタリの図譜' : ch.title, true)}</figure></section>`

add(
  '',
  'もぐ日和 世界の案内帖',
  '',
  `<div class="wrap"><section class="hero"><div class="hero-copy"><p class="eyebrow">ナロ諸島をめぐる、小さな旅の本</p><h1>ごはんの向こうに、<br>世界がある。</h1><p class="intro">潮の匂い。かまどの湯気。<br>器のそばで、こちらを見上げる小さな顔。<br>人ともぐが暮らす六つの島を、<br>ひとつずつ、めくってみませんか。</p>${link('welcome', '最初のページをひらく', 'button')}</div><figure class="hero-visual">${img('village', 'カヤ村の入り江を望むかまどで、ミナとガロ、小さなもぐが食事を囲む', true)}<div class="stamp" aria-hidden="true"><small>六つの島と</small>日々の記憶<small>ナロ諸島</small></div></figure></section><div class="hero-caption"><span>もぐ日和 世界の案内帖</span><span>カヤ村、下のかまどから。</span></div></div><section class="wrap section">${sectionHeading('好きなページから、どうぞ。', 'この本で出会うもの', 'contents', '総目次を見る')}<div class="chapter-grid">${chapters.map(chapterCard).join('')}</div></section><section class="feature-band"><div class="wrap feature-split"><figure>${img('atlas', '六つの島を帆船でつなぐナロ諸島の絵地図')}</figure><div><p class="eyebrow">まずは、地図をひろげよう。</p><h2>見えるほど近くて、<br>ひと舟ぶん、遠い。</h2><p>麦と豆を育てるアシロ。深い森のトヌ。<br>塩を焚くセラ、荷が行き交うニカ。<br>霧のウネと、夜に目覚めるヨルバ。<br>島の食卓は、海の向こうとつながっています。</p>${link('islands', '六つの島をめぐる')}</div></div></section><section class="wrap section">${sectionHeading('小さな顔、大きな暮らし。', 'もぐ、という隣人。', 'mogs', '図鑑をひらく')}<div class="specimen-grid">${species.slice(0, 3).map(creatureCard).join('')}</div></section><section class="wrap section">${sectionHeading('ひと息ついたら、一篇。', '島から届いたものがたり', 'stories', '八篇の物語へ')}<div class="story-grid">${stories.slice(0, 3).map(storyCard).join('')}</div></section>`,
  '六つの島と、そこに暮らす人ともぐ。絵地図、生態図鑑、島の食卓と八篇の物語をめぐる、もぐ日和の世界の案内帖。',
)

add(
  'welcome',
  'はじめに',
  'welcome',
  `${chapterHero(chapter('welcome'))}<section class="wrap section"><div class="book-opening"><p class="eyebrow">この本をひらいた、あなたへ。</p>${p(openingLetter)}<p class="signature">ナロ諸島、カヤ村から</p></div><div class="feature-split"><figure>${img('village', 'ミナのかまどと、浜へ続く坂道')}</figure><div><h2>物語は、<br>一食ぶんの距離から。</h2><p>十歳のミナが用意するのは、幼いもぐの一食です。器を作る母サヨ、舟を直す父オル、火のそばのトキ、庇で休むガロ。誰かの一日は、ほかの誰かの一日と重なっています。</p>${link('people/mina', 'ミナに会いにいく')}</div></div></section><section class="wrap section">${sectionHeading('この世界の、小さな約束', 'となりで生きるということ')}<div class="island-grid"><div class="island-card"><p class="eyebrow">人の言葉、その外で</p><h3>しぐさで話す。</h3><p>もぐは人のような会話をしません。耳の向き、鼻先、置かれた石。よく知る相手には分かることも、初めての人には分からない。だから、少し待ってみます。</p></div><div class="island-card"><p class="eyebrow">同じ鍋、違う器</p><h3>口に合わせる。</h3><p>柔らかさ、大きさ、水分、温度。同じ鍋から分けたものを、食べる相手に合わせます。料理を覚えることは、相手の食べ方を覚えることでもあります。</p></div><div class="island-card"><p class="eyebrow">庭の、もっと向こう</p><h3>それぞれに暮らす。</h3><p>人の料理を食べず、野で大きくなるもぐもたくさんいます。村へ来る日も、来ない日もある。食事と手助けのあいだに、その都度の勘定はありません。</p></div></div>${related(
    [
      { path: 'islands', title: '地図から世界を見渡す' },
      { path: 'stories/where-the-blue-shard-went', title: '最初の物語「青い欠片の行き先」を読む' },
    ],
  )}</section>`,
  'カヤ村から届いた巻頭の手紙。ナロ諸島の世界と、人ともぐがとなりで暮らすための、小さな約束。',
)

add(
  'islands',
  '島をめぐる',
  'islands',
  `${chapterHero(chapter('islands'))}<section class="wrap section">${map()}</section><section class="wrap section">${sectionHeading('同じ海、六つの表情。', '次の舟は、どの島へ。')}<div class="island-grid">${islands.map((island) => `<article class="island-card tone-blue"><p class="eyebrow">${e(island.area)}</p><h3>${e(island.name)}</h3><p class="serif">${e(island.tagline)}</p><p>${e(island.description)}</p>${link(`islands/${island.id}`, 'この島を歩く')}</article>`).join('')}</div></section><section class="feature-band"><div class="wrap"><p class="eyebrow">旅のしおり</p><h2>急ぐ荷物より、風が先。</h2><div class="chapter-intro">近い港へ半日、遠い浜なら一日。風向きが変われば、帰りは数日先になることもあります。</div><p>帆と櫂の舟が島々を結びます。晴れた日のアシロの尾根からは五つの島が見えても、一日で全部を巡ることはできません。水筒と包んだ食事、そして帰りを待つ人へのひと言を。</p>${link('stories/the-seventh-bowl', '風待ちの船宿の物語を読む')}</div></section>`,
  'アシロ、トヌ、セラ、ニカ、ウネ、ヨルバ。絵地図から六島の風土、交易、もぐの暮らしへ。',
)

for (const island of islands) {
  const detour = discoveries.find((item) => islandByName(item.location)?.id === island.id)
  const story = stories.find((item) => islandFromStory(item).id === island.id)
  const food = foodStories[islandIds.indexOf(island.id)]
  add(
    `islands/${island.id}`,
    island.name,
    'islands',
    article(
      `<p class="eyebrow">島の地誌 · ${e(island.area)}</p><h1>${e(island.name)}</h1><p class="lead">${e(island.tagline)}</p><figure class="article-figure">${img(sceneFor(island.name), `${island.name}の景色`, true)}</figure><div class="prose">${p([island.description, ...island.details])}</div><div class="notebook"><h2>舟旅の覚え書き</h2><p>${e(island.note)}</p></div>${related(
        [
          { path: `village/${detour.slug}`, title: `この島の寄り道「${detour.title}」` },
          { path: `mogs/field-${island.id}`, title: `${island.name}のもぐを探す` },
          { path: `table/${island.id}`, title: food.title },
          { path: `stories/${story.slug}`, title: `この島の物語「${story.title}」` },
        ],
      )}${turns(islands, island.id, 'islands')}`,
      'islands',
      `islands/${island.id}`,
    ),
    island.description,
  )
}

add(
  'village',
  '暮らしの寄り道',
  'village',
  `${chapterHero(chapter('village'))}<section class="wrap section"><div class="feature-split"><div><p class="eyebrow">カヤ村の、いつもの道</p><h2>かまどの先の、<br>小さな発見。</h2><p>${e(kaya.description)}</p><p>${e(kaya.details[2])}</p></div><figure>${img('village', 'かまど、家々、網干し場から浜へ続くカヤ村')}</figure></div><div class="walking-note"><p><strong>坂道の歩き方</strong><br>ミナの家から下のかまどへ、二分。かまどから浜へ、三分。水場へは登り道を四分。道の真ん中は、荷を運ぶ人ともぐのために空けておきます。</p></div><div class="prose">${p([kaya.details[0], kaya.details[1], kaya.details[3]])}</div></section><section class="wrap section">${sectionHeading('村を歩いて、舟に乗って。', '六つの島の、気になる寄り道')}<div class="story-grid">${discoveries.map(detourCard).join('')}</div></section><section class="wrap section">${sectionHeading('光と影で、場所が変わる。', '下のかまどの一日')}<div class="timeline">${dayMoments.map((item) => `<article class="moment"><time>${e(item.time)}</time><h3>${e(item.title)}</h3><p>${e(item.description)}</p></article>`).join('')}</div></section>`,
  'カヤ村のかまどから浜へ、そして舟で六つの島へ。地図壁、折り目屋、つぎあて窓など、暮らしの寄り道。',
)

for (const item of discoveries) {
  const island = islandByName(item.location)
  const story =
    stories.find((story) => (story.location + story.paragraphs.join('')).includes(item.title)) ||
    stories.find((story) => islandFromStory(story).id === island.id)
  add(
    `village/${item.slug}`,
    item.title,
    'village',
    article(
      `<p class="eyebrow">${e(item.category)} · ${e(item.location)}</p><h1>${e(item.title)}</h1><p class="lead">${e(item.summary)}</p><figure class="article-figure">${img(sceneFor(item.location), item.location, true)}</figure><div class="prose">${p(item.paragraphs)}</div>${related(
        [
          { path: `islands/${island.id}`, title: `${island.name}をもっと歩く` },
          { path: `stories/${story.slug}`, title: `この島の物語「${story.title}」` },
        ],
      )}${turns(discoveries, item.slug, 'village')}`,
      'village',
      `village/${item.slug}`,
    ),
    item.summary,
  )
}

add(
  'mogs',
  'もぐを知る',
  'mogs',
  `${chapterHero(chapter('mogs'))}<section class="wrap section"><div class="chapter-intro">「もぐ」は、一つの種の名前ではありません。<br>姿を変えて育ち、道具やしぐさを覚えて暮らす、生き物たちの呼び名です。</div>${sectionHeading('まず出会う、六つの種。', '近くで見たい、あの子のこと。')}<div class="specimen-grid">${species.map(creatureCard).join('')}</div><div class="notebook"><h3>「こむぎ」と「ホエリ」は、どう違う？</h3><p>こむぎは身近な個体についた名前、ホエリはその種の名前です。同じホエリでも、ミナのそばのこむぎと、大きな成体のガロでは姿も習慣も違います。</p></div></section><section class="wrap section">${sectionHeading('野原にも、潮だまりにも。', '島ごとの、もぐの生態短録')}<div class="island-grid">${islands
    .map((island) => {
      const list = islandSpecies.filter(
        (s) => s.island.split('・')[0] === island.name.replace('島', ''),
      )
      return `<a class="island-card" href="/mogs/field-${island.id}/"><div class="specimen-line">${list
        .slice(0, 3)
        .map(
          (s) =>
            `<img src="/art/characters/c-${s.id}-4.svg" alt="${e(s.name)}" width="300" height="300" loading="lazy">`,
        )
        .join(
          '',
        )}</div><p class="eyebrow">六つの種を観察する</p><h3>${e(island.name)}のもぐ <span class="arrow" aria-hidden="true">↗</span></h3><p>${e(list.map((s) => s.name).join('、'))}</p></a>`
    })
    .join('')}</div></section>`,
  'カヤ村で出会う六種と、島々の36種。42種のもぐの体、食べ物、習慣、成長の姿を知る。',
)

for (const s of species) {
  add(
    `mogs/${s.id}`,
    s.name,
    'mogs',
    article(
      `<p class="eyebrow">もぐの生態誌 · 身近な呼び名「${e(names[s.id])}」</p><h1>${e(s.name)}</h1><p class="lead">${e(s.catchphrase)}</p><figure class="article-figure specimen">${specimen(s.id, 4, true)}<figcaption class="image-note">とっておきの姿</figcaption></figure><div class="prose">${p([s.description, s.appearance])}</div><dl class="species-detail"><div><dt>すみか</dt><dd>${e(s.habitat)}</dd></div><div><dt>食べるもの</dt><dd>${e(s.food)}</dd></div></dl><div class="notebook"><h2>そっと見ていたい、しぐさ</h2><p>${e(s.habit)}</p></div><h2>育つと、姿が変わる。</h2><div class="growth-strip">${['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき'].map((stage, index) => `<figure>${specimen(s.id, index)}<figcaption>${stage}</figcaption></figure>`).join('')}</div><p class="muted">「とっておき」は老いた姿ではなく、その種らしい体が十分に整った姿。変化の時期は種や個体、生まれた季節でも違います。</p>${related(
        [
          { path: 'table/kuchiawase', title: '食べ方に合わせて、器と一皿を変える' },
          {
            path: s.id === 'hoeri' ? 'people/garo' : 'stories/three-stones-in-winter',
            title:
              s.id === 'hoeri'
                ? '村の大きなホエリ、ガロ'
                : 'しぐさを読む物語「三つ、四つ、冬の石」',
          },
        ],
      )}${turns(species, s.id, 'mogs')}`,
      'mogs',
      `mogs/${s.id}`,
    ),
    s.description,
  )
}

for (const island of islands) {
  const list = islandSpecies.filter(
    (s) => s.island.split('・')[0] === island.name.replace('島', ''),
  )
  add(
    `mogs/field-${island.id}`,
    `${island.name}のもぐ`,
    'mogs',
    `<section class="wrap section"><p class="eyebrow">島々の生態短録</p><h1>${e(island.name)}のもぐ</h1><div class="chapter-intro">${e(island.tagline)}<br>その土地で食べ、道具を使い、次の季節を迎える六つの種。</div><div class="field-grid">${list.map((s) => `<article class="field-card" id="${s.id}"><img src="/art/characters/c-${s.id}-4.svg" alt="${e(s.name)}のとっておきの姿" width="300" height="300" loading="lazy"><div><h3>${e(s.name)}</h3><p>${e(s.description)}</p></div></article>`).join('')}</div>${related(
      [
        { path: `islands/${island.id}`, title: `${island.name}の風土と暮らし` },
        { path: 'mogs', title: 'ほかの島のもぐにも会う' },
      ],
    )}<nav class="page-turn" aria-label="ほかの島の生態短録"><a href="/mogs/field-${islandIds[(islandIds.indexOf(island.id) + 5) % 6]}/"><small>← 前の島の生態短録</small>${e(islands[(islandIds.indexOf(island.id) + 5) % 6].name)}</a><a href="/mogs/field-${islandIds[(islandIds.indexOf(island.id) + 1) % 6]}/"><small>次の島の生態短録 →</small>${e(islands[(islandIds.indexOf(island.id) + 1) % 6].name)}</a></nav></section>`,
    `${island.name}の六種のもぐの、食べ物としぐさを図版とともに観察する。`,
  )
}

const foods = foodStories.slice(0, 6).map((food, index) => ({ ...food, id: islandIds[index] }))
add(
  'table',
  '食卓と暮らし',
  'table',
  `${chapterHero(chapter('table'))}<section class="wrap section"><div class="feature-split"><div><p class="eyebrow">ナロの台所に、ようこそ。</p><h2>同じ鍋から、<br>ちがう一皿へ。</h2><p>大切なのは、別のごちそうを用意することより、その子がどう食べるかを見ること。同じ根菜も、崩して、ほぐして、汁を含ませて。ナロでは、これを「口合わせ」と呼びます。</p>${link('table/kuchiawase', '口合わせを知る')}</div><figure>${img('table', '鍋と器を囲んでもぐと食事を分ける、島の食卓')}</figure></div></section><section class="wrap section">${sectionHeading('島を知るには、まず一皿。', '六つの島の、六つの名物')}<div class="food-grid">${foods.map((food, index) => `<article class="food-card"><span class="food-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><p class="eyebrow">${e(islands[index].name)}</p><h3>${e(food.title)}</h3><p>${e(food.description)}</p>${link(`table/${food.id}`, 'この一皿の話を読む')}</div></article>`).join('')}</div></section><section class="wrap section">${sectionHeading('使い込んだ道具と、いつもの仕草。', '食卓に残るもの')}<div class="island-grid">${foodStories
    .slice(7)
    .map(
      (item) =>
        `<article class="island-card"><h3>${e(item.title)}</h3><p>${e(item.description)}</p></article>`,
    )
    .join('')}</div></section>`,
  '口合わせと六つの郷土料理。材料、食べ方、器の記憶からたどる、ナロ諸島の食卓。',
)

for (const food of foods) {
  const notes = foodNotes.find((item) => item.title === food.title)
  add(
    `table/${food.id}`,
    food.title,
    'table',
    article(
      `<p class="eyebrow">島の一皿 · ${e(islands.find((island) => island.id === food.id).name)}</p><h1>${e(food.title)}</h1><p class="lead">${e(notes.scene)}</p><figure class="article-figure">${img('table', '取り分ける器と鍋が並ぶ、ナロの食卓', true)}</figure><div class="prose"><h2>この島の、いつもの味。</h2>${p([food.description])}<h2>鍋に入るもの</h2><ul>${notes.ingredients.map((item) => `<li>${e(item)}</li>`).join('')}</ul><h2>もぐの器へ、取り分ける。</h2>${p([notes.serving])}<h2>一皿のそばの、小さな話。</h2>${p([notes.memory])}</div>${related(
        [
          { path: `islands/${food.id}`, title: 'この料理が生まれた島を歩く' },
          { path: 'table/kuchiawase', title: '口合わせを、もう少し詳しく' },
        ],
      )}${turns(foods, food.id, 'table')}`,
      'table',
      `table/${food.id}`,
    ),
    food.description,
  )
}
add(
  'table/kuchiawase',
  '口合わせ',
  'table',
  article(
    `<p class="eyebrow">ナロの暮らしの知恵</p><h1>ひとつの鍋から、<br>それぞれの一皿へ。</h1><p class="lead">相手の食べ方を知ることが、料理を覚えること。</p><figure class="article-figure">${img('table', '低い器と鍋が並んだ共同の食卓', true)}</figure><div class="prose"><p>「口合わせ」は、食べる相手に合わせて仕上げを変える仕事。同じ鍋から分けたものでも、大きさ、硬さ、水分、温度を変えれば、別の食べやすさになります。</p></div><div class="process"><div><b>見る</b><p>どちらから近づくか。口は器のどこに触れるか。</p></div><div><b>分ける</b><p>人の塩や薬味を加える前に、鍋から取り分ける。</p></div><div><b>合わせる</b><p>崩す、ほぐす、汁を足す。器の深さも見直す。</p></div><div><b>待つ</b><p>食べ始めるのを待ち、空いた器の跡を見る。</p></div></div><div class="prose"><h2>同じ種でも、同じ食べ方とは限らない。</h2><p>乾いたものから食べる個体も、汁へ口を寄せる個体もいます。初めて来たもぐには、少量ずつ離した二つの皿。両方を通り過ぎて、草むらへ戻ることもあります。選ばれなかった皿を追いかけて差し出す人はいません。</p><h2>空っぽになってからも、器は教えてくれる。</h2><p>トキは最初に、食べ終わった器を並べます。角だけ残った根菜、こぼれた汁、縁についた跡。「嫌い」と決める前に、翌日は別の硬さで一口分だけ作ります。</p><h2>体が変わったら、食卓も変わる。</h2><p>皿の縁に顔がぶつかるようになった。今まで運べなかった塊を運び始めた。そんなときは、器や寝床を見直します。以前の小さな皿は捨てずに、棚へ戻しておきます。</p></div>${related(
      [
        { path: 'people/toki', title: '口合わせを教えるトキ' },
        { path: 'people/sayo', title: '食べ方に合わせた器をつくるサヨ' },
        { path: 'stories/the-spoon-left-uncut', title: '物語「削らなかった匙」' },
      ],
    )}`,
    'table',
    'table/kuchiawase',
  ),
  '相手の大きさ、硬さ、水分、温度、器に合わせて食事を仕上げるナロの習慣「口合わせ」。',
)

add(
  'people',
  '村の人々',
  'people',
  `${chapterHero(chapter('people'))}<section class="wrap section"><div class="chapter-intro">ひとりで全部を、引き受けない。<br>誰かの手が届かないところに、別の誰かの手がある。</div><div class="people-grid">${people.map((person) => `<article class="person-card"><span class="person-seal" aria-hidden="true">${e(person.name)}</span><div><p class="eyebrow">${e(person.role)}</p><h3>${e(person.name)}</h3><p>${e(person.description)}</p>${link(`people/${person.id}`, 'この人の日々を知る')}</div></article>`).join('')}</div></section><section class="wrap section"><div class="feature-split"><figure>${img('village', 'かまどで料理をするミナと、そばで休むガロ')}</figure><div><p class="eyebrow">守られていた子が、食事を分ける子に。</p><h2>同じ庇の下で、<br>少しずつ変わる。</h2><p>小さなミナは、ガロの腹に背を預けて母を待ちました。いまガロは、幼体をミナの器のそばへ連れてきます。ミナが食べ終わるまで見ていると分かってからは、途中で浜へ下りることもあります。</p>${link('people/garo', 'ガロのことを知る')}</div></div></section>`,
  'ミナ、ガロ、サヨ、オル、トキ。かまどと浜を行き来する、カヤ村の五つの暮らし。',
)
for (const person of people) {
  const notes = peopleNotes[person.id]
  add(
    `people/${person.id}`,
    person.name,
    'people',
    article(
      `<p class="eyebrow">${e(person.role)}</p><h1>${e(person.name)}</h1><p class="lead">${e(person.description)}</p><figure class="article-figure ${person.id === 'garo' ? 'specimen' : ''}">${person.id === 'garo' ? specimen('hoeri', 4, true) : img('village', 'カヤ村の、家からかまどへ、浜へと続く暮らし', true)}</figure><div class="prose">${p(notes.paragraphs)}</div>${person.quote ? `<blockquote class="large-quote">「${e(person.quote)}」</blockquote>` : ''}<div class="notebook"><h2>この人らしい、ひとこま。</h2><p>${e(notes.favorites)}</p></div>${related(
        [
          { path: 'village', title: 'この人の暮らすカヤ村を歩く' },
          { path: 'stories/where-the-blue-shard-went', title: '物語「青い欠片の行き先」' },
        ],
      )}${turns(people, person.id, 'people')}`,
      'people',
      `people/${person.id}`,
    ),
    person.description,
  )
}

add(
  'stories',
  '島のものがたり',
  'stories',
  `${chapterHero(chapter('stories'))}<section class="wrap section"><div class="chapter-intro">なくしたものを探す日も、舟を待つ日も。<br>小さな一日の続きを、ひとつずつ。</div><div class="filter-bar" aria-label="物語の種類">${['all', '食卓と日々', '旅と手仕事', '夜の物語'].map((group) => `<button type="button" data-filter="${group}" aria-pressed="${group === 'all'}">${group === 'all' ? 'すべての物語' : group}</button>`).join('')}<span class="filter-status" data-filter-status role="status" aria-live="polite">8篇のものがたり</span></div><div class="story-grid">${stories.map(storyCard).join('')}</div></section>`,
  '青い欠片の行き先、風待ちの七つめの椀、草の背丈の地図。六つの島を舞台にした八篇の短編。',
)
for (const story of stories) {
  const island = islandFromStory(story)
  const detour = discoveries.find((item) => islandByName(item.location)?.id === island.id)
  add(
    `stories/${story.slug}`,
    story.title,
    'stories',
    `<div class="reading-progress" data-reading-progress aria-hidden="true"></div><div class="wrap"><figure class="reading-hero ${night(story) ? 'night' : ''}">${img(storyArt(story), story.location, true)}</figure><article class="reading"><p class="eyebrow">${e(story.category)}</p><h1>${e(story.title)}</h1><p class="serif">${e(story.summary)}</p><div class="meta">舞台：${e(story.location)}<br>登場：${e(story.cast.join('、'))} · 約${Math.max(3, Math.ceil(story.paragraphs.join('').length / 350))}分</div><div class="prose">${p(story.paragraphs)}</div><div class="story-end" aria-label="おしまい">おしまい</div>${related(
      [
        { path: `islands/${island.id}`, title: `物語の舞台、${island.name}へ` },
        { path: `village/${detour.slug}`, title: `寄り道のしおり「${detour.title}」` },
        { path: 'stories', title: 'ものがたりの一覧に戻る' },
      ],
    )}${turns(stories, story.slug, 'stories')}</article></div>`,
    story.summary,
  )
}

add(
  'glossary',
  'ことばのしおり',
  'glossary',
  `${chapterHero(chapter('glossary'))}<section class="wrap section"><dl class="glossary-grid">${[
    ...glossary,
    ...moreGlossary,
  ]
    .sort((a, b) => (a.reading || a.term).localeCompare(b.reading || b.term, 'ja'))
    .map(
      (item) =>
        `<div class="glossary-entry"><dt>${item.reading ? `<ruby>${e(item.term)}<rt>${e(item.reading)}</rt></ruby>` : e(item.term)}</dt><dd>${e(item.description)}</dd></div>`,
    )
    .join('')}</dl></section>`,
  'ナロ、カヤ、口合わせ、とっておき。世界を少し身近にする、24の名前とことば。',
)

add(
  'contents',
  '総目次',
  '',
  `<section class="wrap section"><p class="eyebrow">世界の案内帖 · 全編の目次</p><h1>今日は、どのページへ。</h1><div class="chapter-intro">順番に読んでも、気になる名前から始めても。<br>どの道も、同じ六つの島へつながっています。</div><div class="contents-list">${chapters
    .map(
      (ch) =>
        `<section class="contents-chapter"><h2><a href="/${ch.slug}/"><span>${ch.number}</span>${e(ch.title)} ↗</a></h2><ul><li><a href="/${ch.slug}/">${e(ch.subtitle)}<span aria-hidden="true">→</span></a></li>${pages
          .filter((page) => page.chapter === ch.slug && page.path !== ch.slug)
          .map(
            (page) =>
              `<li><a href="${href(page.path)}">${e(page.title)}<span aria-hidden="true">→</span></a></li>`,
          )
          .join('')}</ul></section>`,
    )
    .join('')}</div></section>`,
  '島の案内、もぐ図鑑、食卓、村の人々、八篇の物語。この案内帖のすべてのページへ。',
)

export function renderPage(page) {
  const current = chapter(page.chapter)
  const body = page.body.replace(/<!--ASIDE:([^:]+):([^>]+)-->/g, (_, ch, path) => aside(ch, path))
  const breadcrumbs = page.path
    ? `<nav class="wrap breadcrumbs" aria-label="パンくず"><a href="/">表紙</a><span aria-hidden="true">/</span>${current && page.path !== page.chapter ? `<a href="/${current.slug}/">${e(current.title)}</a><span aria-hidden="true">/</span>` : ''}<span aria-current="page">${e(page.title)}</span></nav>`
    : ''
  return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(page.title)}${page.path ? '｜もぐ日和 世界の案内帖' : ''}</title><meta name="description" content="${e(page.description)}"><meta name="theme-color" content="#faf6ec"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><script type="module" src="/client.mjs"></script></head><body><a href="#main" class="skip">本文へ</a><div class="topline"></div><header class="masthead"><div class="wrap masthead-inner"><a class="brand" href="/" aria-label="もぐ日和 世界の案内帖 表紙"><img src="/favicon.svg" alt="" width="40" height="40"><span class="brand-title">もぐ日和<span class="brand-subtitle">世界の案内帖</span></span></a><nav class="desktop-nav" aria-label="主な章">${['islands', 'village', 'mogs', 'table', 'stories'].map((slug) => `<a href="/${slug}/"${page.chapter === slug ? ' aria-current="page"' : ''}>${e(chapter(slug).title)}</a>`).join('')}</nav><button class="contents-button" type="button" data-open-contents aria-haspopup="dialog" aria-controls="contents-dialog"><span class="book-symbol" aria-hidden="true">☷</span>目次をひらく</button></div></header>${breadcrumbs}<main id="main">${body}</main><footer class="footer"><div class="wrap"><div class="footer-top"><div><a href="/" class="brand-title">もぐ日和 世界の案内帖</a><p>潮の匂いと、かまどの湯気。<br>また、気になるページで会いましょう。</p></div><nav class="footer-links" aria-label="巻末の案内">${chapters.map((ch) => `<a href="/${ch.slug}/">${e(ch.title)}</a>`).join('')}<a href="/contents/">総目次</a></nav></div><div class="footer-bottom"><span>もぐ日和 · ナロ諸島の風土、隣人、日々のものがたり</span><span>ひとつの食卓から、六つの島へ。</span></div></div></footer><dialog id="contents-dialog" class="contents-dialog" aria-labelledby="contents-title"><div class="dialog-heading"><h2 id="contents-title">案内帖の目次</h2><button type="button" data-close-contents aria-label="目次を閉じる">閉じる ×</button></div><nav class="dialog-chapters" aria-label="章を選ぶ">${chapters.map((ch) => `<a href="/${ch.slug}/"><span>${ch.number}</span>${e(ch.title)}</a>`).join('')}</nav><div class="dialog-footer">${link('contents', 'すべてのページを見る')}</div></dialog></body></html>`
}
