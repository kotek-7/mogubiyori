import { useState } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Download,
  EyeOff,
  Flame as FlameIcon,
  ImagePlus,
  Leaf,
  LockKeyhole,
  RotateCcw,
  Snowflake,
  Sparkles,
  Upload,
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
  rewardFor,
  streak,
  todayInTokyo,
  weeklyCount,
} from './domain'
import type { AppState, Category, Meal, Recipe, Settings } from './domain'
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
  recipe = recipes[0],
  state,
  onClose,
  onSave,
}: {
  recipe?: Recipe
  state: AppState
  onClose: () => void
  onSave: (input: Omit<Meal, 'id' | 'day' | 'xp'>) => void
}) {
  const [selected, setSelected] = useState(recipe)
  const [photo, setPhoto] = useState<string>()
  const [sample, setSample] = useState(false)
  const [title, setTitle] = useState(recipe.name)
  const [category, setCategory] = useState<Category>(recipe.category)
  const [note, setNote] = useState('')
  const [visibility, setVisibility] = useState<Meal['visibility']>('private')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const reward = rewardFor(state, category)
  const selectSample = (id: string) => {
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
      setSample(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '写真を読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Modal title="今日の「つくれた」を残そう。" onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if ((!photo && !sample) || !title.trim() || loading) return
          onSave({
            recipeId: selected.id,
            title: title.trim(),
            category,
            note: note.trim(),
            visibility,
            ...(photo ? { photo } : {}),
          })
        }}
      >
        <div className="record-layout">
          <div>
            <div
              className={`photo-upload ${photo || sample ? 'has-photo' : ''}`}
              style={sample ? { background: selected.color } : undefined}
            >
              {photo ? (
                <img src={photo} alt="記録する料理の写真" />
              ) : sample ? (
                <FoodArt recipe={selected} />
              ) : (
                <div className="upload-placeholder">
                  <span>
                    <Camera size={32} strokeWidth={1.5} />
                  </span>
                  <h3>いつものごはんを、1枚。</h3>
                  <p>盛りつけも、映えも、気にしない。</p>
                </div>
              )}
              <label className="upload-label">
                <Upload size={16} />
                {loading ? '写真を準備中…' : photo || sample ? '写真を変える' : '写真を選ぶ・撮る'}
                <input
                  aria-label="料理の写真"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={loading}
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="sample-control">
              <span className="helper">写真がなくても体験できます</span>
              <button
                type="button"
                className="text-button"
                onClick={() => selectSample(selected.id)}
              >
                <ImagePlus size={15} />
                サンプルの一皿を使う
              </button>
              {sample && (
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
              )}
            </div>
            <p className="privacy-note">
              <LockKeyhole size={13} />
              写真はこのブラウザ内に保存されます。
            </p>
          </div>
          <div className="record-fields">
            <label className="field">
              <span>料理の名前</span>
              <input
                aria-label="料理の名前"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                required
                placeholder="たとえば、わたしの炒飯"
              />
            </label>
            <label className="field">
              <span>料理のジャンル</span>
              <select
                aria-label="料理のジャンル"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <small>
                {photo
                  ? '写真を見ながら、名前とジャンルを入力してください。'
                  : '料理の名前とジャンルは、自由に直せます。'}
              </small>
            </label>
            <label className="field">
              <span>
                今日のひとこと <small>任意</small>
              </span>
              <textarea
                aria-label="今日のひとこと"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="できたことを、ひとつ。"
              />
            </label>
            <fieldset className="visibility-field">
              <legend>この一皿を見せるのは</legend>
              <div className="visibility-options">
                {[
                  { value: 'private', label: '自分だけ', icon: <LockKeyhole size={17} /> },
                  { value: 'anonymous', label: '匿名でみんな', icon: <EyeOff size={17} /> },
                  { value: 'friends', label: '友達だけ', icon: <Users size={17} /> },
                ].map((option) => (
                  <button
                    type="button"
                    aria-pressed={visibility === option.value}
                    className={visibility === option.value ? 'selected' : ''}
                    key={option.value}
                    onClick={() => setVisibility(option.value as Meal['visibility'])}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
              <small>
                {visibility === 'private'
                  ? '自分だけの記録でも、みんなの食卓を見られます。'
                  : 'デモでは食卓のプレビューに表示されます。外部への公開はありません。'}
              </small>
            </fieldset>
          </div>
        </div>
        <div
          className={`reward-preview ${reward.repeated && state.settings.repetition === 'penalty' ? 'penalty' : ''}`}
        >
          <Sparkles size={18} />
          <span>{reward.label}</span>
          <strong>+{reward.xp} XP</strong>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <span className="helper">{dayLabel(state.today)}の記録</span>
          <button
            type="submit"
            className="button primary"
            disabled={(!photo && !sample) || !title.trim() || loading}
          >
            この一皿を記録する <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function SuccessDialog({
  state,
  xp,
  message,
  onClose,
  onCommunity,
}: {
  state: AppState
  xp: number
  message: string
  onClose: () => void
  onCommunity: () => void
}) {
  return (
    <Modal title="今日もひとつ、つくれた！" onClose={onClose}>
      <div className="success-body">
        <div className="success-rays">
          <Flame />
        </div>
        <span className="success-xp">
          <Sparkles size={21} />+{xp} XP
        </span>
        <h3>
          その一皿が、
          <br />
          明日の自分の力になる。
        </h3>
        <p>{message}</p>
        <div className="success-stat">
          <FlameIcon size={21} />
          <strong>
            {state.settings.habit === 'weekly' ? weeklyCount(state) : streak(state)}日
          </strong>{' '}
          {state.settings.habit === 'weekly'
            ? '今週も、自分のペースで'
            : '小さな火がつづいています'}
        </div>
        <button className="button primary full" onClick={onCommunity}>
          みんなの食卓がひらきました <ArrowRight size={17} />
        </button>
        <button className="text-button" onClick={onClose}>
          今日のひとさじに戻る
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
    <Modal title="今日は、おやすみにしよう。" onClose={onClose}>
      <div className="rest-dialog-body">
        <span className="big-snow">
          <Snowflake size={44} />
        </span>
        <h3>休むことも、つづけること。</h3>
        <p>
          おやすみチケットを1枚使うと、
          <br />
          今日つくらなくても、継続の火を守れます。
        </p>
        <div className="rest-rules">
          <span>
            <Check size={16} />
            継続日数は増えず、そのままキープ
          </span>
          <span>
            <Check size={16} />
            今日つくれたらチケットは戻ります
          </span>
          <span>
            <LockKeyhole size={16} />
            みんなの食卓は記録した日にひらきます
          </span>
        </div>
        <button className="button primary full" onClick={onConfirm} disabled={state.freezes < 1}>
          チケットを1枚使う <span>残り{state.freezes}枚</span>
        </button>
        <button className="text-button" onClick={onClose}>
          やっぱり今日は作ってみる
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
      one: 'ホームで今日の1品に集中。ほかの一品への変更もできます。',
      three: 'ホームに次の3食を表示。不規則な生活に合わせ、日付を固定しません。',
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
