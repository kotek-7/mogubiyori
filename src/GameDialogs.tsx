import { useEffect, useId, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Check, ChevronRight, Coins, Flame, Gem, HelpCircle, Moon, Sparkles, X } from 'lucide-react'
import { DishArt, GatheringScene, ItemArt, Pet } from './GameArt'
import {
  addDemoGems,
  advanceGame,
  demoGame,
  equipItem,
  fedToday,
  hungerOf,
  initialGame,
  items,
  growthProgress,
  stageName,
  recipes,
  stageOf,
  purchaseItem,
  restGame,
  shiftDay,
  streakOf,
  todayTokyo,
} from './game'
import type { GameMeal, GameState, GrowthStage, Item, SpeciesId } from './game'
import { RecipeDetail } from './CollectionScreens'
import { GrowthTrail } from './GrowthTrail'
import { companionFormDescription } from './CompanionArt'

export type Dialog =
  | { type: 'recipe'; recipeId: string }
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
  onRecord: (options?: { recipeId?: string; targetId?: SpeciesId }) => void
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

export function GameDialogs({
  dialog,
  state,
  setState,
  onClose,
  onNavigate,
  onToast,
  onRecord,
}: Props) {
  const [local, setLocal] = useState<Dialog>(dialog)
  const [reset, setReset] = useState<'seed' | 'fresh' | null>(null)
  const [returnItem, setReturnItem] = useState<Item | null>(null)
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  const [previewStage, setPreviewStage] = useState<GrowthStage | null>(null)
  const shownStage = previewStage ?? activeStage
  const activeSpecies = state.activeId ?? 'komugi'
  const activeFed = state.meals.some(
    (meal) => meal.day === state.today && meal.targetId === state.activeId,
  )
  const growth = growthProgress(active?.xp ?? 0)
  function close() {
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
    case 'recipe':
      title = recipes.find((recipe) => recipe.id === local.recipeId)?.name ?? 'レシピ'
      content = (
        <RecipeDetail
          recipeId={local.recipeId}
          state={state}
          onCook={() => onRecord({ recipeId: local.recipeId })}
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
            {item.kind === 'room' && <GatheringScene variant={item.id} />}
            <Pet
              species={activeSpecies}
              stage={activeStage}
              mood="happy"
              hat={item.kind === 'hat' ? item.id : state.equipped.hat}
            />
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
          <Pet
            species={activeSpecies}
            stage={shownStage}
            mood={activeFed ? 'happy' : 'hungry'}
            hat={state.equipped.hat}
          />
          <h3>{state.name}</h3>
          <span className="level-tag">
            {stageName(shownStage)} · {shownStage + 1}/5 の姿
          </span>
          <p className="profile-form-description" aria-live="polite">
            {companionFormDescription(activeSpecies, shownStage)}
          </p>
          <GrowthTrail
            species={activeSpecies}
            stage={activeStage}
            selected={shownStage}
            onSelect={setPreviewStage}
          />
          <p className="growth-discovery-hint">出会った姿をタップして、成長をふりかえろう。</p>
          <div
            className="meter"
            role="progressbar"
            aria-label="次の成長まで"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(growth.progress)}
          >
            <span style={{ width: `${growth.progress}%` }} />
          </div>
          <small>
            {activeStage < 4
              ? `今の姿は${stageName(activeStage)}。次の成長まで ${growth.remaining} XP`
              : '5つの姿に出会えたね。新しいなかまにも、ごはんを。'}
          </small>
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
          {!fedToday(state) && !state.rests.includes(state.today) && (
            <button className="quiet-button rest-link" onClick={() => setLocal({ type: 'rest' })}>
              <Moon size={15} />
              今日はおやすみ
              <span>チケット {state.tickets} 枚</span>
            </button>
          )}
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
          <Pet species={activeSpecies} stage={activeStage} mood="sleepy" hat={state.equipped.hat} />
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
          <Pet
            species={activeSpecies}
            stage={activeStage}
            mood={hungerOf(state) > 50 ? 'happy' : 'hungry'}
            hat={state.equipped.hat}
          />
          <span className="letter-date">今日</span>
          <h3>
            {activeFed
              ? 'おいしかったぁ！'
              : state.reminder === 'eager'
                ? 'ねえねえ、ごはんまだ〜？'
                : 'きょうのごはん、なにかなぁ。'}
          </h3>
          <p>{activeFed ? '明日もいっしょに、たべようね。' : 'いつもの一皿、まってるよ。'}</p>
          <div style={{ marginTop: 24 }}>{reminderControl()}</div>
          {!activeFed && (
            <button className="primary-button full" onClick={() => onRecord()}>
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
              <button onClick={() => setReset('seed')}>成長・出会いを体験</button>
              <button onClick={() => setReset('fresh')}>最初から育てる</button>
            </div>
            {reset && (
              <div className="reset-confirm">
                <p>
                  この端末の写真・育成記録を消して、
                  {reset === 'fresh' ? '最初から育てます。' : '成長・出会いを体験します。'}
                </p>
                <div className="reset-buttons">
                  <button onClick={() => setReset(null)}>やめる</button>
                  <button
                    onClick={() => {
                      setState(
                        reset === 'fresh'
                          ? initialGame(todayTokyo(), true)
                          : demoGame(todayTokyo()),
                      )
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
          <Pet species={activeSpecies} stage={activeStage} mood="happy" />
          <h3>あなたのごはんで、育っていく。</h3>
          <ol>
            <li>
              最初のなかまを選ぶ。<span>気になる子と、暮らしをはじめよう。</span>
            </li>
            <li>
              つくったごはんを分ける。<span>写真を届けると、すくすく成長。</span>
            </li>
            <li>
              お客さんとなかまになる。<span>大きく育つと、新しい子が遊びにくるよ。</span>
            </li>
            <li>
              料理のずかんを集める。<span>初めての料理は、カードとコインに。</span>
            </li>
          </ol>
          <p>
            同じ料理が続くと、成長はゆっくり。
            <br />
            ときどき、新しい一皿もつくってみよう。
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
