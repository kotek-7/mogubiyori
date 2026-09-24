import { useEffect, useRef, useState } from 'react'
import { Check, Settings2 } from 'lucide-react'
import { MoguMark, VillageSign } from './GameMotifs'
import { GameDialogs } from './GameDialogs'
import type { Dialog } from './GameDialogs'
import { StarterSelection } from './CollectionScreens'
import { TutorialJourney } from './TutorialJourney'
import { MealJourney } from './MealJourney'
import { FeastJourney } from './FeastJourney'
import { PlayGuide } from './PlayGuide'
import { transitionScene } from './journeyTransition'
import type { FeedInput, SpeciesId, TutorialStep } from './game'
import type { FeedReceipt } from '../shared/receipt'
import type { GameCommand } from '../shared/commands'
import { Outlet, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { useGameSession } from './app/useGameSession'
import { GameUiProvider } from './app/gameUi'
import type { Page } from './app/gameUi'
import { Currency } from './ui/Currency'
import './play.css'

type MealOptions = { recipeId?: string; targetId?: SpeciesId }
type Journey =
  | { type: 'tutorial'; step: TutorialStep }
  | ({ type: 'meal' } & MealOptions)
  | { type: 'feast'; receipt: FeedReceipt; photo?: string }
function App() {
  const { state, execute, error, busy, retry, dismissError } = useGameSession()
  const router = useRouter()
  const routerNavigate = useNavigate()
  const pathname = useRouterState({ select: (router) => router.location.pathname })
  const page: Page =
    pathname === '/book'
      ? 'book'
      : pathname === '/album'
        ? 'album'
        : pathname === '/shop'
          ? 'shop'
          : 'room'
  function run(command: GameCommand, onSuccess?: () => void) {
    void execute(command)
      .then(() => onSuccess?.())
      .catch(() => undefined)
  }
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const feedButton = useRef<HTMLButtonElement>(null)
  const growthButton = useRef<HTMLButtonElement>(null)
  const bookButton = useRef<HTMLButtonElement>(null)
  const bookGuide = useRef<HTMLDivElement>(null)
  const restoreFeedFocus = useRef(false)
  const [toast, setToast] = useState('')
  const [petting, setPetting] = useState(false)
  const [bookKind, setBookKind] = useState<'recipes' | 'friends'>('recipes')
  const [shopKind, setShopKind] = useState<'hat' | 'room'>('hat')
  const homeGuide = state.tutorial.status === 'completed' ? state.tutorial.homeGuide : undefined
  const showMealGuide = homeGuide === 'meal' && !dialog
  const showGrowthGuide = homeGuide === 'growth' && !dialog
  const showBookGuide = homeGuide === 'book' && page === 'room' && !dialog
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
    }
  }, [journey, state.tutorial.status, homeGuide])
  useEffect(() => {
    if (journey || dialog || page !== 'room') return
    let active = true
    const scrollGuide = () => {
      if (!active || router.state.location.pathname !== '/') return
      const target =
        homeGuide === 'meal'
          ? feedButton.current?.parentElement
          : homeGuide === 'growth'
            ? growthButton.current?.parentElement
            : homeGuide === 'book'
              ? bookGuide.current
              : null
      target?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
    scrollGuide()
    const unsubscribe = router.subscribe('onRendered', () => {
      // Route scroll restoration runs on this event too, including the initial load.
      queueMicrotask(scrollGuide)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [homeGuide, journey, dialog, page, router])
  function navigate(next: Page) {
    void routerNavigate({ to: next === 'room' ? '/' : `/${next}` })
  }
  async function submit(input: FeedInput, operationId: string) {
    const result = await execute({ type: 'feed', input }, operationId)
    if (!result.receipt) throw new Error('記録を確認できませんでした。もう一度お試しください。')
    return result.receipt
  }
  function openMeal(options: MealOptions = {}) {
    dismissError()
    transitionScene(() => {
      setToast('')
      setDialog(null)
      setJourney({ type: 'meal', ...options })
    })
  }
  function finishJourney() {
    dismissError()
    if (journey?.type === 'feast' && journey.receipt.newItems.includes('sprout'))
      run({ type: 'equip', id: 'sprout' })
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
    run({ type: 'tutorial', input: { homeGuide: 'done' } })
    const target =
      homeGuide === 'growth'
        ? growthButton.current
        : homeGuide === 'book'
          ? bookButton.current
          : feedButton.current
    target?.focus({ preventScroll: true })
  }
  function openProfile() {
    if (homeGuide === 'growth') run({ type: 'tutorial', input: { homeGuide: 'book' } })
    setDialog({ type: 'profile' })
  }
  function startTutorial() {
    const start = () =>
      transitionScene(() => {
        setDialog(null)
        setToast('')
        setJourney(state.tutorial.status === 'completed' ? { type: 'tutorial', step: 0 } : null)
      })
    if (state.tutorial.status === 'completed') start()
    else run({ type: 'tutorial', input: { status: 'active' } }, start)
  }
  function pauseTutorial() {
    const pause = () =>
      transitionScene(() => {
        setJourney(null)
        navigate('room')
        restoreFeedFocus.current = true
      })
    if (journey?.type === 'tutorial') pause()
    else run({ type: 'tutorial', input: { status: 'paused' } }, pause)
  }
  const feedback = error && (
    <p role="alert" className="error-message">
      {error.message}{' '}
      <button className="quiet-button" disabled={busy} onClick={retry}>
        もう一度試す
      </button>
    </p>
  )
  if (!state.activeId)
    return (
      <>
        <StarterSelection
          busy={busy}
          onChoose={(id) =>
            run({ type: 'chooseStarter', id }, () => {
              setJourney(null)
              navigate('room')
            })
          }
        />
        {feedback}
      </>
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
          onStep={(step) => {
            if (journey?.type === 'tutorial')
              transitionScene(() => setJourney({ type: 'tutorial', step }))
            else run({ type: 'tutorial', input: { step } })
          }}
          onPause={pauseTutorial}
          onComplete={() => {
            const finish = () =>
              transitionScene(() => {
                setToast('')
                setJourney(null)
                navigate('room')
                restoreFeedFocus.current = true
              })
            if (journey?.type === 'tutorial') finish()
            else
              run(
                {
                  type: 'tutorial',
                  input: {
                    step: 4,
                    status: 'completed',
                    homeGuide: state.meals.length === 0 ? 'meal' : 'done',
                  },
                },
                finish,
              )
          }}
        />
        {feedback}
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
            onCommitted={(receipt, photo) =>
              transitionScene(() => setJourney({ type: 'feast', receipt, photo }))
            }
            onClose={finishJourney}
          />
        ) : journey.type === 'feast' ? (
          <FeastJourney receipt={journey.receipt} photo={journey.photo} onDone={finishJourney} />
        ) : null}
        {journey.type !== 'meal' && feedback}
      </>
    )
  return (
    <GameUiProvider
      value={{
        setDialog,
        petting,
        setPetting,
        openMeal,
        showFriends,
        showGrowthGuide,
        dismissHomeGuide,
        growthButton,
        openProfile,
        showMealGuide,
        feedButton,
        startTutorial,
        bookKind,
        setBookKind,
        navigate,
        run,
        shopKind,
        setShopKind,
      }}
    >
      <div className="play-app" data-home-guide={homeGuide}>
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
            <button
              aria-label={`コイン ${state.coins}枚、おみせへ`}
              onClick={() => navigate('shop')}
            >
              <Currency kind="coins" amount={state.coins} />
            </button>
            <button
              aria-label={`ジェム ${state.gems}個`}
              onClick={() => setDialog({ type: 'gems' })}
            >
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
          {feedback}
          <Outlet />
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
                aria-describedby={
                  id === 'book' && showBookGuide ? 'home-book-guide-text' : undefined
                }
                aria-current={
                  page === id || (id === 'book' && page === 'album') ? 'page' : undefined
                }
                onClick={() => {
                  if (id === 'book' && homeGuide === 'book') {
                    setBookKind('recipes')
                    run({ type: 'tutorial', input: { homeGuide: 'done' } })
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
    </GameUiProvider>
  )
}
export default App
