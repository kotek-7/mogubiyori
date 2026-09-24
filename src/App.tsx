import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Camera,
  Check,
  CircleHelp,
  FlaskConical,
  Flame as FlameIcon,
  House,
  Images,
  Leaf,
  Menu,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Flame } from './Illustrations'
import { Modal } from './components'
import { Album, Community, RecipesPage, Today } from './pages'
import type { Page } from './pages'
import {
  LabDialog,
  MealDialog,
  RecipeDialog,
  RecordDialog,
  RestDialog,
  SuccessDialog,
} from './dialogs'
import { cookedToday, recordMeal, rewardFor, streak, freezeDay, weeklyCount } from './domain'
import type { Meal, Recipe } from './domain'
import { loadState, saveState } from './storage'

type Dialog =
  | { type: 'recipe'; recipe: Recipe }
  | { type: 'record'; recipe?: Recipe }
  | { type: 'success'; xp: number; message: string }
  | { type: 'meal'; meal: Meal }
  | { type: 'rest' | 'lab' | 'reminder' | 'about' }
const navItems = [
  { id: 'today' as const, label: '今日のひとさじ', short: '今日', icon: House },
  { id: 'recipes' as const, label: '献立ノート', short: '献立', icon: BookOpen },
  { id: 'album' as const, label: '自炊アルバム', short: '記録', icon: Images },
  { id: 'community' as const, label: 'みんなの食卓', short: '食卓', icon: Users },
]
function currentPage(): Page {
  const hash = window.location.hash.slice(1)
  return navItems.some((n) => n.id === hash) ? (hash as Page) : 'today'
}

function App() {
  const [state, setState] = useState(loadState)
  const [page, setPage] = useState<Page>(currentPage)
  const [dialog, setDialog] = useState<Dialog | null>(() =>
    window.location.hash === '#lab' ? { type: 'lab' } : null,
  )
  const [storageError, setStorageError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  useEffect(() => {
    // Storage is an external system; its failure must be visible to the user.
    // oxlint-disable-next-line react/set-state-in-effect
    setStorageError(!saveState(state))
  }, [state])
  useEffect(() => {
    const handle = () => {
      setPage(currentPage())
      if (window.location.hash === '#lab') setDialog({ type: 'lab' })
    }
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timeout)
  }, [toast])
  function navigate(next: Page) {
    setPage(next)
    window.location.hash = next
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function closeDialog() {
    setDialog(null)
    if (window.location.hash === '#lab') window.history.replaceState(null, '', `#${page}`)
  }
  function saveMeal(input: Omit<Meal, 'id' | 'day' | 'xp'>) {
    const reward = rewardFor(state, input.category)
    setState((s) => recordMeal(s, input))
    setDialog({ type: 'success', xp: reward.xp, message: reward.label })
  }
  const pageProps = {
    state,
    setState,
    onRecipe: (recipe: Recipe) => setDialog({ type: 'recipe', recipe }),
    onRecord: (recipe?: Recipe) => setDialog({ type: 'record', recipe }),
    onRest: () => setDialog({ type: 'rest' }),
    onPage: navigate,
    onMeal: (meal: Meal) => setDialog({ type: 'meal', meal }),
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        本文へスキップ
      </a>
      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="メニューを閉じる"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button className="brand" onClick={() => navigate('today')} aria-label="ひとさじ ホーム">
          <span className="brand-icon">
            <Flame />
          </span>
          <span>
            <strong>ひとさじ</strong>
            <small>HITOSAJI</small>
          </span>
        </button>
        <span className="brand-tagline">自炊に、ちいさな火を。</span>
        <div className="nav-caption">YOUR KITCHEN</div>
        <nav className="desktop-nav" aria-label="メインナビゲーション">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} strokeWidth={1.7} />
              <span>{item.label}</span>
              {page === item.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <Flame />
            <p>
              きょうの自分に、
              <br />
              ひとさじのやさしさを。
            </p>
            <span>ONE MEAL AT A TIME.</span>
          </div>
          <button className="utility-nav" onClick={() => setDialog({ type: 'about' })}>
            <CircleHelp size={17} />
            ひとさじについて
            <ArrowUpRight size={14} />
          </button>
          <button className="utility-nav lab-link" onClick={() => setDialog({ type: 'lab' })}>
            <FlaskConical size={17} />
            アイデアの実験室
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-footer">
            <span className="green-dot" />
            LOCAL PREVIEW <span>v0.1</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="メニューを開く"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={21} />
            </button>
            <Leaf size={16} />
            <span>わたしのキッチン</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{navItems.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="header-streak">
              <FlameIcon size={17} fill="currentColor" />
              {state.settings.habit === 'weekly' ? weeklyCount(state) : streak(state)}
              <span>{state.settings.habit === 'weekly' ? '日 / 週' : '日'}</span>
            </span>
            <button
              className="icon-button notification-button"
              aria-label="お知らせ"
              onClick={() => setDialog({ type: 'reminder' })}
            >
              <Bell size={19} />
              {!cookedToday(state) && <i />}
            </button>
            <span className="topbar-divider" />
            <span className="user-avatar">ひ</span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {storageError && (
            <div className="storage-error" role="alert">
              保存容量が足りないか、ブラウザの保存が無効です。今の操作はできますが、再読み込みすると変更が失われます。
            </div>
          )}
          {page === 'today' ? (
            <Today {...pageProps} />
          ) : page === 'recipes' ? (
            <RecipesPage {...pageProps} />
          ) : page === 'album' ? (
            <Album {...pageProps} />
          ) : (
            <Community {...pageProps} />
          )}
          <footer className="page-footer">
            <span>ひとさじ</span>
            <p>がんばりすぎず、つくりつづける。</p>
            <span className="footer-flower">✳</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'active' : ''}
            aria-current={page === item.id ? 'page' : undefined}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={20} />
            <span>{item.short}</span>
          </button>
        ))}
        <button onClick={() => setDialog({ type: 'record' })}>
          <span className="mobile-camera">
            <Camera size={19} />
          </span>
          <span>残す</span>
        </button>
      </nav>
      {dialog?.type === 'recipe' && (
        <RecipeDialog
          key={dialog.recipe.id}
          state={state}
          recipe={dialog.recipe}
          onClose={closeDialog}
          onRecord={() => setDialog({ type: 'record', recipe: dialog.recipe })}
        />
      )}
      {dialog?.type === 'record' && (
        <RecordDialog
          state={state}
          recipe={dialog.recipe}
          onClose={closeDialog}
          onSave={saveMeal}
        />
      )}
      {dialog?.type === 'success' && (
        <SuccessDialog
          state={state}
          xp={dialog.xp}
          message={dialog.message}
          onClose={closeDialog}
          onCommunity={() => {
            closeDialog()
            navigate('community')
          }}
        />
      )}
      {dialog?.type === 'rest' && (
        <RestDialog
          state={state}
          onClose={closeDialog}
          onConfirm={() => {
            setState((s) => freezeDay(s))
            closeDialog()
            setToast('おやすみチケットで、今日の火を守りました。')
          }}
        />
      )}
      {dialog?.type === 'meal' && <MealDialog meal={dialog.meal} onClose={closeDialog} />}
      {dialog?.type === 'lab' && (
        <LabDialog state={state} setState={setState} onClose={closeDialog} />
      )}
      {dialog?.type === 'reminder' && (
        <Modal title="ひとさじからのおたより" onClose={closeDialog}>
          <div className="notification-content">
            <Flame />
            <span className="eyebrow">TODAY'S LITTLE NUDGE</span>
            <h3>
              {cookedToday(state)
                ? '今日の一皿、ちゃんと見届けたよ。'
                : state.rests.includes(state.today)
                  ? '今日はゆっくり、また明日。'
                  : state.settings.reminder === 'gentle'
                    ? '今日は一品だけ、どう？'
                    : '今日の記録は、まだみたい。'}
            </h3>
            <p>
              {cookedToday(state)
                ? '積み重ねた「つくれた」は、あなたの力。明日も自分のペースで。'
                : state.rests.includes(state.today)
                  ? 'おやすみチケットで、継続の火は守られているよ。'
                  : state.settings.reminder === 'gentle'
                    ? '5分でできるごはんがあるよ。小さな一歩から、はじめてみよう。'
                    : '日付が変わる前に、今日の一皿を記録して継続の火を灯そう！'}
            </p>
            <button
              className="button primary full"
              onClick={() => {
                closeDialog()
                navigate(cookedToday(state) ? 'album' : 'recipes')
              }}
            >
              {cookedToday(state) ? '自分のあしあとを見る' : '作れそうな一品を探す'}
              <ArrowUpRight size={17} />
            </button>
            <small>アプリ内のおたよりです。端末への通知は送信されません。</small>
          </div>
        </Modal>
      )}
      {dialog?.type === 'about' && (
        <Modal title="自炊に、ちいさな火を。" onClose={closeDialog}>
          <div className="about-content">
            <Flame />
            <h3>ひとさじ</h3>
            <p>
              何を作るか迷う日も、
              <br />
              いつもと同じごはんになる日も。
              <br />
              自分のために作る、小さな一歩を。
            </p>
            <div className="about-promises">
              <span>
                <Sparkles size={19} />
                いまの余裕で作れる一品を見つける
              </span>
              <span>
                <Camera size={19} />
                写真1枚から「つくれた」を残す
              </span>
              <span>
                <FlameIcon size={19} />
                小さな積み重ねを、自信に変える
              </span>
            </div>
            <p className="about-local">
              このプレビューは、あなたのブラウザだけで動きます。料理の記録と写真は端末内に保存され、ほかの利用者には送信されません。みんなの食卓にはサンプルの投稿が含まれます。
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="通知を閉じる" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
