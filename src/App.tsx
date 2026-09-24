import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Bell,
  Check,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Settings2,
  Utensils,
} from 'lucide-react'
import { Pet, GatheringScene, DishArt, ItemArt } from './GameArt'
import { MoguMark, VillageBackdrop, VillageSign } from './GameMotifs'
import { RecipeArt } from './RecipeArt'
import { GameDialogs } from './GameDialogs'
import type { Dialog } from './GameDialogs'
import { StarterSelection, RecipeBoard, FriendsBoard } from './CollectionScreens'
import { TutorialJourney } from './TutorialJourney'
import { MealJourney } from './MealJourney'
import { FeastJourney } from './FeastJourney'
import { PlayGuide } from './PlayGuide'
import { transitionScene } from './journeyTransition'
import {
  chooseStarter,
  claimLogin,
  equipItem,
  feed,
  fedToday,
  hungerOf,
  growthProgress,
  items,
  LOGIN_BONUS,
  recipeById,
  selectCompanion,
  shiftDay,
  species,
  stageOf,
  stageName,
  streakOf,
  todayTokyo,
} from './game'
import type { FeedInput, GameState, SpeciesId, TutorialStep } from './game'
import { loadGame, saveGame } from './gameStorage'
import './play.css'

type Page = 'room' | 'book' | 'album' | 'shop'
type MealOptions = { recipeId?: string; targetId?: SpeciesId }
type Journey =
  | { type: 'tutorial'; step: TutorialStep }
  | ({ type: 'meal' } & MealOptions)
  | { type: 'feast'; before: GameState; after: GameState }
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
  const [journey, setJourney] = useState<Journey | null>(null)
  const feedButton = useRef<HTMLButtonElement>(null)
  const growthButton = useRef<HTMLButtonElement>(null)
  const bookButton = useRef<HTMLButtonElement>(null)
  const bookGuide = useRef<HTMLDivElement>(null)
  const restoreFeedFocus = useRef(false)
  const submitted = useRef(false)
  const [storageError, setStorageError] = useState(false)
  const [toast, setToast] = useState('')
  const [petting, setPetting] = useState(false)
  const [bookKind, setBookKind] = useState<'recipes' | 'friends'>('recipes')
  const [shopKind, setShopKind] = useState<'hat' | 'room'>('hat')
  const homeGuide = state.tutorial.status === 'completed' ? state.tutorial.homeGuide : undefined
  const showMealGuide = homeGuide === 'meal' && !dialog
  const showGrowthGuide = homeGuide === 'growth' && !dialog
  const showBookGuide = homeGuide === 'book' && page === 'room' && !dialog
  const hunger = hungerOf(state),
    stage = stageOf(state.xp),
    streak = streakOf(state),
    dailyFed = fedToday(state)
  const fed = hunger === 96
  const { progress: growth, remaining: nextGrowth } = growthProgress(state.xp)
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
    setToast(`ログインボーナス +${LOGIN_BONUS}コイン`)
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
  useEffect(() => {
    if (!journey && restoreFeedFocus.current) {
      restoreFeedFocus.current = false
      const target = homeGuide === 'growth' ? growthButton.current : feedButton.current
      target?.focus({ preventScroll: true })
      if (homeGuide === 'meal' || homeGuide === 'growth')
        target?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
  }, [journey, state.tutorial.status, homeGuide])
  useEffect(() => {
    if (journey || dialog || page !== 'room') return
    const target =
      homeGuide === 'meal'
        ? feedButton.current?.parentElement
        : homeGuide === 'growth'
          ? growthButton.current?.parentElement
          : homeGuide === 'book'
            ? bookGuide.current
            : null
    target?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [homeGuide, journey, dialog, page])
  function navigate(next: Page) {
    setPage(next)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function submit(data: FeedInput) {
    if (submitted.current || journey?.type !== 'meal') return
    const before = { ...state, today: shiftDay(todayTokyo(), state.dayOffset) }
    const result = feed(before, data)
    if (result === before) return
    const after: GameState =
      result.tutorial.homeGuide === 'meal'
        ? { ...result, tutorial: { ...result.tutorial, homeGuide: 'growth' } }
        : result
    submitted.current = true
    transitionScene(() => {
      setState(after)
      setJourney({ type: 'feast', before, after })
    })
  }
  function openMeal(options: MealOptions = {}) {
    submitted.current = false
    transitionScene(() => {
      setToast('')
      setDialog(null)
      setJourney({ type: 'meal', ...options })
    })
  }
  function finishJourney() {
    if (
      journey?.type === 'feast' &&
      !journey.before.owned.includes('sprout') &&
      journey.after.owned.includes('sprout')
    )
      setState((s) => equipItem(s, 'sprout'))
    transitionScene(() => {
      restoreFeedFocus.current = true
      setJourney(null)
      navigate('room')
    })
  }
  function showFriends() {
    setBookKind('friends')
    navigate('book')
  }
  function dismissHomeGuide() {
    setState((current) => ({
      ...current,
      tutorial: { ...current.tutorial, homeGuide: 'done' },
    }))
    const target =
      homeGuide === 'growth'
        ? growthButton.current
        : homeGuide === 'book'
          ? bookButton.current
          : feedButton.current
    target?.focus({ preventScroll: true })
  }
  function openProfile() {
    if (homeGuide === 'growth')
      setState((current) => ({
        ...current,
        tutorial: { ...current.tutorial, homeGuide: 'book' },
      }))
    setDialog({ type: 'profile' })
  }
  function startTutorial() {
    transitionScene(() => {
      setDialog(null)
      setToast('')
      if (state.tutorial.status === 'completed') {
        setJourney({ type: 'tutorial', step: 0 })
      } else {
        setState((current) => ({
          ...current,
          tutorial: { ...current.tutorial, status: 'active' },
        }))
        setJourney(null)
      }
    })
  }
  function pauseTutorial() {
    transitionScene(() => {
      if (journey?.type !== 'tutorial') {
        setState((current) => ({
          ...current,
          tutorial: { ...current.tutorial, status: 'paused' },
        }))
      }
      setJourney(null)
      navigate('room')
      restoreFeedFocus.current = true
    })
  }
  if (!state.activeId)
    return (
      <StarterSelection
        onChoose={(id) => {
          transitionScene(() => {
            setState((s) => chooseStarter(s, id))
            setJourney(null)
            navigate('room')
          })
        }}
      />
    )
  const tutorialStep =
    journey?.type === 'tutorial'
      ? journey.step
      : !journey && state.tutorial.status === 'active'
        ? state.tutorial.step
        : null
  if (tutorialStep !== null)
    return (
      <>
        <TutorialJourney
          speciesId={state.activeId}
          step={tutorialStep}
          replay={journey?.type === 'tutorial'}
          onStep={(step) =>
            transitionScene(() => {
              if (journey?.type === 'tutorial') setJourney({ type: 'tutorial', step })
              else setState((current) => ({ ...current, tutorial: { ...current.tutorial, step } }))
            })
          }
          onPause={pauseTutorial}
          onComplete={() => {
            transitionScene(() => {
              if (journey?.type !== 'tutorial')
                setState((current) => ({
                  ...current,
                  tutorial: {
                    version: 1,
                    step: 4,
                    status: 'completed',
                    homeGuide: current.meals.length === 0 ? 'meal' : 'done',
                  },
                }))
              setToast('')
              setJourney(null)
              navigate('room')
              restoreFeedFocus.current = true
            })
          }}
        />
        {storageError && (
          <p role="alert" className="journey-storage-error">
            この端末に保存できませんでした。再読み込みせずに続けてください。
          </p>
        )}
      </>
    )
  if (journey)
    return (
      <>
        {journey.type === 'meal' ? (
          <MealJourney
            state={state}
            recipeId={journey.recipeId}
            targetId={journey.targetId}
            guided={homeGuide === 'meal'}
            onFeed={submit}
            onClose={finishJourney}
          />
        ) : journey.type === 'feast' ? (
          <FeastJourney before={journey.before} after={journey.after} onDone={finishJourney} />
        ) : null}
        {storageError && (
          <p role="alert" className="journey-storage-error">
            この端末に保存できませんでした。再読み込みせずに続けてください。
          </p>
        )}
      </>
    )
  return (
    <div className="play-app" data-home-guide={homeGuide}>
      <VillageBackdrop />
      <a className="skip-link" href="#main">
        本文へ
      </a>
      <header className="play-header">
        <button
          className="play-brand"
          aria-label="もぐ日和 ホーム"
          onClick={() => navigate('room')}
        >
          <MoguMark />
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
              <div>
                <span className="play-location">カヤ村・下のかまど</span>
                <h1>ごはんのひろば</h1>
              </div>
              <button className="play-streak" onClick={() => setDialog({ type: 'streak' })}>
                <Flame size={17} fill="currentColor" />
                <strong>{streak}</strong>日連続
                <ChevronRight size={13} />
              </button>
            </div>
            <section
              data-growth-stage={stage}
              className={`play-world ${state.visitors.length ? 'with-visitors' : ''} theme-${state.equipped.room}`}
              aria-label={`${state.name}のひろば。${fed ? 'おなかいっぱい' : 'ごはんを待っています'}`}
            >
              <GatheringScene className="play-scenery" variant={state.equipped.room} />
              <div className="play-world-top">
                <span className="play-condition">
                  <Utensils size={13} />
                  {fed ? '満腹' : hunger <= 8 ? '空腹' : 'ごはん待ち'}
                </span>
                <button
                  aria-label="ごはんのお知らせ"
                  onClick={() => setDialog({ type: 'letters' })}
                  className={!dailyFed && state.reminder === 'eager' ? 'has-reminder' : undefined}
                >
                  <Bell size={19} />
                  {!dailyFed && <i />}
                </button>
              </div>
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
                  <span>お客さん {state.visitors.length}</span>
                  <div>
                    {state.visitors.map((id) => (
                      <button
                        key={id}
                        onClick={() => openMeal({ targetId: id })}
                        aria-label={`お客さんの${species.find((s) => s.id === id)!.name}にごはんをあげる`}
                      >
                        <Pet species={id} stage={0} mood="hungry" />
                        <span>{species.find((s) => s.id === id)!.name}</span>
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
                      portrait
                    />
                  ))}
                </span>
                なかま {state.companions.length}/{species.length}
                <ChevronRight size={13} />
              </button>
            </section>
            <section className="play-care" aria-label="今日のごはん">
              <div className="play-care-growth">
                {showGrowthGuide && (
                  <PlayGuide id="home-growth-guide" onDismiss={dismissHomeGuide}>
                    ごはんで経験値が増えました。ここで{state.name}の成長を確認できます。
                  </PlayGuide>
                )}
                <button
                  ref={growthButton}
                  className={`play-growth${showGrowthGuide ? ' is-guide-target' : ''}`}
                  aria-describedby={showGrowthGuide ? 'home-growth-guide-text' : undefined}
                  onClick={openProfile}
                >
                  <span className="play-name">
                    <strong>{state.name}</strong>
                    <small>
                      {stageName(stage)} · {stage + 1}/5
                    </small>
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
                    {stage === 4 ? 'すべての姿を発見' : `次の成長まで ${nextGrowth} XP`}
                  </span>
                </button>
              </div>
              <div className="play-care-feed">
                {showMealGuide && (
                  <PlayGuide id="home-meal-guide" onDismiss={dismissHomeGuide}>
                    {state.name}がごはんを待っています。自分で作った料理をここから記録しましょう。
                  </PlayGuide>
                )}
                <button
                  ref={feedButton}
                  className={`primary-button play-feed${showMealGuide ? ' is-guide-target' : ''}`}
                  aria-describedby={showMealGuide ? 'home-meal-guide-text' : undefined}
                  onClick={() => openMeal()}
                >
                  <MoguMark />
                  {fed ? 'もう一度あげる' : 'ごはんをあげる'}
                </button>
              </div>
              <div className="play-today">
                <span>
                  {dailyFed ? (
                    <>
                      <Check size={13} />
                      今日のごはん 記録済み
                    </>
                  ) : (
                    <>今日のごはん 未記録</>
                  )}
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
            {state.tutorial.status === 'paused' && (
              <button className="tutorial-resume" onClick={startTutorial}>
                <BookOpen size={16} />
                チュートリアルを続ける
                <ChevronRight size={14} />
              </button>
            )}
          </>
        )}
        {page === 'book' && (
          <>
            <div className="play-page-heading">
              <h1>図鑑</h1>
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
                onFeedVisitor={(targetId) => openMeal({ targetId })}
              />
            )}
            <button className="quiet-button play-memories" onClick={() => navigate('album')}>
              ごはんの記録
              <ChevronRight size={14} />
            </button>
          </>
        )}
        {page === 'album' && (
          <>
            <div className="play-page-heading">
              <h1>ごはんの記録</h1>
              <span>{state.meals.length}件</span>
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
                      <RecipeArt recipe={recipeById(meal.recipeId)} sample={meal.sample} />
                    )}
                    <span>{meal.day.slice(5).replace('-', '/')}</span>
                  </div>
                  <strong>{meal.title}</strong>
                  <small>
                    {species.find((s) => s.id === meal.targetId)?.name ?? 'こむぎ'} · +{meal.xp} XP
                  </small>
                </button>
              ))}
            </div>
            {!state.meals.length && (
              <div className="empty-state">
                <DishArt kind="rice" />
                <h2>まだ記録がありません</h2>
                <button className="primary-button" onClick={() => openMeal()}>
                  ごはんをあげる
                </button>
              </div>
            )}
          </>
        )}
        {page === 'shop' && (
          <>
            <div className="play-page-heading">
              <h1>おみせ</h1>
            </div>
            <div className="play-book-tabs" role="group" aria-label="おみせのカテゴリ">
              <button aria-pressed={shopKind === 'hat'} onClick={() => setShopKind('hat')}>
                ぼうし
              </button>
              <button aria-pressed={shopKind === 'room'} onClick={() => setShopKind('room')}>
                ひろば
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
                          <span className="owned-label">所持済み</span>
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
      <div className={showBookGuide ? 'play-guide-nav' : undefined} ref={bookGuide}>
        {showBookGuide && (
          <PlayGuide id="home-book-guide" onDismiss={dismissHomeGuide}>
            料理のカードはずかんに集まります。カードを見てみましょう。
          </PlayGuide>
        )}
        <nav className="play-nav" aria-label="メインナビゲーション">
          {[
            { id: 'room' as const, name: 'ひろば' },
            { id: 'book' as const, name: 'ずかん' },
            { id: 'shop' as const, name: 'おみせ' },
          ].map(({ id, name }) => (
            <button
              key={id}
              ref={id === 'book' ? bookButton : undefined}
              className={id === 'book' && showBookGuide ? 'is-guide-target' : undefined}
              aria-describedby={id === 'book' && showBookGuide ? 'home-book-guide-text' : undefined}
              aria-current={page === id || (id === 'book' && page === 'album') ? 'page' : undefined}
              onClick={() => {
                if (id === 'book' && homeGuide === 'book') {
                  setBookKind('recipes')
                  setState((current) => ({
                    ...current,
                    tutorial: { ...current.tutorial, homeGuide: 'done' },
                  }))
                }
                navigate(id)
              }}
            >
              <VillageSign kind={id} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
      </div>
      {dialog && (
        <GameDialogs
          key={dialog.type}
          dialog={dialog}
          state={state}
          setState={setState}
          onClose={() => setDialog(null)}
          onNavigate={navigate}
          onToast={setToast}
          onRecord={openMeal}
          onTutorial={startTutorial}
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
