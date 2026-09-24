import { useState } from 'react'
import {
  ArrowUpRight,
  Camera,
  Check,
  ChefHat,
  ChevronRight,
  Flame as FlameIcon,
  Heart,
  Leaf,
  LockKeyhole,
  Plus,
  Snowflake,
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
        <h3>使える時間</h3>
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

export function Today({ state, onRecord, onRest, onPage, onMeal }: PageProps) {
  const done = cookedToday(state)
  const resting = state.rests.includes(state.today)
  const weekly = state.settings.habit === 'weekly'
  const count = weekly ? weeklyCount(state) : streak(state)
  return (
    <section className={`daily-ritual ${done ? 'is-complete' : ''}`} aria-label="今日の継続">
      <p className="ritual-date">{dayLabel(state.today, true)}</p>
      <div className="ritual-flame">
        <Flame />
      </div>
      <h1 className="ritual-count">
        <strong>{weekly ? count : count || 1}</strong>
        <span>{weekly ? '/ 3日' : count ? '日連続' : '日目へ'}</span>
      </h1>
      <p className="ritual-message">
        {done
          ? '今日も、つづいた。'
          : resting
            ? '今日は、おやすみ。'
            : weekly
              ? '今週も、自分のペースで。'
              : count
                ? `今日の一皿で、${count + 1}日目。`
                : '最初の一皿から。'}
      </p>
      <div className="ritual-week" role="group" aria-label="今週の記録">
        {weekDays(state.today).map((day, i) => {
          const checked = state.meals.some((m) => m.day === day)
          const rest = state.rests.includes(day)
          return (
            <div
              key={day}
              className={`ritual-day ${day === state.today ? 'is-today' : ''}`}
              role="group"
              aria-label={`${dayLabel(day)} ${checked ? '記録済み' : rest ? 'おやすみ' : '未記録'}`}
            >
              <span>{['月', '火', '水', '木', '金', '土', '日'][i]}</span>
              <div className={checked ? 'cooked' : rest ? 'rested' : ''}>
                {checked ? (
                  <Check size={19} strokeWidth={3} />
                ) : rest ? (
                  <Snowflake size={18} />
                ) : (
                  <span className="day-dot" />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button
        className="button primary ritual-cta"
        onClick={() =>
          done ? onMeal(state.meals.filter((m) => m.day === state.today).at(-1)!) : onRecord()
        }
      >
        {done ? (
          <>
            <Check size={20} />
            今日の記録を見る
          </>
        ) : (
          <>
            <Camera size={21} />
            今日の一皿を残す
          </>
        )}
      </button>
      <div className="ritual-secondary">
        {done ? (
          <span className="resting-label">また明日。</span>
        ) : !weekly && !resting ? (
          <button
            className="text-button"
            aria-label={`おやすみチケット 残り${state.freezes}枚`}
            onClick={onRest}
            disabled={state.freezes === 0}
          >
            <Snowflake size={15} />
            今日はおやすみ<span className="ticket-count">{state.freezes}</span>
          </button>
        ) : resting ? (
          <span className="resting-label">
            <Snowflake size={15} />
            継続はそのまま
          </span>
        ) : null}
      </div>
      {!done && (
        <button className="recipe-help" onClick={() => onPage('recipes')}>
          献立に迷ったら <ChevronRight size={15} />
        </button>
      )}
    </section>
  )
}

export function RecipesPage(props: PageProps) {
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const list = recommend(props.state, offset).filter(
    (r) =>
      (!onlyOwned || r.ingredients.every((i) => props.state.pantry.includes(i.name))) &&
      `${r.name}${r.ingredients.map((i) => i.name).join('')}`.includes(search),
  )
  const suggested = list.slice(0, props.state.settings.recommendation === 'three' ? 3 : 1)
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            献立ノート<span className="orange">。</span>
          </h1>
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
        {(search || onlyOwned ? list : suggested).map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            state={props.state}
            onSelect={() => props.onRecipe(r)}
          />
        ))}
      </div>
      {!search && !onlyOwned && list.length > suggested.length && (
        <button className="text-button next-recipe" onClick={() => setOffset((o) => o + 1)}>
          ほかの一品にする <ChevronRight size={16} />
        </button>
      )}
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
          <h1>
            自炊アルバム<span className="orange">。</span>
          </h1>
        </div>
        <button className="button primary" onClick={() => props.onRecord()}>
          <Plus size={17} />
          一皿を記録
        </button>
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
                <h3>{meal.title}</h3>
              </div>
            </button>
          )
        })}
      </div>
      {meals.length === 0 && (
        <div className="empty-state">
          <Camera size={40} />
          <h2>{all.length ? 'このジャンルは、これから。' : '最初の一皿を、ここに。'}</h2>
          <p>写真1枚で、今日の「つくれた」を残そう。</p>
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
          <h1>
            みんなの食卓<span className="orange">。</span>
          </h1>
        </div>
        <span className="outlined-badge">
          <span className="green-dot" />
          サンプルの仲間 3人
        </span>
      </div>
      {!unlocked ? (
        <section className="feed-locked">
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
          </div>
        </section>
      ) : (
        <>
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
