import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChefHat,
  ChevronRight,
  Clock3,
  Flame as FlameIcon,
  Heart,
  Leaf,
  LockKeyhole,
  Plus,
  RefreshCw,
  Snowflake,
  Sparkles,
  Sprout,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { FoodArt, Flame } from './Illustrations'
import { RecipeCard } from './components'
import {
  addDays,
  categories,
  cookedToday,
  dayLabel,
  pantryOptions,
  recipes,
  recommend,
  recommendationReason,
  streak,
  weekDays,
  weeklyCount,
} from './domain'
import type { AppState, Category, Meal, Recipe } from './domain'
import type { Dispatch, SetStateAction } from 'react'

export type Page = 'today' | 'recipes' | 'album' | 'community'
export type PageProps = {
  state: AppState
  setState: Dispatch<SetStateAction<AppState>>
  onRecipe: (recipe: Recipe) => void
  onRecord: (recipe?: Recipe) => void
  onRest: () => void
  onPage: (page: Page) => void
  onMeal: (meal: Meal) => void
}

export function Pantry({ state, setState }: Pick<PageProps, 'state' | 'setState'>) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="pantry-control">
      <div className="pantry-line">
        <span className="pantry-label">
          <Leaf size={16} /> 冷蔵庫にあるもの
        </span>
        <div className="pantry-selected">
          {state.pantry.slice(0, 4).map((p) => (
            <span key={p}>{p}</span>
          ))}
          {state.pantry.length > 4 && <span>+{state.pantry.length - 4}</span>}
          {!state.pantry.length && <span>まだ登録なし</span>}
        </div>
        <button
          className="text-button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <X size={16} /> : <Plus size={16} />}
          <span>{expanded ? '閉じる' : '編集'}</span>
        </button>
      </div>
      {expanded && (
        <div className="pantry-editor">
          <p>あるものを選ぶと、献立のおすすめが変わります。調味料は含みません。</p>
          <div className="chip-list">
            {pantryOptions.map((item) => (
              <button
                key={item}
                aria-pressed={state.pantry.includes(item)}
                className={`chip ${state.pantry.includes(item) ? 'active' : ''}`}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    pantry: s.pantry.includes(item)
                      ? s.pantry.filter((p) => p !== item)
                      : [...s.pantry, item],
                  }))
                }
              >
                {state.pantry.includes(item) && <Check size={13} />}
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Effort({ state, setState }: Pick<PageProps, 'state' | 'setState'>) {
  return (
    <div className="effort-control">
      <div>
        <span className="eyebrow">MAKE IT YOUR PACE</span>
        <h3>今日は、どのくらい作れそう？</h3>
      </div>
      <div className="effort-options" role="group" aria-label="調理に使える時間">
        {[
          { minutes: 5, title: 'さくっと', icon: <Sprout size={17} /> },
          { minutes: 15, title: 'ほどよく', icon: <Utensils size={17} /> },
          { minutes: 30, title: 'じっくり', icon: <ChefHat size={17} /> },
        ].map((o) => (
          <button
            key={o.minutes}
            className={state.minutes === o.minutes ? 'active' : ''}
            aria-pressed={state.minutes === o.minutes}
            onClick={() => setState((s) => ({ ...s, minutes: o.minutes }))}
          >
            {o.icon}
            <span>
              {o.title}
              <small>{o.minutes}分以内</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Today(props: PageProps) {
  const { state, onRecipe, onRecord, onRest, onPage } = props
  const [offset, setOffset] = useState(0)
  const list = recommend(state, offset)
  const pick = list[0]
  const done = cookedToday(state)
  const resting = state.rests.includes(state.today)
  const weekly = state.settings.habit === 'weekly'
  const count = weekly ? weeklyCount(state) : streak(state)
  const xp = state.meals.reduce((sum, m) => sum + m.xp, 0)
  const totalCategories = new Set(state.meals.map((m) => m.category)).size
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE COOKING, A LITTLE JOY.</span>
          <h1>
            今日の、ひとさじ<span className="orange">。</span>
          </h1>
          <p>上手じゃなくていい。自分のために、ひとつ作ろう。</p>
        </div>
        <span className="date-label">{dayLabel(state.today, true)}</span>
      </div>
      <div className="today-grid">
        <div className="today-main">
          {done && (
            <div className="complete-banner">
              <span className="check-circle">
                <Check size={18} />
              </span>
              <span>
                <strong>今日も「つくれた」を灯しました。</strong>
                <small>もう一品の記録も、もちろんどうぞ。</small>
              </span>
              <button className="text-button" onClick={() => onPage('album')}>
                記録を見る <ArrowRight size={16} />
              </button>
            </div>
          )}
          <section className="hero-card">
            <div className="hero-copy">
              <span className="soft-badge">
                <Sparkles size={13} /> 今日のおすすめ
              </span>
              <h2>
                迷ったら、
                <br />
                今日はこれにしよう。
              </h2>
              <p className="hero-recipe-name">{pick.name}</p>
              <p className="hero-subtitle">{pick.subtitle}</p>
              <div className="hero-meta">
                <span>
                  <Clock3 size={15} />
                  {pick.minutes}分
                </span>
                <span>
                  <Utensils size={15} />
                  1人分
                </span>
                <span>かんたん</span>
              </div>
              <button className="button primary" onClick={() => onRecipe(pick)}>
                これを作ってみる <ArrowRight size={17} />
              </button>
              <button className="hero-swap" onClick={() => setOffset((o) => o + 1)}>
                <RefreshCw size={13} /> ほかの一品にする
              </button>
            </div>
            <div className="hero-art">
              <span className="handwritten">ひと皿から、はじめよう。</span>
              <FoodArt recipe={pick} />
              <span className="food-sticker">
                <Leaf size={15} /> 気負わず、おいしく。
              </span>
            </div>
            <div className="hero-footer">
              <Sparkles size={15} />
              <span>{recommendationReason(pick, state)}</span>
              <span className="tiny-label">あなたに合わせて</span>
            </div>
          </section>
          <section className="personalize-panel">
            <Effort {...props} />
            <Pantry {...props} />
          </section>
          <section className="recommendations-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {state.settings.recommendation === 'three'
                    ? 'YOUR NEXT THREE MEALS'
                    : 'A LITTLE MORE INSPIRATION'}
                </span>
                <h2>
                  {state.settings.recommendation === 'three'
                    ? `次の${Math.min(3, list.length)}食も、ゆるっと決めておく。`
                    : 'こんな一品も、どう？'}
                </h2>
              </div>
              <button className="text-button" onClick={() => onPage('recipes')}>
                献立ノート <ArrowUpRight size={17} />
              </button>
            </div>
            <div
              className={`recipe-grid ${state.settings.recommendation === 'three' ? 'three' : ''}`}
            >
              {(state.settings.recommendation === 'three'
                ? list.slice(0, 3)
                : list.slice(1, 3)
              ).map((recipe, i) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  state={state}
                  label={
                    state.settings.recommendation === 'three'
                      ? ['今日', '次に作る日', 'その次の日'][i]
                      : undefined
                  }
                  onSelect={() => onRecipe(recipe)}
                />
              ))}
            </div>
            {state.settings.recommendation === 'three' && (
              <p className="helper">予定が変わっても大丈夫。作れる日に、好きな順番で。</p>
            )}
          </section>
        </div>
        <aside className="today-aside">
          <section className="streak-card">
            <div className="card-topline">
              <span className="eyebrow">MY LITTLE FLAME</span>
              <FlameIcon size={17} />
            </div>
            <div className="streak-visual">
              <Flame />
              <div className="streak-number">
                {count}
                <span>{weekly ? '/ 3日' : '日'}</span>
              </div>
            </div>
            <h3>
              {weekly
                ? count >= 3
                  ? '今週の目標、達成！'
                  : '今週、作れた日。'
                : count > 0
                  ? 'ちいさな火が、つづいてる。'
                  : '今日から、火を灯そう。'}
            </h3>
            <p>
              {weekly
                ? '毎日じゃなくても、自分のペースで。'
                : done
                  ? '今日のひとさじも、ちゃんと積み重なった。'
                  : resting
                    ? '今日はおやすみ。火は消さずに、また明日。'
                    : '今日のひとさじで、もう一日。'}
            </p>
            <div className="week-strip">
              {weekDays(state.today).map((day, i) => {
                const checked = state.meals.some((m) => m.day === day),
                  rest = state.rests.includes(day)
                return (
                  <div key={day} className={`week-day ${day === state.today ? 'is-today' : ''}`}>
                    <span>{['月', '火', '水', '木', '金', '土', '日'][i]}</span>
                    <div className={checked ? 'cooked' : rest ? 'rested' : ''}>
                      {checked ? (
                        <Check size={15} strokeWidth={3} />
                      ) : rest ? (
                        <Snowflake size={14} />
                      ) : day === state.today ? (
                        <span className="today-dot" />
                      ) : (
                        '·'
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="xp-progress">
              <div>
                <span>
                  <Sparkles size={13} /> 小さな積み重ね
                </span>
                <strong>{xp} XP</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${(xp % 200) / 2}%` }} />
              </div>
              <small>次の節目まで {200 - (xp % 200)} XP</small>
            </div>
          </section>
          <button className={`record-invite ${done ? 'is-done' : ''}`} onClick={() => onRecord()}>
            <span className="record-icon">
              <Camera size={22} />
            </span>
            <span>
              <strong>{done ? 'もう一皿、残しておく？' : 'もう作った？'}</strong>
              <small>写真で、今日の一皿を記録</small>
            </span>
            <ChevronRight size={19} />
          </button>
          {weekly ? (
            <div className="rest-card">
              <span className="round-icon">
                <Sprout size={20} />
              </span>
              <div>
                <h3>週3回から、少しずつ。</h3>
                <p>おやすみの日も含めて、あなたのペースです。</p>
              </div>
            </div>
          ) : (
            <button
              className="rest-card"
              aria-label={`おやすみチケット 残り${state.freezes}枚`}
              onClick={onRest}
              disabled={done || resting || state.freezes === 0}
            >
              <span className="round-icon">
                <Snowflake size={20} />
              </span>
              <div>
                <h3>{resting ? '今日はおやすみ中' : '作れない日があっても。'}</h3>
                <p>
                  {done
                    ? '今日は記録できました'
                    : resting
                      ? '継続の火は守られています'
                      : `おやすみチケット 残り${state.freezes}枚`}
                </p>
              </div>
              {!done && !resting && <ChevronRight size={16} />}
            </button>
          )}
          <section className="growth-card">
            <span className="eyebrow">SMALL STEPS, REAL GROWTH</span>
            <h3>
              「つくれる」が、
              <br />
              すこしずつ増えている。
            </h3>
            <div className="growth-icons">
              <span className={totalCategories >= 1 ? 'earned' : ''}>
                <Sprout size={21} />
              </span>
              <i />
              <span className={totalCategories >= 3 ? 'earned' : ''}>
                <Utensils size={21} />
              </span>
              <i />
              <span className={totalCategories >= 5 ? 'earned' : ''}>
                <ChefHat size={21} />
              </span>
            </div>
            <p>
              <strong>{totalCategories}</strong> / 5ジャンルに挑戦
            </p>
            <button className="text-button" onClick={() => onPage('album')}>
              自分のあしあとを見る <ArrowRight size={14} />
            </button>
          </section>
          <div className="little-note">
            <span>ひとさじの約束</span>
            <p>
              凝った料理も、レンジの一品も。
              <br />
              自分のために作ったら、
              <br />
              それは立派な自炊です。
            </p>
            <span className="note-doodle">✳</span>
          </div>
        </aside>
      </div>
    </>
  )
}

export function RecipesPage(props: PageProps) {
  const [search, setSearch] = useState('')
  const [onlyOwned, setOnlyOwned] = useState(false)
  const list = recommend(props.state).filter(
    (r) =>
      (!onlyOwned || r.ingredients.every((i) => props.state.pantry.includes(i.name))) &&
      `${r.name}${r.ingredients.map((i) => i.name).join('')}`.includes(search),
  )
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR RECIPE NOTEBOOK</span>
          <h1>
            献立ノート<span className="orange">。</span>
          </h1>
          <p>今日の余裕と、冷蔵庫にあるものから。</p>
        </div>
        <span className="outlined-badge">ひとり分のレシピ {recipes.length}品</span>
      </div>
      <section className="personalize-panel">
        <Effort {...props} />
        <Pantry {...props} />
      </section>
      <div className="filter-row">
        <label className="search-field">
          <Utensils size={17} />
          <input
            aria-label="料理名・食材で検索"
            placeholder="料理名・食材でさがす"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className={`chip ${onlyOwned ? 'active' : ''}`}
          aria-pressed={onlyOwned}
          onClick={() => setOnlyOwned(!onlyOwned)}
        >
          <Leaf size={15} />
          買い足しなし
        </button>
        <span className="helper">{list.length}品</span>
      </div>
      <div className="recipe-grid three">
        {list.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            state={props.state}
            onSelect={() => props.onRecipe(r)}
          />
        ))}
      </div>
      {list.length === 0 && (
        <div className="empty-state">
          <Sprout size={40} />
          <h2>いまの条件では見つかりませんでした。</h2>
          <p>使える時間や食材を変えると、作れる一品が広がります。</p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch('')
              setOnlyOwned(false)
              props.setState((s) => ({ ...s, minutes: 30 }))
            }}
          >
            条件を広げてみる
          </button>
        </div>
      )}
      <p className="helper footnote">
        食材と調理時間をもとに並べています。材料・作り方は1人分の目安です。
      </p>
    </>
  )
}

export function Album(props: PageProps) {
  const [filter, setFilter] = useState<Category | 'すべて'>('すべて')
  const meals = [...props.state.meals]
    .reverse()
    .filter((m) => filter === 'すべて' || m.category === filter)
  const all = props.state.meals
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR COOKING STORY</span>
          <h1>
            自炊アルバム<span className="orange">。</span>
          </h1>
          <p>なんでもない一皿が、あなたの「つくれる」になる。</p>
        </div>
        <button className="button primary" onClick={() => props.onRecord()}>
          <Plus size={17} />
          一皿を記録
        </button>
      </div>
      <div className="album-stats">
        <div>
          <span>これまでの一皿</span>
          <strong>
            {all.length}
            <small>皿</small>
          </strong>
        </div>
        <div>
          <span>つくったジャンル</span>
          <strong>
            {new Set(all.map((m) => m.category)).size}
            <small>種類</small>
          </strong>
        </div>
        <div>
          <span>今週つくれた日</span>
          <strong>
            {weeklyCount(props.state)}
            <small>日</small>
          </strong>
        </div>
      </div>
      <div className="filter-row chip-list" role="group" aria-label="料理ジャンル">
        {(['すべて', ...categories] as const).map((c) => (
          <button
            key={c}
            className={`chip ${filter === c ? 'active' : ''}`}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="album-grid">
        {meals.map((meal) => {
          const recipe = recipes.find((r) => r.id === meal.recipeId) ?? recipes[0]
          return (
            <button className="album-card" key={meal.id} onClick={() => props.onMeal(meal)}>
              <div className="album-image" style={{ background: recipe.color }}>
                {meal.photo ? (
                  <img src={meal.photo} alt={meal.title} />
                ) : (
                  <FoodArt recipe={recipe} />
                )}
                <span className="album-date">{dayLabel(meal.day)}</span>
                <span className="privacy-indicator">
                  {meal.visibility === 'private' ? <LockKeyhole size={13} /> : <Users size={13} />}
                </span>
              </div>
              <div className="album-card-copy">
                <span className="eyebrow">{meal.category}</span>
                <h3>{meal.title}</h3>
                <p>{meal.note || '今日もひとつ、つくれた。'}</p>
                <span className="album-xp">
                  <Sparkles size={12} /> +{meal.xp} XP
                </span>
              </div>
            </button>
          )
        })}
      </div>
      {meals.length === 0 && (
        <div className="empty-state">
          <Camera size={40} />
          <h2>{all.length ? 'このジャンルは、これから。' : '最初の一皿を、ここに。'}</h2>
          <p>写真とひとことから、自分だけの自炊の記録がはじまります。</p>
          <button className="button primary" onClick={() => props.onRecord()}>
            一皿を記録する
          </button>
        </div>
      )}
    </>
  )
}

const friends = [
  {
    id: 'mugi',
    name: 'むぎ',
    avatar: 'む',
    recipeId: 'tofu-soup',
    time: '18:42',
    note: 'バイト終わり。今日はスープが作れただけで満点にした。',
    color: '#E5EAD6',
    days: 4,
    likes: 8,
  },
  {
    id: 'nagi',
    name: 'なぎ',
    avatar: 'な',
    recipeId: 'tomato-pasta',
    time: '19:10',
    note: '初めてワンパンパスタ。洗いものが少ないの、最高。',
    color: '#EEDCCE',
    days: 2,
    likes: 12,
  },
  {
    id: 'anonymous',
    name: 'となりの自炊さん',
    avatar: 'ひ',
    recipeId: 'tuna-udon',
    time: '19:26',
    note: '冷凍うどんに救われた日。こういう日があってもいいよね。',
    color: '#E7E3EF',
    days: 6,
    likes: 5,
  },
]
export function Community(props: PageProps) {
  const { state, setState, onRecord, onRecipe } = props
  const [following, setFollowing] = useState(false)
  const unlocked = cookedToday(state) || state.settings.social === 'open'
  const ownPosts = state.meals.filter((m) => m.day === state.today && m.visibility !== 'private')
  const visibleFriends = friends.filter((f) => !following || state.followed.includes(f.id))
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DIFFERENT TABLES, SAME LITTLE STEPS</span>
          <h1>
            みんなの食卓<span className="orange">。</span>
          </h1>
          <p>どこかで誰かも、今日の一皿を作っている。</p>
        </div>
        <span className="outlined-badge">
          <span className="green-dot" />
          サンプルの仲間 3人
        </span>
      </div>
      {!unlocked ? (
        <section className="feed-locked">
          <div className="locked-illustrations">
            {friends.map((f) => (
              <div key={f.id}>
                <FoodArt recipe={recipes.find((r) => r.id === f.recipeId)!} />
              </div>
            ))}
          </div>
          <div className="locked-message">
            <span className="round-icon">
              <LockKeyhole size={24} />
            </span>
            <h2>
              あなたの一皿で、
              <br />
              みんなの食卓がひらく。
            </h2>
            <p>
              今日の料理を記録したら、のぞいてみよう。
              <br />
              自分だけの記録でも、食卓はひらきます。
            </p>
            <button className="button primary" onClick={() => onRecord()}>
              <Camera size={17} />
              今日の一皿を記録する
            </button>
            <small>上手な料理も、きれいな写真も、必要ありません。</small>
          </div>
        </section>
      ) : (
        <>
          <div className="community-banner">
            <Heart size={20} />
            <span>今日もつくれた、をおすそわけ。</span>
            <small>いいね・フォローはこの端末内のデモです</small>
          </div>
          <div className="filter-row">
            <button
              className={`chip ${!following ? 'active' : ''}`}
              onClick={() => setFollowing(false)}
            >
              みんな
            </button>
            <button
              className={`chip ${following ? 'active' : ''}`}
              onClick={() => setFollowing(true)}
            >
              フォロー中 {state.followed.length}
            </button>
          </div>
          <div className="community-grid">
            {!following &&
              ownPosts.map((meal) => (
                <article className="feed-card" key={meal.id}>
                  <div className="feed-author">
                    <span className="avatar">{meal.visibility === 'anonymous' ? 'ひ' : 'あ'}</span>
                    <div>
                      <strong>
                        {meal.visibility === 'anonymous' ? 'となりの自炊さん（あなた）' : 'あなた'}
                      </strong>
                      <small>
                        今日の一皿 · {meal.visibility === 'anonymous' ? '匿名' : '友達限定'}
                      </small>
                    </div>
                    <span className="soft-badge">あなたの記録</span>
                  </div>
                  <div className="feed-art" style={{ background: '#ece9dc' }}>
                    {meal.photo ? (
                      <img src={meal.photo} alt={meal.title} />
                    ) : (
                      <FoodArt recipe={recipes.find((r) => r.id === meal.recipeId) ?? recipes[0]} />
                    )}
                  </div>
                  <div className="feed-copy">
                    <h3>{meal.title}</h3>
                    <p>{meal.note || '今日も、自分のためにひとさじ。'}</p>
                    <small>この投稿は端末内のプレビューです。</small>
                  </div>
                </article>
              ))}
            {visibleFriends.map((friend) => {
              const recipe = recipes.find((r) => r.id === friend.recipeId)!
              const liked = state.liked.includes(friend.id),
                followed = state.followed.includes(friend.id)
              return (
                <article className="feed-card" key={friend.id}>
                  <div className="feed-author">
                    <span className="avatar" style={{ background: friend.color }}>
                      {friend.avatar}
                    </span>
                    <div>
                      <strong>{friend.name}</strong>
                      <small>
                        <FlameIcon size={11} />
                        {friend.days}日継続 · {friend.time}
                      </small>
                    </div>
                    <button
                      className={`follow-button ${followed ? 'followed' : ''}`}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          followed: followed
                            ? s.followed.filter((id) => id !== friend.id)
                            : [...s.followed, friend.id],
                        }))
                      }
                    >
                      {followed ? 'フォロー中' : 'フォロー'}
                    </button>
                  </div>
                  <div className="feed-art" style={{ background: recipe.color }}>
                    <FoodArt recipe={recipe} />
                  </div>
                  <div className="feed-copy">
                    <h3>{recipe.name}</h3>
                    <p>{friend.note}</p>
                    <div className="feed-actions">
                      <button
                        className={`like-button ${liked ? 'liked' : ''}`}
                        aria-label={`${friend.name}の料理にいいね`}
                        aria-pressed={liked}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            liked: liked
                              ? s.liked.filter((id) => id !== friend.id)
                              : [...s.liked, friend.id],
                          }))
                        }
                      >
                        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                        {friend.likes + (liked ? 1 : 0)}
                      </button>
                      <button className="text-button" onClick={() => onRecipe(recipe)}>
                        わたしも作ってみる <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          {following && !visibleFriends.length && (
            <div className="empty-state">
              <Users size={38} />
              <h2>気になる食卓を、フォローしよう。</h2>
              <button className="button secondary" onClick={() => setFollowing(false)}>
                みんなの食卓を見る
              </button>
            </div>
          )}
        </>
      )}
      <div className="social-note">
        <LockKeyhole size={15} />
        <p>記録の公開範囲は一皿ごとに選べます。「自分だけ」の記録は、食卓に表示されません。</p>
      </div>
    </>
  )
}

export function RecentDates({ state }: { state: AppState }) {
  return (
    <div className="lab-days">
      {Array.from({ length: 7 }, (_, i) => addDays(state.today, i - 6)).map((d) => (
        <span
          key={d}
          className={
            state.meals.some((m) => m.day === d)
              ? 'cooked'
              : state.rests.includes(d)
                ? 'rested'
                : ''
          }
        >
          {d.slice(5)}
          <strong>
            {state.meals.some((m) => m.day === d)
              ? '記録'
              : state.rests.includes(d)
                ? '休み'
                : '未記録'}
          </strong>
        </span>
      ))}
    </div>
  )
}
