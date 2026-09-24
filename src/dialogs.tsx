import { useRef, useState } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Download,
  EyeOff,
  Leaf,
  LockKeyhole,
  RotateCcw,
  Snowflake,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react'
import { Modal, Segmented } from './components'
import { FoodArt, Flame } from './Illustrations'
import {
  advanceDay,
  categories,
  dayLabel,
  initialState,
  recipes,
  streak,
  todayInTokyo,
  weeklyCount,
} from './domain'
import type { AppState, Meal, Recipe, Settings } from './domain'
import { resizePhoto } from './storage'
import { RecentDates } from './pages'
import type { Dispatch, SetStateAction } from 'react'

export function RecipeDialog({
  recipe,
  state,
  onClose,
  onRecord,
}: {
  recipe: Recipe
  state: AppState
  onClose: () => void
  onRecord: () => void
}) {
  const [steps, setSteps] = useState<number[]>([])
  const missing = recipe.ingredients.filter((i) => !state.pantry.includes(i.name))
  return (
    <Modal title={recipe.name} onClose={onClose} wide>
      <div className="recipe-detail-top">
        <div className="detail-art" style={{ background: recipe.color }}>
          <FoodArt recipe={recipe} />
        </div>
        <div className="detail-intro">
          <span className="soft-badge">
            <Leaf size={13} />
            {recipe.category}
          </span>
          <h3>{recipe.subtitle}</h3>
          <div className="hero-meta">
            <span>
              <Clock3 size={15} />
              {recipe.minutes}分
            </span>
            <span>
              <Utensils size={15} />
              1人分
            </span>
          </div>
          <p>
            {missing.length
              ? `買い足すもの：${missing.map((i) => i.name).join('、')}`
              : '登録している食材で作れます。'}
            <small>基本の調味料は別に用意してください。</small>
          </p>
        </div>
      </div>
      <div className="recipe-detail-body">
        <section>
          <div className="section-heading">
            <h3>用意するもの</h3>
            <span className="helper">1人分</span>
          </div>
          <ul className="ingredients">
            {recipe.ingredients.map((i) => (
              <li key={i.name}>
                <span>
                  {state.pantry.includes(i.name) ? (
                    <Check size={15} className="green" />
                  ) : (
                    <span className="ingredient-dot" />
                  )}
                  {i.name}
                </span>
                <strong>{i.amount}</strong>
              </li>
            ))}
          </ul>
          <p className="staples">基本の調味料：{recipe.staples}</p>
        </section>
        <section>
          <div className="section-heading">
            <h3>つくってみよう</h3>
            <span className="helper">
              {steps.length} / {recipe.steps.length}
            </span>
          </div>
          <div className="cooking-steps">
            {recipe.steps.map((step, i) => (
              <button
                key={step}
                className={steps.includes(i) ? 'checked' : ''}
                aria-pressed={steps.includes(i)}
                onClick={() =>
                  setSteps((s) => (s.includes(i) ? s.filter((n) => n !== i) : [...s, i]))
                }
              >
                <span>{steps.includes(i) ? <Check size={17} /> : `0${i + 1}`}</span>
                <p>{step}</p>
              </button>
            ))}
          </div>
        </section>
        <div className="cooking-tip">
          <Sparkles size={19} />
          <div>
            <strong>ひとさじのコツ</strong>
            <p>{recipe.tip}</p>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <span className="helper">できたら、写真で小さな達成を残そう。</span>
        <button className="button primary" onClick={onRecord}>
          <Camera size={17} />
          できた！ 一皿を記録
        </button>
      </div>
    </Modal>
  )
}

export function RecordDialog({
  recipe,
  state,
  onClose,
  onSave,
}: {
  recipe?: Recipe
  state: AppState
  onClose: () => void
  onSave: (input: Omit<Meal, 'id' | 'day' | 'xp'>) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState(recipe ?? recipes[0])
  const [photo, setPhoto] = useState<string>()
  const [sample, setSample] = useState(false)
  const [title, setTitle] = useState(recipe?.name ?? '')
  const [category, setCategory] = useState<Meal['category']>(recipe?.category ?? '未分類')
  const [note, setNote] = useState('')
  const [visibility, setVisibility] = useState<Meal['visibility']>('private')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ready = !!photo || sample
  const todayDone = state.meals.some((m) => m.day === state.today)
  const nextDay = streak(state) + (todayDone ? 0 : 1)
  function selectSample(id: string) {
    const r = recipes.find((r) => r.id === id)!
    setSelected(r)
    setTitle(r.name)
    setCategory(r.category)
    setSample(true)
    setPhoto(undefined)
    setError('')
  }
  async function upload(file?: File) {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      setPhoto(await resizePhoto(file))
      if (sample && !recipe) {
        setTitle('')
        setCategory('未分類')
      }
      setSample(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '写真を読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Modal title="今日の一皿" onClose={onClose}>
      <form
        className="quick-record"
        onSubmit={(e) => {
          e.preventDefault()
          if (loading) return
          if (!ready) {
            inputRef.current?.click()
            return
          }
          onSave({
            recipeId: photo && !recipe ? '' : selected.id,
            title: title.trim() || '今日の一皿',
            category,
            note: note.trim(),
            visibility,
            ...(photo ? { photo } : {}),
          })
        }}
      >
        <div
          className="flow-progress"
          role="group"
          aria-label={ready ? '写真を選択済み。次は記録。' : '写真を選ぶ'}
        >
          <span className="active" />
          <span className={ready ? 'active' : ''} />
        </div>
        <label
          className={`capture-area ${ready ? 'has-photo' : ''}`}
          style={sample ? { background: selected.color } : undefined}
        >
          {photo ? (
            <img src={photo} alt="記録する料理の写真" />
          ) : sample ? (
            <FoodArt recipe={selected} />
          ) : (
            <Camera size={49} strokeWidth={1.4} />
          )}
          <input
            ref={inputRef}
            aria-label="料理の写真"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          {ready && (
            <span className="change-photo">
              <Camera size={14} />
              変更
            </span>
          )}
        </label>
        {!ready && (
          <button type="button" className="sample-link" onClick={() => selectSample(selected.id)}>
            写真なしで試す
          </button>
        )}
        {ready && (
          <details className="record-options">
            <summary>メモ・公開範囲</summary>
            <div className="record-fields">
              {sample && (
                <label className="field">
                  <span>サンプル料理</span>
                  <select
                    aria-label="サンプル料理"
                    value={selected.id}
                    onChange={(e) => selectSample(e.target.value)}
                  >
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                <span>料理の名前</span>
                <input
                  aria-label="料理の名前"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  placeholder="今日の一皿"
                />
              </label>
              <label className="field">
                <span>ジャンル</span>
                <select
                  aria-label="料理のジャンル"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Meal['category'])}
                >
                  <option>未分類</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>ひとこと</span>
                <textarea
                  aria-label="今日のひとこと"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={200}
                />
              </label>
              <fieldset className="visibility-field">
                <legend>公開範囲</legend>
                <div className="visibility-options">
                  {[
                    { value: 'private', label: '自分だけ', icon: <LockKeyhole size={17} /> },
                    { value: 'anonymous', label: '匿名でみんな', icon: <EyeOff size={17} /> },
                    { value: 'friends', label: '友達だけ', icon: <Users size={17} /> },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      aria-pressed={visibility === option.value}
                      className={visibility === option.value ? 'selected' : ''}
                      onClick={() => setVisibility(option.value as Meal['visibility'])}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
                <small>公開は端末内のプレビューです。</small>
              </fieldset>
            </div>
          </details>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="record-submit">
          <button
            type="submit"
            className="button primary full"
            aria-label={ready ? 'この一皿を記録する' : '写真を選ぶ'}
            disabled={loading}
          >
            {loading
              ? '読み込み中…'
              : !ready
                ? '写真を選ぶ'
                : todayDone || state.settings.habit === 'weekly'
                  ? 'この一皿を記録する'
                  : `記録して、${nextDay}日目へ`}
          </button>
          <small>
            <LockKeyhole size={12} />
            {visibility === 'private'
              ? '自分だけ'
              : visibility === 'anonymous'
                ? '匿名でみんな'
                : '友達だけ'}{' '}
            · 端末に保存
          </small>
        </div>
      </form>
    </Modal>
  )
}

export function SuccessDialog({ state, onClose }: { state: AppState; onClose: () => void }) {
  const weekly = state.settings.habit === 'weekly'
  return (
    <Modal title="今日も、つづいた！" onClose={onClose}>
      <div className="streak-success">
        <div className="celebration-flame">
          <Flame />
        </div>
        <div className="success-count">
          <strong>{weekly ? weeklyCount(state) : streak(state)}</strong>
          <span>{weekly ? '/ 3日' : '日連続'}</span>
        </div>
        <p>{weekly ? '今週も、一歩ずつ。' : 'また明日、この続きを。'}</p>
        <button className="button primary full" onClick={onClose}>
          つづける
        </button>
      </div>
    </Modal>
  )
}

export function RestDialog({
  state,
  onClose,
  onConfirm,
}: {
  state: AppState
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal title="今日はおやすみ" onClose={onClose}>
      <div className="rest-dialog-body">
        <Snowflake size={52} />
        <p>チケットで、連続記録を守れます。</p>
        <span className="rest-ticket-count">
          残り {state.freezes}枚 → {Math.max(0, state.freezes - 1)}枚
        </span>
        <button className="button primary full" onClick={onConfirm} disabled={state.freezes < 1}>
          チケットを使って休む
        </button>
      </div>
    </Modal>
  )
}

export function MealDialog({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const recipe = recipes.find((r) => r.id === meal.recipeId) ?? recipes[0]
  return (
    <Modal title={meal.title} onClose={onClose}>
      <div className="meal-detail-image" style={{ background: recipe.color }}>
        {meal.photo ? <img src={meal.photo} alt={meal.title} /> : <FoodArt recipe={recipe} />}
      </div>
      <div className="meal-detail-copy">
        <div className="hero-meta">
          <span>{dayLabel(meal.day)}</span>
          <span>{meal.category}</span>
          <span>+{meal.xp} XP</span>
        </div>
        <p>{meal.note || '今日も、自分のためにひとさじ。'}</p>
        <span className="outlined-badge">
          {meal.visibility === 'private' ? <LockKeyhole size={13} /> : <Users size={13} />}
          {
            { private: '自分だけの記録', anonymous: '匿名でみんなに', friends: '友達だけに' }[
              meal.visibility
            ]
          }
        </span>
      </div>
    </Modal>
  )
}

const experiments: {
  key: keyof Settings
  title: string
  question: string
  options: { value: string; label: string }[]
  meanings: Record<string, string>
}[] = [
  {
    key: 'recommendation',
    title: '01 献立の決め方',
    question: '決断を減らす？ 先の見通しをつくる？',
    options: [
      { value: 'one', label: '今日の1択' },
      { value: 'three', label: '3日分の提案' },
    ],
    meanings: {
      one: '献立ノートで1品ずつ提案します。',
      three: '献立ノートで次の3食を提案。日付は固定しません。',
    },
  },
  {
    key: 'habit',
    title: '02 継続のルール',
    question: '連続記録と生活の余裕、どちらが続く？',
    options: [
      { value: 'daily', label: '毎日 + おやすみ' },
      { value: 'weekly', label: '週3日の目標' },
    ],
    meanings: {
      daily: '日付が変わるまでに記録。未記録日は継続が途切れます。休みはチケットで保護。',
      weekly: '月〜日の間に3日記録で達成。おやすみチケットは不要です。',
    },
  },
  {
    key: 'repetition',
    title: '03 同じ料理が続いたら',
    question: '挑戦への加点？ マンネリへの減点？',
    options: [
      { value: 'bonus', label: '挑戦にボーナス' },
      { value: 'penalty', label: '繰り返しを減点' },
    ],
    meanings: {
      bonus: '最初の記録は1日20 XP。初めてのジャンルは +10 XP。同じ料理も歓迎。',
      penalty: '直近3日で同じジャンルを2回以上記録していると、その日の報酬は10 XP。',
    },
  },
  {
    key: 'social',
    title: '04 みんなの食卓の入口',
    question: '投稿のきっかけ？ 見るだけでも励みになる？',
    options: [
      { value: 'gated', label: '記録でひらく' },
      { value: 'open', label: 'いつでも見る' },
    ],
    meanings: {
      gated: 'その日の記録で解放。「自分だけ」でも解放されます。翌日は再び閉じます。',
      open: '未記録でも食卓を閲覧可能。人の料理を見てから作りたい人向け。',
    },
  },
  {
    key: 'reminder',
    title: '05 声のかけ方',
    question: '背中をそっと押す？ 継続を強く意識させる？',
    options: [
      { value: 'gentle', label: 'やさしく提案' },
      { value: 'pushy', label: '継続をリマインド' },
    ],
    meanings: {
      gentle: '「今日は一品だけ、どう？ 5分でできるごはんがあるよ。」',
      pushy: '「今日の記録はまだみたい。日付が変わる前に、継続の火を灯そう！」',
    },
  },
]

export function LabDialog({
  state,
  setState,
  onClose,
}: {
  state: AppState
  setState: Dispatch<SetStateAction<AppState>>
  onClose: () => void
}) {
  const [scenario, setScenario] = useState<'seed' | 'fresh' | null>(null)
  const [exported, setExported] = useState(false)
  function updateSetting(key: keyof Settings, value: string) {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, [key]: value },
      events: [...s.events, { day: s.today, type: 'variant', detail: `${key}: ${value}` }],
    }))
  }
  function exportNotes() {
    const data = {
      app: 'ひとさじ',
      exportedAt: new Date().toISOString(),
      ...state,
      meals: state.meals.map(({ photo, ...m }) => ({ ...m, hasPhoto: !!photo })),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `hitosaji-experiment-${state.today}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setExported(true)
  }
  return (
    <Modal title="アイデアの実験室" onClose={onClose} drawer>
      <div className="lab-intro">
        <span className="soft-badge">
          <Sparkles size={13} /> PROTOTYPE LAB
        </span>
        <p>
          仮説を変えて、触って、違いを比べる。
          <br />
          変更はすぐに画面へ反映されます。
        </p>
      </div>
      <div className="lab-scenarios">
        <div className="section-heading">
          <h3>デモの時間を進める</h3>
          <strong>{dayLabel(state.today)}</strong>
        </div>
        <p>
          JSTの日付を固定したシミュレーションです。翌日へ進めると、継続や食卓の解放状態が変わります。
        </p>
        <RecentDates state={state} />
        <button className="button secondary full" onClick={() => setState((s) => advanceDay(s))}>
          翌日へ進める <ChevronRight size={16} />
        </button>
        <div className="scenario-buttons">
          <button onClick={() => setScenario('seed')}>
            <RotateCcw size={13} />
            6日継続から
          </button>
          <button onClick={() => setScenario('fresh')}>
            <RotateCcw size={13} />
            はじめての自炊
          </button>
        </div>
        {scenario && (
          <div className="inline-confirm">
            <p>保存した料理・写真を初期データに置き換えます。比較設定と検討メモは残します。</p>
            <button
              className="button danger"
              onClick={() => {
                setState((s) => ({
                  ...initialState(todayInTokyo(), scenario === 'fresh'),
                  settings: s.settings,
                  notes: s.notes,
                }))
                setScenario(null)
              }}
            >
              記録を置き換えて開始
            </button>
            <button className="text-button" onClick={() => setScenario(null)}>
              キャンセル
            </button>
          </div>
        )}
      </div>
      <div className="experiments">
        {experiments.map((experiment) => (
          <section key={experiment.key} className="experiment">
            <h3>{experiment.title}</h3>
            <p>{experiment.question}</p>
            <Segmented
              label={experiment.title}
              value={state.settings[experiment.key]}
              options={experiment.options}
              onChange={(v) => updateSetting(experiment.key, v)}
            />
            <small>{experiment.meanings[state.settings[experiment.key]]}</small>
          </section>
        ))}
      </div>
      <section className="lab-notes">
        <label className="field">
          <span>触って気づいたこと</span>
          <textarea
            rows={4}
            placeholder="例：減点より、次の新しい一品を勧められる方が作りたくなった。"
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            maxLength={5000}
          />
        </label>
        <button className="button dark full" onClick={exportNotes}>
          <Download size={16} />
          {exported ? 'もう一度、設定とメモを書き出す' : '設定とメモを書き出す'}
        </button>
        <small>JSONに比較設定・操作履歴・記録を保存。写真データは含みません。</small>
      </section>
      <section className="lab-boundary">
        <h3>このデモで実装していること</h3>
        <p>
          食材・時間・履歴による提案、写真の保存、ジャンルの修正、継続・休みの判定、公開範囲別の表示。
        </p>
        <h3>実サービスにする前に</h3>
        <p>
          AI画像認識・生成、認証、サーバー保存、友達との通信、プッシュ通知、課金は未接続です。通知は文面比較のみ。サンプルの仲間は架空です。
        </p>
        <h3>次に広げるなら</h3>
        <p>
          家族からの「次これどう？」、食材の使い切り提案、大学生協との連携。まずは「決められた」「明日も作りたい」が生まれるかを検証します。
        </p>
      </section>
      <div className="modal-footer">
        <button className="button primary full" onClick={onClose}>
          この設定で体験する <ArrowRight size={17} />
        </button>
      </div>
    </Modal>
  )
}
