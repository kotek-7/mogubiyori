import { useEffect, useState } from 'react'
import {
  Bell,
  BookHeart,
  Camera,
  Check,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Home,
  Leaf,
  Settings2,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { Pet, RoomScene, DishArt, ItemArt } from './GameArt'
import { GameDialogs } from './GameDialogs'
import type { Dialog } from './GameDialogs'
import {
  equipItem,
  feed,
  fedToday,
  hungerOf,
  items,
  levelOf,
  shiftDay,
  streakOf,
  todayTokyo,
} from './game'
import { loadGame, saveGame } from './gameStorage'

type Page = 'room' | 'album' | 'shop'
const dateLabel = (day: string) =>
  new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(
    new Date(`${day}T12:00:00+09:00`),
  )
function route(): Page {
  const hash = window.location.hash.slice(1)
  return hash === 'album' || hash === 'shop' ? hash : 'room'
}
function Currency({ kind, amount }: { kind: 'coins' | 'gems'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      {kind === 'coins' ? <Coins size={18} /> : <Gem size={17} />}
      <strong>{amount.toLocaleString()}</strong>
    </span>
  )
}
function Meter({
  value,
  label,
  className = '',
}: {
  value: number
  label: string
  className?: string
}) {
  return (
    <div
      className={`meter ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
function App() {
  const [state, setState] = useState(loadGame)
  const [page, setPage] = useState<Page>(route)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [toast, setToast] = useState('')
  const [petting, setPetting] = useState(false)
  const [shopKind, setShopKind] = useState<'hat' | 'room'>('hat')
  const fed = fedToday(state),
    hunger = hungerOf(state),
    level = levelOf(state),
    streak = streakOf(state)
  const resting = state.rests.includes(state.today)
  useEffect(() => {
    // Storage failures must remain visible while the current session stays usable.
    // oxlint-disable-next-line react/set-state-in-effect
    setStorageError(!saveGame(state))
  }, [state])
  useEffect(() => {
    const sync = () =>
      setState((s) => {
        const today = shiftDay(todayTokyo(), s.dayOffset)
        return today === s.today ? s : { ...s, today }
      })
    const hash = () => setPage(route())
    const t = setInterval(sync, 60000)
    window.addEventListener('focus', sync)
    window.addEventListener('hashchange', hash)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', sync)
      window.removeEventListener('hashchange', hash)
    }
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!petting) return
    const t = setTimeout(() => setPetting(false), 1700)
    return () => clearTimeout(t)
  }, [petting])
  function navigate(next: Page) {
    setPage(next)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function submit(data: { title: string; photo?: string; sample: string }) {
    const before = { ...state, today: shiftDay(todayTokyo(), state.dayOffset) }
    const after = feed(before, data)
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
  const speech = petting
    ? 'えへへ。きょうも会えたね。'
    : fed
      ? 'おいしかったぁ。ごちそうさま！'
      : resting
        ? '今日は、のんびり待ってるね。'
        : hunger <= 8
          ? 'おなかぺこぺこ…ごはん、まってるよ。'
          : state.reminder === 'eager'
            ? 'ねえねえ、ごはんまだ〜？'
            : 'きょうのごはん、なにかなぁ。'
  return (
    <div className="game-app">
      <a className="skip-link" href="#main">
        本文へ
      </a>
      <header className="app-header">
        <button className="brand" onClick={() => navigate('room')} aria-label="もぐ日和 ホーム">
          <span className="brand-mark">
            <Utensils size={19} />
            <Leaf size={12} />
          </span>
          <span>
            もぐ日和<small>MOGU BIYORI</small>
          </span>
        </button>
        <nav className="main-nav" aria-label="メインナビゲーション">
          {[
            { id: 'room' as const, name: 'おへや', Icon: Home },
            { id: 'album' as const, name: '思い出', Icon: BookHeart },
            { id: 'shop' as const, name: 'おみせ', Icon: ShoppingBag },
          ].map(({ id, name, Icon }) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="gem-wallet"
            aria-label={`ジェム ${state.gems}個`}
            onClick={() => setDialog({ type: 'gems' })}
          >
            <Currency kind="gems" amount={state.gems} />
            <span>+</span>
          </button>
          <button
            className="icon-button settings-button"
            aria-label="設定"
            onClick={() => setDialog({ type: 'settings' })}
          >
            <Settings2 size={21} />
          </button>
        </div>
      </header>
      <main id="main" className={`main-content page-${page}`}>
        {storageError && (
          <p role="alert" className="error-message storage-error">
            端末に保存できませんでした。再読み込みすると今回の変更が失われます。
          </p>
        )}
        {page === 'room' && (
          <>
            <div className="room-heading">
              <div>
                <span className="eyebrow">きみと暮らす、ちいさな毎日</span>
                <h1>
                  {state.name}のおへや<span>。</span>
                </h1>
              </div>
              <button className="streak-badge" onClick={() => setDialog({ type: 'streak' })}>
                <Flame size={22} fill="currentColor" />
                <strong>{streak}</strong>
                <span>日連続</span>
              </button>
            </div>
            <section
              className={`room-stage ${fed ? 'is-fed' : ''} ${state.equipped.room === 'night' ? 'night-room' : ''}`}
              aria-label={`${state.name}のおへや。${fed ? 'おなかいっぱい' : 'ごはんを待っています'}`}
            >
              <RoomScene variant={state.equipped.room} className="room-illustration" />
              <div className="stage-topline">
                <span className="room-date">
                  <span />
                  {dateLabel(state.today)}
                  {state.dayOffset > 0 && ' · おためし'}
                </span>
                <button
                  className="coin-wallet"
                  aria-label={`コイン ${state.coins}枚、おみせへ`}
                  onClick={() => navigate('shop')}
                >
                  <Currency kind="coins" amount={state.coins} />
                </button>
              </div>
              <div className={`speech-bubble ${petting ? 'pet-speech' : ''}`}>
                <span>{speech}</span>
                {!fed && !resting && <span className="bubble-dots">···</span>}
              </div>
              <button
                className={`pet-interaction ${petting ? 'is-petted' : ''}`}
                aria-label={`${state.name}をなでる`}
                onClick={() => setPetting(true)}
              >
                <Pet
                  mood={petting || fed ? 'happy' : resting ? 'sleepy' : 'hungry'}
                  hat={state.equipped.hat}
                />
                {petting && <span className="pet-heart">♥</span>}
              </button>
              <span className="pet-shadow" />
              <button
                className="room-letter"
                aria-label={`${state.name}からのおたより`}
                onClick={() => setDialog({ type: 'letters' })}
              >
                <Bell size={19} />
                {!fed && <span />}
              </button>
              <span className="room-caption">a little home, a little happiness.</span>
            </section>
            <section className="care-panel" aria-label="今日のおせわ">
              <button className="pet-profile" onClick={() => setDialog({ type: 'profile' })}>
                <span className="mini-portrait">
                  <Pet mood={fed ? 'happy' : 'hungry'} hat={state.equipped.hat} />
                </span>
                <span className="pet-name">
                  <strong>
                    {state.name}
                    <span>Lv. {level.level}</span>
                  </strong>
                  <Meter value={(level.progress / level.needed) * 100} label="成長" />
                  <small>つぎのレベルまで {level.needed - level.progress} XP</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <div className="hunger-status">
                <div>
                  <Utensils size={16} />
                  <strong>
                    {fed ? 'おなかいっぱい' : hunger <= 8 ? 'おなかぺこぺこ' : 'おなかすいた'}
                  </strong>
                  <span>
                    {hunger}
                    <small>/100</small>
                  </span>
                </div>
                <Meter
                  value={hunger}
                  label="満腹度"
                  className={fed ? 'full-belly' : 'hungry-belly'}
                />
              </div>
              <div className="daily-action">
                <button
                  className={`primary-button ${fed ? 'completed-button' : ''}`}
                  onClick={() =>
                    fed
                      ? setDialog({
                          type: 'meal',
                          meal: state.meals.find((m) => m.day === state.today)!,
                        })
                      : setDialog({ type: 'record' })
                  }
                >
                  {fed ? (
                    <>
                      <Check size={21} />
                      今日のごはん、ありがとう
                    </>
                  ) : (
                    <>
                      <Camera size={21} />
                      つくったごはんをあげる
                    </>
                  )}
                </button>
                <span>
                  {fed
                    ? 'また明日も、いっしょに。'
                    : resting
                      ? '今日はおやすみ中。ごはんをあげてもOK。'
                      : streak
                        ? `今日のひと皿で、${streak + 1}日連続へ。`
                        : '最初のひと皿から、はじめよう。'}
                </span>
              </div>
            </section>
            <div className="home-bottom">
              <button
                className="quiet-button milestone-link"
                onClick={() => setDialog({ type: 'streak' })}
              >
                <Leaf size={15} />
                {state.owned.includes('sprout')
                  ? 'ごはんの思い出が、ふえていく。'
                  : `7日つづくと、ふたばのかんむり。`}
                <ChevronRight size={14} />
              </button>
              {!fed && !resting && (
                <button
                  className="quiet-button rest-link"
                  onClick={() => setDialog({ type: 'rest' })}
                >
                  今日はおやすみ
                </button>
              )}
            </div>
          </>
        )}
        {page === 'album' && (
          <>
            <div className="page-title album-heading">
              <div>
                <span className="eyebrow">ふたりのごはん日記</span>
                <h1>おいしい、思い出。</h1>
                <p>{state.meals.length}皿ぶん、いっしょに育った。</p>
              </div>
              {state.meals.length > 0 && (
                <button
                  className="quiet-button album-add"
                  onClick={() => setDialog({ type: 'record' })}
                >
                  <Camera size={18} />
                  もうひと皿
                </button>
              )}
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
                    <span>{dateLabel(meal.day)}</span>
                  </div>
                  <strong>{meal.title}</strong>
                  <small>
                    <HeartIcon />
                    {meal.xp > 0 ? `${state.name}の成長 +${meal.xp}` : 'いっしょに、もうひと皿。'}
                  </small>
                </button>
              ))}
            </div>
            {!state.meals.length && (
              <div className="empty-state">
                <DishArt kind="rice" />
                <h2>はじめてのごはん、まってるよ。</h2>
                <button className="primary-button" onClick={() => setDialog({ type: 'record' })}>
                  <Camera size={18} />
                  ごはんをあげる
                </button>
              </div>
            )}
          </>
        )}
        {page === 'shop' && (
          <>
            <div className="page-title shop-heading">
              <div>
                <span className="eyebrow">ふたりの暮らしに、ひとつずつ</span>
                <h1>よりみち商店。</h1>
              </div>
              <div className="shop-wallet">
                <Currency kind="coins" amount={state.coins} />
                <button onClick={() => setDialog({ type: 'gems' })} aria-label="ジェムを追加">
                  <Currency kind="gems" amount={state.gems} />
                  <span>+</span>
                </button>
              </div>
            </div>
            <div className="shop-banner">
              <Pet mood="happy" hat={shopKind === 'hat' ? 'beret' : state.equipped.hat} />
              <div>
                <small>{state.name}の、おきにいりを。</small>
                <h2>
                  {shopKind === 'hat' ? 'きょうは、どんな気分？' : '帰ってくるのが、楽しみになる。'}
                </h2>
                <p>
                  {shopKind === 'hat'
                    ? 'ちいさなおめかし、大きなよろこび。'
                    : 'すきな景色で、のんびり暮らそう。'}
                </p>
              </div>
              <Sparkles size={27} />
            </div>
            <div className="category-tabs" role="group" aria-label="おみせのカテゴリ">
              <button aria-pressed={shopKind === 'hat'} onClick={() => setShopKind('hat')}>
                おきがえ
              </button>
              <button aria-pressed={shopKind === 'room'} onClick={() => setShopKind('room')}>
                おへや
              </button>
            </div>
            <div className="shop-grid">
              {items
                .filter((i) => i.kind === shopKind)
                .map((item) => {
                  const owned = state.owned.includes(item.id)
                  const equipped = state.equipped[item.kind] === item.id
                  return (
                    <button
                      className={`shop-card ${equipped ? 'is-equipped' : ''}`}
                      key={item.id}
                      onClick={() => setDialog({ type: 'item', item })}
                    >
                      <div className="item-art">
                        <ItemArt id={item.id} />
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
            <p className="shop-footnote">コインは自炊のごほうび。ジェムは特別なおめかしに。</p>
          </>
        )}
      </main>
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
function HeartIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-4 3-1 8 8 15 9-7 12-12 8-15Z" />
    </svg>
  )
}
export default App
