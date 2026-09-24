import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Camera, ImagePlus, Utensils } from 'lucide-react'
import { DishArt, Pet } from './GameArt'
import { JourneyFrame } from './JourneyFrame'
import { mealXp, recipes, species, stageOf } from './game'
import type { FeedInput, GameState, SpeciesId } from './game'
import { resizePhoto } from './photo'
import { transitionScene } from './journeyTransition'
import './meal-journey.css'

type Props = {
  state: GameState
  recipeId?: string
  targetId?: SpeciesId
  onFeed: (input: FeedInput) => void
  onClose: () => void
}

export function MealJourney({
  state,
  recipeId: initialRecipeId,
  targetId,
  onFeed,
  onClose,
}: Props) {
  const [step, setStep] = useState<'photo' | 'serve'>('photo')
  const [photo, setPhoto] = useState<string>()
  const [sample, setSample] = useState(false)
  const [recipeId, setRecipeId] = useState(initialRecipeId ?? '')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const request = useRef(0)
  const submitted = useRef(false)
  const target = targetId ?? state.activeId ?? 'komugi'
  const buddy = state.companions.find((entry) => entry.id === target)
  const name =
    target === state.activeId ? state.name : species.find((entry) => entry.id === target)!.name
  const recipe = recipes.find((entry) => entry.id === recipeId)
  const ready = Boolean(photo || sample)
  const xp = mealXp(state, recipeId || undefined, target)

  useEffect(
    () => () => {
      request.current += 1
    },
    [],
  )
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // Let native select menus and expanded fields handle their own dismissal.
      if (event.target instanceof HTMLSelectElement) return
      event.preventDefault()
      if (step === 'serve') transitionScene(() => setStep('photo'))
      else onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [step, onClose])

  async function selectPhoto(file?: File) {
    if (!file) return
    const id = ++request.current
    setLoading(true)
    setError('')
    try {
      const result = await resizePhoto(file)
      if (id !== request.current) return
      setPhoto(result)
      setSample(false)
    } catch (cause) {
      if (id === request.current)
        setError(cause instanceof Error ? cause.message : '写真を読み込めませんでした。')
    } finally {
      if (id === request.current) setLoading(false)
    }
  }

  function serve() {
    if (!ready || loading || submitted.current) return
    submitted.current = true
    onFeed({
      targetId: target,
      title: title.trim() || recipe?.name || '今日のごはん',
      photo,
      sample: recipe?.sample ?? 'rice',
      recipeId: recipeId || undefined,
    })
  }

  const dish = photo ? (
    <img src={photo} alt="今日の料理" />
  ) : (
    <DishArt kind={recipe?.sample ?? 'rice'} />
  )

  if (step === 'photo')
    return (
      <JourneyFrame
        scene="photo"
        title="料理の写真"
        onClose={onClose}
        closeLabel="ひろばへ"
        progress={{ current: 1, total: 2 }}
        footer={
          <>
            <button
              className="journey-primary"
              disabled={loading}
              onClick={() =>
                ready ? transitionScene(() => setStep('serve')) : input.current?.click()
              }
            >
              {ready ? <ArrowRight size={20} /> : <Camera size={20} />}
              {loading ? '読み込み中' : ready ? '食卓へ' : '料理の写真を選ぶ'}
            </button>
            <button
              className="journey-secondary"
              disabled={loading}
              onClick={() => {
                transitionScene(() => {
                  setPhoto(undefined)
                  setSample(true)
                  setError('')
                  setStep('serve')
                })
              }}
            >
              写真なしで体験する
            </button>
          </>
        }
      >
        <div className="meal-photo-scene">
          <div className={`meal-photo-card ${ready ? 'has-photo' : ''}`}>
            <input
              className="sr-only"
              tabIndex={-1}
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              aria-label="料理の写真"
              disabled={loading}
              onChange={(event) => {
                void selectPhoto(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <button
              type="button"
              className="meal-photo-picker photo-picker"
              aria-label={ready ? '写真を変える' : '料理の写真を撮る・選ぶ'}
              disabled={loading}
              onClick={() => input.current?.click()}
            >
              {ready ? (
                dish
              ) : (
                <span className="meal-photo-placeholder">
                  <span className="meal-camera">
                    <Camera size={42} strokeWidth={1.6} />
                  </span>
                  <span className="meal-photo-corners" aria-hidden="true" />
                </span>
              )}
              {ready && (
                <span className="meal-photo-change">
                  <ImagePlus size={16} /> 写真を変える
                </span>
              )}
            </button>
          </div>
          <div className="meal-photo-friend" aria-hidden="true">
            <Pet
              species={target}
              stage={stageOf(buddy?.xp ?? 0)}
              mood="hungry"
              hat={state.equipped.hat}
            />
          </div>
        </div>
        {error && (
          <p className="error-message meal-photo-error" role="alert">
            {error}
          </p>
        )}
      </JourneyFrame>
    )

  return (
    <JourneyFrame
      scene="serve"
      title="ごはんをあげる"
      onBack={() => transitionScene(() => setStep('photo'))}
      backLabel="写真にもどる"
      onClose={onClose}
      closeLabel="ひろばへ"
      progress={{ current: 2, total: 2 }}
      footer={
        <button
          className="journey-primary"
          type="submit"
          form="serve-meal"
          disabled={!ready || loading}
        >
          <Utensils size={20} />
          {name}にごはんをあげる
        </button>
      }
    >
      <div className="meal-serving-art" role="img" aria-label={`${name}がごはんを待っています`}>
        <div className="meal-serving-pet">
          <Pet
            species={target}
            stage={stageOf(buddy?.xp ?? 0)}
            mood="hungry"
            hat={state.equipped.hat}
          />
        </div>
        <div className="meal-tablecloth" />
        <div className="meal-serving-dish">{dish}</div>
        <span className="meal-serving-cutlery" aria-hidden="true">
          <Utensils size={33} strokeWidth={1.6} />
        </span>
      </div>
      <form
        id="serve-meal"
        className="meal-serve-form"
        onSubmit={(event) => {
          event.preventDefault()
          serve()
        }}
      >
        <label className="meal-recipe-field">
          <span>つくった料理</span>
          <select value={recipeId} onChange={(event) => setRecipeId(event.target.value)}>
            <option value="">いつものごはん</option>
            {recipes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        {xp < 45 && <p className="repeat-hint">同じ料理が続いているため、今回は +{xp} XPです。</p>}
        <details className="meal-title-details">
          <summary>料理名をつける</summary>
          <label className="meal-recipe-field">
            <span>料理名（任意）</span>
            <input
              value={title}
              maxLength={40}
              placeholder={recipe?.name ?? '今日のごはん'}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </details>
      </form>
    </JourneyFrame>
  )
}
