import { useEffect, useId, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  Camera,
  Check,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Gift,
  Heart,
  HelpCircle,
  Moon,
  Sparkles,
  X,
} from 'lucide-react'
import { DishArt, ItemArt, Pet, RoomScene } from './GameArt'
import {
  addDemoGems,
  advanceGame,
  equipItem,
  fedToday,
  hungerOf,
  initialGame,
  items,
  levelOf,
  purchaseItem,
  restGame,
  shiftDay,
  streakOf,
  todayTokyo,
} from './game'
import type { GameMeal, GameState, Item } from './game'
import { resizePhoto } from './photo'

export type Dialog =
  | { type: 'record' }
  | { type: 'feast'; before: GameState; after: GameState }
  | { type: 'meal'; meal: GameMeal }
  | { type: 'item'; item: Item }
  | { type: 'settings' | 'profile' | 'streak' | 'gems' | 'rest' | 'letters' | 'help' }

type Props = {
  dialog: Dialog
  state: GameState
  setState: Dispatch<SetStateAction<GameState>>
  onClose: () => void
  onNavigate: (page: 'room' | 'album' | 'shop') => void
  onToast: (text: string) => void
  onFeed: (input: { title: string; photo?: string; sample: string }) => void
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const element = ref.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose()
        }
      }}
    >
      <header className="sheet-header">
        <h2 id={id}>{title}</h2>
        <button type="button" className="icon-button" aria-label="閉じる" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="sheet-body">{children}</div>
    </dialog>
  )
}

function Currency({ kind, amount }: { kind: 'coins' | 'gems'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      {kind === 'coins' ? <Coins size={18} /> : <Gem size={18} />}
      <strong>{amount.toLocaleString()}</strong>
      <span className="sr-only">{kind === 'coins' ? 'コイン' : 'ジェム'}</span>
    </span>
  )
}

function Record({ state, onFeed }: Pick<Props, 'state' | 'onFeed'>) {
  const input = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string>()
  const [sample, setSample] = useState('rice')
  const [sampleMode, setSampleMode] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ready = !!photo || sampleMode
  async function select(file?: File) {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      setPhoto(await resizePhoto(file))
      setSampleMode(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : '写真を読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (ready && !loading) onFeed({ title: title.trim() || '今日のごはん', photo, sample })
        else input.current?.click()
      }}
    >
      <p className="sheet-lead">今日の一皿を、{state.name}にも。</p>
      <label className={`photo-picker ${ready ? 'has-photo' : ''}`}>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          aria-label="料理の写真"
          disabled={loading}
          onChange={(event) => {
            void select(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {photo ? (
          <img src={photo} alt="今日の料理" />
        ) : sampleMode ? (
          <DishArt kind={sample} />
        ) : (
          <>
            <span className="camera-circle">
              <Camera size={30} />
            </span>
            <strong>{loading ? '写真を準備しています…' : '料理の写真を選ぶ'}</strong>
            <small>いつもの一皿で、だいじょうぶ。</small>
          </>
        )}
        {ready && (
          <span className="change-photo">
            <Camera size={14} />
            写真を変える
          </span>
        )}
      </label>
      {!ready && (
        <button
          type="button"
          className="sample-start"
          onClick={() => {
            setSampleMode(true)
            setError('')
          }}
        >
          写真なしで体験する
        </button>
      )}
      {sampleMode && (
        <div className="sample-options" role="group" aria-label="体験する料理">
          {[
            { id: 'rice', name: 'たまごごはん' },
            { id: 'soup', name: 'ほっとスープ' },
            { id: 'pasta', name: 'トマトパスタ' },
          ].map((dish) => (
            <button
              type="button"
              key={dish.id}
              aria-pressed={sample === dish.id}
              onClick={() => setSample(dish.id)}
            >
              <DishArt kind={dish.id} />
              <span>{dish.name}</span>
            </button>
          ))}
        </div>
      )}
      {ready && (
        <details className="record-details">
          <summary>料理名をつける</summary>
          <label className="field">
            料理名（任意）
            <input
              value={title}
              maxLength={40}
              placeholder="今日のごはん"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </details>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button full" disabled={loading}>
        {loading ? '写真を準備しています…' : ready ? `${state.name}にごはんをあげる` : '写真を選ぶ'}
      </button>
      <small className="privacy-note">写真はこの端末に保存されます。</small>
    </form>
  )
}

function Feast({
  before,
  after,
  onClose,
}: {
  before: GameState
  after: GameState
  onClose: () => void
}) {
  const [eating, setEating] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setEating(false), 1800)
    return () => window.clearTimeout(timer)
  }, [])
  const level = levelOf(after)
  const gift = !before.owned.includes('sprout') && after.owned.includes('sprout')
  const meal = after.meals[0]
  return (
    <div className={`feast ${eating ? 'is-eating' : ''}`} aria-live="polite">
      <div className="feast-art">
        <Pet mood={eating ? 'eating' : 'happy'} hat={after.equipped.hat} />
        <div className="feast-dish">
          {meal.photo ? <img src={meal.photo} alt="" /> : <DishArt kind={meal.sample} />}
        </div>
        <span className="floating-heart one" aria-hidden="true">
          ♥
        </span>
        <span className="floating-heart two" aria-hidden="true">
          ♥
        </span>
      </div>
      {eating ? (
        <h3>もぐもぐ…</h3>
      ) : (
        <>
          <span className="level-tag">
            {level.level > levelOf(before).level ? 'LEVEL UP! ' : ''}Lv.{level.level}
          </span>
          <h3>
            おいしかったぁ。
            <br />
            ごちそうさま！
          </h3>
          <div className="feast-rewards">
            <span>
              <Sparkles size={15} />+{after.xp - before.xp} XP
            </span>
            <span>
              <Coins size={15} />+{after.coins - before.coins} コイン
            </span>
            <span>
              <Heart size={15} />
              おなかいっぱい
            </span>
          </div>
          <div className="streak-result">
            <Flame size={24} />
            <strong>{streakOf(after)}日つづいた！</strong>
          </div>
          {gift && (
            <div className="new-gift">
              <ItemArt id="sprout" />
              <div>
                <small>7日のおくりもの</small>
                <strong>{items.find((item) => item.id === 'sprout')?.name}</strong>
              </div>
              <Gift size={18} />
            </div>
          )}
          <button className="primary-button full" onClick={onClose}>
            {gift ? 'かぶって、おへやへ' : 'おへやに戻る'}
          </button>
        </>
      )}
    </div>
  )
}

export function GameDialogs({
  dialog,
  state,
  setState,
  onClose,
  onNavigate,
  onToast,
  onFeed,
}: Props) {
  const [local, setLocal] = useState<Dialog>(dialog)
  const [name, setName] = useState(state.name)
  const [reset, setReset] = useState<'seed' | 'fresh' | null>(null)
  const [returnItem, setReturnItem] = useState<Item | null>(null)
  const level = levelOf(state)
  function close() {
    if (local.type === 'settings') {
      const nextName = name.trim()
      if (nextName && nextName !== state.name)
        setState((current) => ({ ...current, name: nextName }))
    }
    onClose()
  }
  function leave(page: 'room' | 'album' | 'shop') {
    onNavigate(page)
    close()
  }
  function changeReminder(reminder: GameState['reminder']) {
    setState((current) => ({ ...current, reminder }))
  }
  function reminderControl() {
    return (
      <fieldset className="reminder-setting">
        <legend>ごはんのおねだり</legend>
        <div className="segmented">
          <button
            type="button"
            aria-pressed={state.reminder === 'gentle'}
            onClick={() => changeReminder('gentle')}
          >
            ひかえめ
          </button>
          <button
            type="button"
            aria-pressed={state.reminder === 'eager'}
            onClick={() => changeReminder('eager')}
          >
            ぐいぐい
          </button>
        </div>
      </fieldset>
    )
  }
  let title = ''
  let content: ReactNode
  switch (local.type) {
    case 'record':
      title = '今日のごはん'
      content = <Record state={state} onFeed={onFeed} />
      break
    case 'feast':
      title = `${state.name}のごはん時間`
      content = (
        <Feast
          before={local.before}
          after={local.after}
          onClose={() => {
            if (!local.before.owned.includes('sprout') && local.after.owned.includes('sprout'))
              setState((current) => equipItem(current, 'sprout'))
            close()
          }}
        />
      )
      break
    case 'meal':
      title = local.meal.title
      content = (
        <div className="meal-view">
          <div className="meal-view-art">
            {local.meal.photo ? (
              <img src={local.meal.photo} alt={local.meal.title} />
            ) : (
              <DishArt kind={local.meal.sample} />
            )}
          </div>
          <p>
            {new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(
              new Date(`${local.meal.day}T12:00:00+09:00`),
            )}
            のごはん
          </p>
          <div className="meal-rewards">
            <span>
              <Sparkles size={18} />+{local.meal.xp} XP
            </span>
            <span>
              <Coins size={18} />+{local.meal.coins}
            </span>
          </div>
          <button className="secondary-button full" onClick={close}>
            おいしい思い出をしまう
          </button>
        </div>
      )
      break
    case 'item': {
      const item = local.item
      const owned = state.owned.includes(item.id)
      const equipped = state.equipped[item.kind] === item.id
      const enough = state[item.currency] >= item.price
      title = item.name
      content = (
        <div className="item-detail">
          <div className="item-preview">
            {item.kind === 'room' && <RoomScene variant={item.id} />}
            <Pet mood="happy" hat={item.kind === 'hat' ? item.id : state.equipped.hat} />
          </div>
          <p>{item.description}</p>
          {!owned && (
            <div className="purchase-price">
              <Currency kind={item.currency} amount={item.price} />
              <small>持っている数 {state[item.currency]}</small>
            </div>
          )}
          <button
            className="primary-button full"
            disabled={equipped || (!owned && !enough && item.currency === 'coins')}
            onClick={() => {
              if (!owned && !enough) {
                setReturnItem(item)
                setLocal({ type: 'gems' })
                return
              }
              setState((current) =>
                owned ? equipItem(current, item.id) : purchaseItem(current, item.id),
              )
              onToast(`${item.name}におきがえしたよ`)
              leave('room')
            }}
          >
            {equipped
              ? 'いま使っています'
              : owned
                ? 'これにおきがえ'
                : enough
                  ? '手に入れて、おきがえ'
                  : item.currency === 'gems'
                    ? 'ジェムを追加する'
                    : 'コインが足りません'}
          </button>
          <small className="purchase-hint">
            {!owned && !enough && item.currency === 'coins'
              ? '今日のごはんで、コインを集めよう。'
              : item.kind === 'hat'
                ? `${state.name}に、ちいさなおめかし。`
                : 'いつものごはんが、もっと楽しみに。'}
          </small>
        </div>
      )
      break
    }
    case 'gems':
      title = 'ジェムのお店'
      content = (
        <div className="gem-sheet">
          <div className="gem-pile">
            <Gem size={77} />
            <Sparkles size={23} />
          </div>
          <h3>150 ジェム</h3>
          <p>お気に入りのおめかしを。</p>
          <div className="gem-price">
            ¥320<small>価格イメージ</small>
          </div>
          <button
            className="primary-button full"
            onClick={() => {
              setState(addDemoGems)
              onToast('150ジェムを受け取りました')
              if (returnItem) setLocal({ type: 'item', item: returnItem })
              else close()
            }}
          >
            購入を体験する
          </button>
          <small>
            おためしのため、請求はありません。
            <br />
            ジェムはこの端末だけに追加されます。
          </small>
        </div>
      )
      break
    case 'profile':
      title = `${state.name}のこと`
      content = (
        <div className="profile-sheet">
          <Pet mood={fedToday(state) ? 'happy' : 'hungry'} hat={state.equipped.hat} />
          <h3>{state.name}</h3>
          <span className="level-tag">Lv.{level.level}</span>
          <p>
            あなたのごはんが大好き。
            <br />
            いっしょに、すこしずつ育っていこう。
          </p>
          <div
            className="meter"
            role="progressbar"
            aria-label="次のレベルまで"
            aria-valuemin={0}
            aria-valuemax={level.needed}
            aria-valuenow={level.progress}
          >
            <span style={{ width: `${level.progress}%` }} />
          </div>
          <small>次のレベルまで {level.needed - level.progress} XP</small>
          <button className="secondary-button full" onClick={() => leave('shop')}>
            おめかしを選ぶ
          </button>
        </div>
      )
      break
    case 'streak':
      title = 'いっしょにごはん'
      content = (
        <div className="streak-sheet">
          <div className="big-streak">
            <Flame size={36} />
            <strong>{streakOf(state)}</strong>
            <span>日連続</span>
          </div>
          <p>一皿ずつ、ふたりの毎日になる。</p>
          <div className="streak-week">
            {Array.from({ length: 7 }, (_, index) => {
              const day = shiftDay(state.today, index - 6)
              const cooked = state.meals.some((meal) => meal.day === day)
              const rested = state.rests.includes(day)
              return (
                <div
                  key={day}
                  aria-label={`${day} ${cooked ? 'ごはんをあげた' : rested ? 'おやすみ' : 'まだ'}`}
                >
                  <small>
                    {new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(
                      new Date(`${day}T12:00:00+09:00`),
                    )}
                  </small>
                  <span className={cooked ? 'cooked' : rested ? 'rested' : ''}>
                    {cooked ? (
                      <Check size={17} />
                    ) : rested ? (
                      <Moon size={15} />
                    ) : (
                      <i className="day-dot" />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="streak-gift">
            <ItemArt id="sprout" />
            <div>
              <small>7日のおくりもの</small>
              <strong>{items.find((item) => item.id === 'sprout')?.name}</strong>
              <span>
                {state.owned.includes('sprout')
                  ? '受け取り済み'
                  : `あと ${Math.max(0, 7 - streakOf(state))} 日`}
              </span>
            </div>
          </div>
          <button className="secondary-button full" onClick={close}>
            また一皿、つづけよう
          </button>
        </div>
      )
      break
    case 'rest': {
      const already = state.rests.includes(state.today)
      title = '今日はひとやすみ'
      content = (
        <div className="rest-sheet">
          <Pet mood="sleepy" hat={state.equipped.hat} />
          <p>
            つくれない日は、休んでもいい。
            <br />
            連続日数を守って、明日につなごう。
          </p>
          <span className="rest-tickets">おやすみチケット　あと {state.tickets} 枚</span>
          <button
            className="primary-button full"
            disabled={already || state.tickets === 0 || fedToday(state)}
            onClick={() => {
              setState((current) =>
                restGame({ ...current, today: shiftDay(todayTokyo(), current.dayOffset) }),
              )
              onToast('今日はのんびり。また明日。')
              close()
            }}
          >
            {already
              ? '今日はおやすみ中'
              : fedToday(state)
                ? '今日はごはんを食べました'
                : state.tickets === 0
                  ? 'チケットがありません'
                  : 'チケットを使って休む'}
          </button>
          <small className="privacy-note">お腹は空いたまま。次のごはんを待っています。</small>
        </div>
      )
      break
    }
    case 'letters':
      title = `${state.name}からのおたより`
      content = (
        <div className="letter-sheet">
          <Pet mood={hungerOf(state) > 50 ? 'happy' : 'hungry'} hat={state.equipped.hat} />
          <span className="letter-date">今日</span>
          <h3>
            {fedToday(state)
              ? 'おいしかったぁ！'
              : state.reminder === 'eager'
                ? 'ねえねえ、ごはんまだ〜？'
                : 'きょうのごはん、なにかなぁ。'}
          </h3>
          <p>{fedToday(state) ? '明日もいっしょに、たべようね。' : 'いつもの一皿、まってるよ。'}</p>
          <div style={{ marginTop: 24 }}>{reminderControl()}</div>
          {!fedToday(state) && (
            <button className="primary-button full" onClick={() => setLocal({ type: 'record' })}>
              ごはんをあげる
            </button>
          )}
          <small>おねだりはアプリを開いている間に届きます。</small>
        </div>
      )
      break
    case 'settings':
      title = '設定'
      content = (
        <div className="settings-sheet">
          <label className="field">
            なまえ
            <input
              aria-label="なまえ"
              maxLength={12}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => {
                const nextName = name.trim()
                if (nextName) setState((current) => ({ ...current, name: nextName }))
                else setName(state.name)
              }}
            />
          </label>
          {reminderControl()}
          <button className="settings-row" onClick={() => setLocal({ type: 'help' })}>
            <HelpCircle size={17} />
            あそびかた
            <ChevronRight size={16} />
          </button>
          <details className="playground">
            <summary>おためし設定</summary>
            <p>時間を進めて、お腹や連続日数の変化を体験。</p>
            <button
              className="secondary-button full"
              onClick={() => {
                setState(advanceGame)
                onToast('翌日になりました')
                leave('room')
              }}
            >
              翌日に進む
            </button>
            <div className="reset-buttons">
              <button onClick={() => setReset('seed')}>6日目から体験</button>
              <button onClick={() => setReset('fresh')}>最初から育てる</button>
            </div>
            {reset && (
              <div className="reset-confirm">
                <p>
                  この端末の写真・育成記録を消して、{reset === 'fresh' ? '最初' : '6日目'}
                  から始めます。
                </p>
                <div className="reset-buttons">
                  <button onClick={() => setReset(null)}>やめる</button>
                  <button
                    onClick={() => {
                      setState(initialGame(todayTokyo(), reset === 'fresh'))
                      onToast('新しい毎日がはじまります')
                      onNavigate('room')
                      onClose()
                    }}
                  >
                    記録を消して始める
                  </button>
                </div>
              </div>
            )}
          </details>
          <p className="settings-note">
            記録はこのブラウザーに保存されます。
            <br />
            写真の判定や端末へのプッシュ通知は行いません。
          </p>
        </div>
      )
      break
    case 'help':
      title = 'あそびかた'
      content = (
        <div className="help-sheet">
          <Pet mood="happy" />
          <h3>あなたのごはんで、育っていく。</h3>
          <ol>
            <li>
              自分のために、一皿つくる。<span>いつもの簡単なごはんでOK。</span>
            </li>
            <li>
              写真を撮って、ごはんをあげる。<span>{state.name}がお腹いっぱいに。</span>
            </li>
            <li>
              また明日、いっしょに食べる。<span>毎日のごはんで育ち、コインも集まります。</span>
            </li>
          </ol>
          <p>
            成長とコインのごほうびは、1日1回。
            <br />
            アイテムでおめかししても、お腹は満たされません。
          </p>
        </div>
      )
      break
  }
  return (
    <Sheet title={title} onClose={close}>
      {content}
    </Sheet>
  )
}
