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
  levelOf,
  mealXp,
  recipes,
  species,
  stageOf,
  purchaseItem,
  restGame,
  shiftDay,
  streakOf,
  todayTokyo,
} from './game'
import type { FeedInput, GameMeal, GameState, Item, SpeciesId } from './game'
import { resizePhoto } from './photo'
import { RecipeDetail } from './CollectionScreens'

export type Dialog =
  | { type: 'record'; recipeId?: string; targetId?: SpeciesId }
  | { type: 'recipe'; recipeId: string }
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
  onFeed: (input: FeedInput) => void
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

function Record({
  state,
  onFeed,
  recipeId: initialRecipeId,
  targetId,
}: Pick<Props, 'state' | 'onFeed'> & { recipeId?: string; targetId?: SpeciesId }) {
  const input = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string>()
  const [recipeId, setRecipeId] = useState(initialRecipeId ?? '')
  const recipe = recipes.find((entry) => entry.id === recipeId)
  const [sampleMode, setSampleMode] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const target = targetId ?? state.activeId
  const buddy = state.companions.find((entry) => entry.id === target)
  const targetName = species.find((entry) => entry.id === target)?.name ?? 'ともだち'
  const ready = !!photo || sampleMode
  const xp = mealXp(state, recipeId || undefined, target ?? undefined)
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
        if (ready && !loading && target)
          onFeed({
            title: title.trim() || recipe?.name || '今日のごはん',
            photo,
            sample: recipe?.sample ?? 'rice',
            recipeId: recipeId || undefined,
            targetId: target,
          })
        else input.current?.click()
      }}
    >
      <div className="record-buddy">
        <Pet species={target ?? 'komugi'} stage={stageOf(buddy?.xp ?? 0)} mood="hungry" />
        <p>{targetName}にも、ひとくち。</p>
      </div>
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
          <DishArt kind={recipe?.sample ?? 'rice'} />
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
      <label className="field recipe-choice">
        つくった料理
        <select value={recipeId} onChange={(event) => setRecipeId(event.target.value)}>
          <option value="">いつものごはん</option>
          {recipes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      {xp < 45 && <p className="repeat-hint">同じごはんが続いているので、今回は +{xp} XP。</p>}
      {ready && (
        <details className="record-details">
          <summary>料理名をつける</summary>
          <label className="field">
            料理名（任意）
            <input
              value={title}
              maxLength={40}
              placeholder={recipe?.name ?? '今日のごはん'}
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
      <button type="submit" className="primary-button full" disabled={loading || !target}>
        {loading ? '写真を準備しています…' : ready ? `${targetName}にごはんをあげる` : '写真を選ぶ'}
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
  const meal = after.meals[0]
  const targetId = meal.targetId ?? after.activeId ?? 'komugi'
  const target = after.companions.find((entry) => entry.id === targetId)
  const previous = before.companions.find((entry) => entry.id === targetId)
  const stage = stageOf(target?.xp ?? 0)
  const previousStage = stageOf(previous?.xp ?? 0)
  const grew = !!previous && stage > previousStage
  const recruited = !!target && !previous
  const buddyName = species.find((entry) => entry.id === targetId)?.name ?? after.name
  const gift = !before.owned.includes('sprout') && after.owned.includes('sprout')
  const cards = recipes.filter(
    (recipe) => after.cards.includes(recipe.id) && !before.cards.includes(recipe.id),
  )
  const arrivals = after.visitors.filter((id) => !before.visitors.includes(id))
  return (
    <div
      className={`feast ${eating ? 'is-eating' : ''} ${grew && !eating ? 'has-evolved' : ''}`}
      aria-live="polite"
    >
      <div className="feast-art">
        <Pet
          species={targetId}
          stage={eating ? previousStage : stage}
          mood={eating ? 'eating' : 'happy'}
          hat={after.equipped.hat}
        />
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
          {grew && (
            <span className="level-tag evolution-tag">
              {stage === 2 ? 'おとなに成長！' : 'すくすく成長！'}
            </span>
          )}
          <h3>
            {recruited ? (
              <>
                {buddyName}が<br />
                なかまになった！
              </>
            ) : grew ? (
              <>
                {buddyName}が<br />
                大きくなった！
              </>
            ) : (
              <>
                おいしかったぁ。
                <br />
                ごちそうさま！
              </>
            )}
          </h3>
          <div className="feast-rewards">
            <span>
              <Sparkles size={15} />+{meal.xp} XP
            </span>
            <span>
              <Coins size={15} />
              合計 +{meal.coins} コイン
            </span>
            <span>
              <Heart size={15} />
              おなかいっぱい
            </span>
          </div>
          {!!meal.streakBonus && (
            <p className="bonus-note">
              {streakOf(after)}日継続のお祝い +{meal.streakBonus} コイン
            </p>
          )}
          <div className="streak-result">
            <Flame size={24} />
            <strong>{streakOf(after)}日つづいた！</strong>
          </div>
          {cards.map((card) => (
            <div className={`new-recipe-card rarity-${card.rarity}`} key={card.id}>
              <DishArt kind={card.sample} />
              <div>
                <small>はじめてつくった！</small>
                <strong>{card.name}</strong>
                <span>レシピカード +{card.reward} コイン</span>
              </div>
              <Sparkles size={20} />
            </div>
          ))}
          {arrivals.length > 0 && (
            <div className="visitor-arrival">
              <div className="arrival-pets">
                {arrivals.map((id) => (
                  <Pet key={id} species={id} stage={0} mood="hungry" />
                ))}
              </div>
              <strong>おいしそうなにおいに、お客さんが！</strong>
              <small>ごはんを分けると、なかまになるかも。</small>
            </div>
          )}
          {gift && (
            <div className="new-gift">
              <ItemArt id="sprout" />
              <div>
                <small>7日のおくりもの</small>
                <strong>ふたばのかんむり</strong>
              </div>
              <Gift size={18} />
            </div>
          )}
          <button className="primary-button full" onClick={onClose}>
            {gift ? 'かぶって、ひろばへ' : arrivals.length ? 'お客さんに会いにいく' : 'ひろばへ'}
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
  const [reset, setReset] = useState<'seed' | 'fresh' | null>(null)
  const [returnItem, setReturnItem] = useState<Item | null>(null)
  const level = levelOf(state)
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  const activeSpecies = state.activeId ?? 'komugi'
  const activeFed = state.meals.some(
    (meal) => meal.day === state.today && meal.targetId === state.activeId,
  )
  const growthProgress =
    activeStage === 2
      ? 100
      : (((active?.xp ?? 0) - (activeStage === 0 ? 0 : 45)) / (activeStage === 0 ? 45 : 75)) * 100
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
    case 'record':
      title = '今日のごはん'
      content = (
        <Record state={state} onFeed={onFeed} recipeId={local.recipeId} targetId={local.targetId} />
      )
      break
    case 'recipe':
      title = recipes.find((recipe) => recipe.id === local.recipeId)?.name ?? 'レシピ'
      content = (
        <RecipeDetail
          recipeId={local.recipeId}
          state={state}
          onCook={() => setLocal({ type: 'record', recipeId: local.recipeId })}
        />
      )
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
            stage={activeStage}
            mood={activeFed ? 'happy' : 'hungry'}
            hat={state.equipped.hat}
          />
          <h3>{state.name}</h3>
          <span className="level-tag">
            {activeStage === 2 ? 'おとな' : activeStage === 1 ? 'すくすく' : 'ちびっこ'} · Lv.
            {level.level}
          </span>
          <p>
            あなたのごはんが大好き。
            <br />
            いっしょに、すこしずつ育っていこう。
          </p>
          <div
            className="meter"
            role="progressbar"
            aria-label="次の成長まで"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(growthProgress)}
          >
            <span style={{ width: `${growthProgress}%` }} />
          </div>
          <small>
            {activeStage < 2
              ? `次の成長まで ${(activeStage === 0 ? 45 : 120) - (active?.xp ?? 0)} XP`
              : 'すっかり大きくなったね。新しいなかまにも、ごはんを。'}
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
