import { useEffect, useState } from 'react'
import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  Flame as FlameIcon,
  Images,
  Settings2,
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
import { cookedToday, recordMeal, freezeDay } from './domain'
import type { Meal, Recipe } from './domain'
import { loadState, saveState } from './storage'

type Dialog =
  | { type: 'recipe'; recipe: Recipe }
  | { type: 'record'; recipe?: Recipe }
  | { type: 'success' }
  | { type: 'meal'; meal: Meal }
  | { type: 'rest' | 'lab' | 'reminder' | 'about' | 'settings' }
const navItems = [
  { id: 'today' as const, label: '今日', icon: FlameIcon },
  { id: 'album' as const, label: '記録', icon: Images },
  { id: 'community' as const, label: '食卓', icon: Users },
]
function currentPage(): Page {
  const hash = window.location.hash.slice(1)
  return ['today', 'recipes', 'album', 'community'].includes(hash) ? (hash as Page) : 'today'
}

function App() {
  const [state, setState] = useState(loadState)
  const [page, setPage] = useState<Page>(currentPage)
  const [dialog, setDialog] = useState<Dialog | null>(() =>
    window.location.hash === '#lab' ? { type: 'lab' } : null,
  )
  const [storageError, setStorageError] = useState(false)
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
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function closeDialog() {
    setDialog(null)
    if (window.location.hash === '#lab') window.history.replaceState(null, '', `#${page}`)
  }
  function saveMeal(input: Omit<Meal, 'id' | 'day' | 'xp'>) {
    setState((s) => recordMeal(s, input))
    navigate('today')
    setDialog({ type: 'success' })
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
      <header className="app-header">
        <button className="brand" onClick={() => navigate('today')} aria-label="ひとさじ ホーム">
          <Flame />
          <strong>ひとさじ</strong>
        </button>
        <button
          className="icon-button"
          aria-label="設定"
          onClick={() => setDialog({ type: 'settings' })}
        >
          <Settings2 size={21} />
        </button>
      </header>
      <main id="main-content" className={`main-content ${page === 'today' ? 'home-content' : ''}`}>
        {storageError && (
          <div className="storage-error" role="alert">
            ブラウザに保存できません。再読み込みすると変更が失われます。
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
      </main>
      <nav className="main-nav" aria-label="メインナビゲーション">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'active' : ''}
            aria-current={page === item.id ? 'page' : undefined}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={21} strokeWidth={1.7} />
            <span>{item.label}</span>
          </button>
        ))}
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
      {dialog?.type === 'success' && <SuccessDialog state={state} onClose={closeDialog} />}
      {dialog?.type === 'rest' && (
        <RestDialog
          state={state}
          onClose={closeDialog}
          onConfirm={() => {
            setState((s) => freezeDay(s))
            closeDialog()
            setToast('今日の継続を守りました。')
          }}
        />
      )}
      {dialog?.type === 'meal' && <MealDialog meal={dialog.meal} onClose={closeDialog} />}
      {dialog?.type === 'lab' && (
        <LabDialog state={state} setState={setState} onClose={closeDialog} />
      )}
      {dialog?.type === 'settings' && (
        <Modal title="設定" onClose={closeDialog}>
          <div className="settings-menu">
            <button
              onClick={() => {
                closeDialog()
                navigate('recipes')
              }}
            >
              <BookOpen size={19} />
              献立ノート
              <ChevronRight size={17} />
            </button>
            <button onClick={() => setDialog({ type: 'reminder' })}>
              <Bell size={19} />
              おたより
              <ChevronRight size={17} />
            </button>
            <button onClick={() => setDialog({ type: 'about' })}>
              <CircleHelp size={19} />
              ひとさじについて
              <ChevronRight size={17} />
            </button>
            <button onClick={() => setDialog({ type: 'lab' })}>
              <FlaskConical size={19} />
              アイデアの実験室
              <ChevronRight size={17} />
            </button>
          </div>
        </Modal>
      )}
      {dialog?.type === 'reminder' && (
        <Modal title="おたより" onClose={closeDialog}>
          <div className="notification-content">
            <Flame />
            <h3>
              {cookedToday(state)
                ? '今日も、つづいたね。'
                : state.rests.includes(state.today)
                  ? 'ゆっくり休んで、また明日。'
                  : state.settings.reminder === 'gentle'
                    ? '今日の一皿、残しておこう。'
                    : '日付が変わる前に、あと一歩。'}
            </h3>
            <button className="button primary full" onClick={() => setDialog({ type: 'record' })}>
              一皿を残す
            </button>
            <small>アプリ内のおたよりです。</small>
          </div>
        </Modal>
      )}
      {dialog?.type === 'about' && (
        <Modal title="ひとさじについて" onClose={closeDialog}>
          <div className="about-content">
            <Flame />
            <h3>自炊を、つづける。</h3>
            <p>
              一皿つくって、写真を残す。
              <br />
              毎日の小さな積み重ねを、ここに。
            </p>
            <p className="about-local">
              写真と記録はこのブラウザに保存されます。食卓はサンプル表示で、ほかの利用者への送信はありません。
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
