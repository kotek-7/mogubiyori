import { useEffect, useState } from 'react'
import {
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Leaf,
  Settings2,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { Pet, GatheringScene, DishArt, ItemArt } from './GameArt'
import { GameDialogs } from './GameDialogs'
import type { Dialog } from './GameDialogs'
import { StarterSelection, RecipeBoard, FriendsBoard } from './CollectionScreens'
import {
  chooseStarter,
  claimLogin,
  equipItem,
  feed,
  fedToday,
  hungerOf,
  items,
  LOGIN_BONUS,
  selectCompanion,
  shiftDay,
  species,
  stageOf,
  stageName,
  streakOf,
  todayTokyo,
} from './game'
import type { FeedInput } from './game'
import { loadGame, saveGame } from './gameStorage'
import './play.css'

type Page = 'room' | 'book' | 'album' | 'shop'
function route(): Page {
  const hash = window.location.hash.slice(1)
  return hash === 'album' || hash === 'shop' || hash === 'book' ? hash : 'room'
}
function Currency({ kind, amount }: { kind: 'coins' | 'gems'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      {kind === 'coins' ? <Coins size={17} /> : <Gem size={17} />}
      <strong>{amount.toLocaleString()}</strong>
    </span>
  )
}
function App() {
  const [state, setState] = useState(loadGame)
  const [page, setPage] = useState<Page>(route)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [toast, setToast] = useState('')
  const [petting, setPetting] = useState(false)
  const [bookKind, setBookKind] = useState<'recipes' | 'friends'>('recipes')
  const [shopKind, setShopKind] = useState<'hat' | 'room'>('hat')
  const hunger = hungerOf(state),
    stage = stageOf(state.xp),
    streak = streakOf(state),
    dailyFed = fedToday(state)
  const fed = hunger === 96
  const growth =
    stage === 2 ? 100 : stage === 0 ? (state.xp / 45) * 100 : ((state.xp - 45) / 75) * 100
  const nextGrowth = stage === 0 ? 45 - state.xp : 120 - state.xp
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setStorageError(!saveGame(state))
  }, [state])
  useEffect(() => {
    if (!state.activeId || state.claimedLoginDays.includes(state.today)) return
    // Daily claims are idempotent, including React StrictMode's repeated effects.
    // oxlint-disable-next-line react/set-state-in-effect
    setState(claimLogin)
    // oxlint-disable-next-line react/set-state-in-effect
    setToast(`おかえり！ログインボーナス +${LOGIN_BONUS}コイン`)
  }, [state.activeId, state.today, state.claimedLoginDays])
  useEffect(() => {
    const sync = () =>
      setState((s) => {
        const today = shiftDay(todayTokyo(), s.dayOffset)
        return today === s.today ? s : { ...s, today }
      })
    const hash = () => setPage(route())
    const timer = setInterval(sync, 60000)
    window.addEventListener('focus', sync)
    window.addEventListener('hashchange', hash)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', sync)
      window.removeEventListener('hashchange', hash)
    }
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    if (!petting) return
    const timer = setTimeout(() => setPetting(false), 1700)
    return () => clearTimeout(timer)
  }, [petting])
  function navigate(next: Page) {
    setPage(next)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function submit(data: FeedInput) {
    const before = { ...state, today: shiftDay(todayTokyo(), state.dayOffset) }
    const after = feed(before, data)
    if (after === before) return
    setState(after)
    navigate('room')
    setDialog({ type: 'feast', before, after })
  }
  function closeDialog() {
    if (
      dialog?.type === 'feast' &&
      !dialog.before.owned.includes('sprout') &&
      dialog.after.owned.includes('sprout')
    )
      setState((s) => equipItem(s, 'sprout'))
    setDialog(null)
  }
  function showFriends() {
    setBookKind('friends')
    navigate('book')
  }
  if (!state.activeId)
    return (
      <StarterSelection
        onChoose={(id) => {
          setState((s) => chooseStarter(s, id))
          navigate('room')
        }}
      />
    )
  const speech = petting
    ? 'えへへ。いっしょがいいね。'
    : fed
      ? 'おいしかった！次は、なにかな？'
      : state.reminder === 'eager'
        ? 'ねえ、ごはんまだ〜？'
        : 'きょうのごはん、楽しみだな。'
  return (
    <div className="play-app">
      <a className="skip-link" href="#main">
        本文へ
      </a>
      <header className="play-header">
        <button
          className="play-brand"
          aria-label="もぐ日和 ホーム"
          onClick={() => navigate('room')}
        >
          <Leaf size={19} />
          <span>もぐ日和</span>
        </button>
        <div className="play-wallet">
          <button aria-label={`コイン ${state.coins}枚、おみせへ`} onClick={() => navigate('shop')}>
            <Currency kind="coins" amount={state.coins} />
          </button>
          <button aria-label={`ジェム ${state.gems}個`} onClick={() => setDialog({ type: 'gems' })}>
            <Currency kind="gems" amount={state.gems} />
            <span>+</span>
          </button>
          <button
            className="icon-button"
            aria-label="設定"
            onClick={() => setDialog({ type: 'settings' })}
          >
            <Settings2 size={20} />
          </button>
        </div>
      </header>
      <main id="main" className={`play-main play-page-${page}`}>
        {storageError && (
          <p role="alert" className="error-message">
            端末に保存できませんでした。再読み込みすると今回の変更が失われます。
          </p>
        )}
        {page === 'room' && (
          <>
            <div className="play-greeting">
              <h1>ごはんのひろば</h1>
              <button className="play-streak" onClick={() => setDialog({ type: 'streak' })}>
                <Flame size={17} fill="currentColor" />
                <strong>{streak}</strong>日連続
                <ChevronRight size={13} />
              </button>
            </div>
            <section
              className={`play-world ${state.visitors.length ? 'with-visitors' : ''} theme-${state.equipped.room}`}
              aria-label={`${state.name}のひろば。${fed ? 'おなかいっぱい' : 'ごはんを待っています'}`}
            >
              <GatheringScene className="play-scenery" variant={state.equipped.room} />
              <div className="play-world-top">
                <span>{state.dayOffset > 0 ? 'おためしのひろば' : 'きょうも、いっしょに。'}</span>
                <button
                  aria-label={`${state.name}からのおたより`}
                  onClick={() => setDialog({ type: 'letters' })}
                >
                  <span aria-hidden="true">✉</span>
                  {!dailyFed && <i />}
                </button>
              </div>
              <div className="play-speech">{speech}</div>
              <button
                className={`play-pet ${petting ? 'is-petted' : ''}`}
                aria-label={`${state.name}をなでる`}
                onClick={() => setPetting(true)}
              >
                <Pet
                  species={state.activeId}
                  stage={stage}
                  mood={petting || fed ? 'happy' : 'hungry'}
                  hat={state.equipped.hat}
                />
                {petting && <span className="pet-heart">♥</span>}
              </button>
              {state.visitors.length > 0 && (
                <div className="play-guests">
                  <span>いいにおいにつられて…</span>
                  <div>
                    {state.visitors.map((id) => (
                      <button
                        key={id}
                        onClick={() => setDialog({ type: 'record', targetId: id })}
                        aria-label={`お客さんの${species.find((s) => s.id === id)!.name}にごはんをあげる`}
                      >
                        <Pet species={id} stage={0} mood="hungry" />
                        <span>ごはん？</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button className="play-friend-count" onClick={showFriends}>
                <span>
                  {state.companions.slice(0, 3).map((friend) => (
                    <Pet
                      key={friend.id}
                      species={friend.id}
                      stage={stageOf(friend.xp)}
                      mood="happy"
                    />
                  ))}
                </span>
                なかま {state.companions.length}/{species.length}
                <ChevronRight size={13} />
              </button>
            </section>
            <section className="play-care" aria-label="今日のごはん">
              <button className="play-growth" onClick={() => setDialog({ type: 'profile' })}>
                <span className="play-name">
                  <strong>{state.name}</strong>
                  <small>{stageName(stage)}</small>
                  <ChevronRight size={14} />
                </span>
                <span
                  className="play-growth-track"
                  role="progressbar"
                  aria-label="成長"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(growth)}
                >
                  <i style={{ width: `${growth}%` }} />
                </span>
                <span className="play-next">
                  {stage === 2
                    ? 'おいしそうに食べると、仲間がやってくる。'
                    : `あと ${nextGrowth} XPで、新しいすがた。`}
                </span>
              </button>
              <button
                className="primary-button play-feed"
                onClick={() => setDialog({ type: 'record' })}
              >
                <Utensils size={21} />
                {fed ? 'もうひと皿、あげる' : 'つくったごはんをあげる'}
              </button>
              <div className="play-today">
                <span>
                  {dailyFed ? (
                    <>
                      <Check size={13} />
                      今日も自炊できた！
                    </>
                  ) : (
                    <>
                      <Camera size={13} />
                      今日の一皿を待ってるよ
                    </>
                  )}
                </span>
                <span className="play-hunger">
                  {fed ? 'おなかいっぱい' : hunger <= 8 ? 'おなかぺこぺこ' : 'おなかすいた'}
                </span>
              </div>
            </section>
            <div className="play-rewards">
              <span>
                <Coins size={14} />
                ログイン +20
                <Check size={12} />
              </span>
              <button onClick={() => setDialog({ type: 'streak' })}>
                <Flame size={14} />
                {streak < 3 ? '3日連続で +30' : '7日ごとに +100'}
                <ChevronRight size={12} />
              </button>
            </div>
          </>
        )}
        {page === 'book' && (
          <>
            <div className="play-page-heading">
              <span>ひと皿ごとに、発見。</span>
              <h1>おいしいずかん</h1>
            </div>
            <div className="play-book-tabs" role="group" aria-label="ずかんのカテゴリ">
              <button aria-pressed={bookKind === 'recipes'} onClick={() => setBookKind('recipes')}>
                レシピカード
              </button>
              <button aria-pressed={bookKind === 'friends'} onClick={() => setBookKind('friends')}>
                なかま
              </button>
            </div>
            {bookKind === 'recipes' ? (
              <RecipeBoard
                state={state}
                onRecipe={(recipeId) => setDialog({ type: 'recipe', recipeId })}
              />
            ) : (
              <FriendsBoard
                state={state}
                onSelect={(id) => {
                  setState((s) => selectCompanion(s, id))
                  navigate('room')
                }}
                onFeedVisitor={(targetId) => setDialog({ type: 'record', targetId })}
              />
            )}
            <button className="quiet-button play-memories" onClick={() => navigate('album')}>
              ごはんの思い出
              <ChevronRight size={14} />
            </button>
          </>
        )}
        {page === 'album' && (
          <>
            <div className="play-page-heading">
              <span>いっしょに食べた、{state.meals.length}皿。</span>
              <h1>ごはんの思い出</h1>
            </div>
            <div className="album-grid">
              {state.meals.map((meal) => (
                <button
                  key={meal.id}
                  className="memory-card"
                  onClick={() => setDialog({ type: 'meal', meal })}
                >
                  <div className="memory-photo">
                    {meal.photo ? (
                      <img src={meal.photo} alt={meal.title} />
                    ) : (
                      <DishArt kind={meal.sample} />
                    )}
                    <span>{meal.day.slice(5).replace('-', '/')}</span>
                  </div>
                  <strong>{meal.title}</strong>
                  <small>
                    {species.find((s) => s.id === meal.targetId)?.name ?? 'こむぎ'}と、+{meal.xp} XP
                  </small>
                </button>
              ))}
            </div>
            {!state.meals.length && (
              <div className="empty-state">
                <DishArt kind="rice" />
                <h2>はじめてのごはん、まってるよ。</h2>
                <button className="primary-button" onClick={() => setDialog({ type: 'record' })}>
                  ごはんをあげる
                </button>
              </div>
            )}
          </>
        )}
        {page === 'shop' && (
          <>
            <div className="play-page-heading">
              <span>見つけたごほうびで、おめかし。</span>
              <h1>よりみち商店</h1>
            </div>
            <div className="play-shop-banner">
              <Pet
                species={state.activeId}
                stage={stage}
                mood="happy"
                hat={shopKind === 'hat' ? 'beret' : state.equipped.hat}
              />
              <span>
                明日のきみに、
                <br />
                <strong>ちいさな楽しみ。</strong>
              </span>
              <Sparkles size={22} />
            </div>
            <div className="play-book-tabs" role="group" aria-label="おみせのカテゴリ">
              <button aria-pressed={shopKind === 'hat'} onClick={() => setShopKind('hat')}>
                おきがえ
              </button>
              <button aria-pressed={shopKind === 'room'} onClick={() => setShopKind('room')}>
                もようがえ
              </button>
            </div>
            <div className="shop-grid">
              {items
                .filter((item) => item.kind === shopKind)
                .map((item) => {
                  const owned = state.owned.includes(item.id),
                    equipped = state.equipped[item.kind] === item.id
                  return (
                    <button
                      className={`shop-card ${equipped ? 'is-equipped' : ''}`}
                      key={item.id}
                      onClick={() => setDialog({ type: 'item', item })}
                    >
                      <div className="item-art">
                        {item.id === 'none' ? (
                          <Pet species={state.activeId!} stage={stage} mood="happy" />
                        ) : (
                          <ItemArt id={item.id} />
                        )}
                        {equipped && (
                          <span className="equipped-label">
                            <Check size={12} />
                            使用中
                          </span>
                        )}
                      </div>
                      <strong>{item.name}</strong>
                      <span className="item-price">
                        {owned ? (
                          <span className="owned-label">持っている</span>
                        ) : (
                          <Currency kind={item.currency} amount={item.price} />
                        )}
                      </span>
                    </button>
                  )
                })}
            </div>
          </>
        )}
      </main>
      <nav className="play-nav" aria-label="メインナビゲーション">
        {[
          { id: 'room' as const, name: 'ひろば', Icon: Utensils },
          { id: 'book' as const, name: 'ずかん', Icon: BookOpen },
          { id: 'shop' as const, name: 'おみせ', Icon: ShoppingBag },
        ].map(({ id, name, Icon }) => (
          <button
            key={id}
            aria-current={page === id || (id === 'book' && page === 'album') ? 'page' : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={23} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {dialog && (
        <GameDialogs
          key={dialog.type}
          dialog={dialog}
          state={state}
          setState={setState}
          onClose={closeDialog}
          onNavigate={navigate}
          onToast={setToast}
          onFeed={submit}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  )
}
export default App
