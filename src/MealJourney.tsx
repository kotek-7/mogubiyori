import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Camera, ImagePlus, Search, Utensils } from 'lucide-react'
import { Pet } from './GameArt'
import { JourneyFrame } from './JourneyFrame'
import { PlayGuide } from './PlayGuide'
import { RecipeArt } from './RecipeArt'
import { RecipeBrowser } from './RecipeBrowser'
import { mealXp, recipes, species, stageOf } from './game'
import type { FeedInput, GameState, SpeciesId } from './game'
import { resizePhoto } from './photo'
import { recognizeFood } from './foodRecognition'
import { transitionScene } from './journeyTransition'
import './meal-journey.css'

type Props = {
  state: GameState
  recipeId?: string
  targetId?: SpeciesId
  guided?: boolean
  onFeed: (input: FeedInput) => void
  onClose: () => void
}

export function MealJourney({
  state,
  recipeId: initialRecipeId,
  targetId,
  guided = false,
  onFeed,
  onClose,
}: Props) {
  const [step, setStep] = useState<'photo' | 'serve' | 'recipe-pick'>('photo')
  const [photo, setPhoto] = useState<string>()
  const [sample, setSample] = useState(false)
  const [recipeId, setRecipeId] = useState(initialRecipeId ?? '')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recognition, setRecognition] = useState<
    'idle' | 'recognizing' | 'matched' | 'unknown' | 'failed'
  >('idle')
  const [candidates, setCandidates] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const request = useRef(0)
  const recognitionRequest = useRef<AbortController | null>(null)
  const recipeChosen = useRef(Boolean(initialRecipeId))
  const titleEdited = useRef(false)
  const submitted = useRef(false)
  const target = targetId ?? state.activeId ?? 'komugi'
  const buddy = state.companions.find((entry) => entry.id === target)
  const name =
    target === state.activeId ? state.name : species.find((entry) => entry.id === target)!.name
  const recipe = recipes.find((entry) => entry.id === recipeId)
  const ready = Boolean(photo || sample)
  const xp = mealXp(state, recipeId || undefined, target)
  const recognitionMessage =
    recognition === 'recognizing'
      ? step === 'photo'
        ? '料理を見ています。先に食卓へ進めます。'
        : '料理を見ています。このままごはんをあげられます。'
      : recognition === 'matched'
        ? '料理の候補が見つかりました。'
        : recognition === 'unknown'
          ? '料理がわかりませんでした。手動で選べます。'
          : recognition === 'failed'
            ? '写真の確認ができませんでした。料理は手動で選べます。'
            : ''
  const close = useCallback(() => {
    request.current += 1
    recognitionRequest.current?.abort()
    onClose()
  }, [onClose])

  useEffect(
    () => () => {
      request.current += 1
      recognitionRequest.current?.abort()
    },
    [],
  )
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // Let native select menus and expanded fields handle their own dismissal.
      if (event.target instanceof HTMLSelectElement) return
      event.preventDefault()
      if (step === 'recipe-pick') transitionScene(() => setStep('serve'))
      else if (step === 'serve') transitionScene(() => setStep('photo'))
      else close()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [step, close])

  async function identifyPhoto(photo: string, id: number) {
    const controller = new AbortController()
    recognitionRequest.current = controller
    setRecognition('recognizing')
    try {
      const found = await recognizeFood(photo, controller.signal)
      if (id !== request.current || controller.signal.aborted) return
      setCandidates(found)
      setRecognition(found.length ? 'matched' : 'unknown')
      if (found[0] && !recipeChosen.current && !titleEdited.current) setRecipeId(found[0])
    } catch {
      if (id === request.current && !controller.signal.aborted) setRecognition('failed')
    } finally {
      if (recognitionRequest.current === controller) recognitionRequest.current = null
    }
  }

  async function selectPhoto(file?: File) {
    if (!file) return
    const id = ++request.current
    recognitionRequest.current?.abort()
    setCandidates([])
    setRecognition('idle')
    if (!recipeChosen.current) setRecipeId('')
    setLoading(true)
    setError('')
    try {
      const result = await resizePhoto(file)
      if (id !== request.current) return
      setPhoto(result)
      setSample(false)
      void identifyPhoto(result, id)
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
    request.current += 1
    recognitionRequest.current?.abort()
    onFeed({
      targetId: target,
      title: title.trim() || recipe?.name || '今日のごはん',
      photo,
      sample: recipe?.sample ?? 'rice',
      recipeId: recipeId || undefined,
    })
  }

  function chooseRecipe(id: string) {
    recipeChosen.current = true
    transitionScene(() => {
      setRecipeId(id)
      setStep('serve')
    })
  }

  const dish = photo ? <img src={photo} alt="今日の料理" /> : <RecipeArt recipe={recipe} />

  if (step === 'recipe-pick')
    return (
      <JourneyFrame
        scene="recipe-pick"
        title="つくった料理を選ぶ"
        onBack={() => transitionScene(() => setStep('serve'))}
        backLabel="食卓にもどる"
        progress={{ current: 2, total: 2 }}
        footer={
          <button type="button" className="journey-secondary" onClick={() => chooseRecipe('')}>
            いつものごはんにする
          </button>
        }
      >
        <div className="meal-recipe-browser">
          <RecipeBrowser state={state} onRecipe={chooseRecipe} mode="select" />
        </div>
      </JourneyFrame>
    )

  if (step === 'photo')
    return (
      <JourneyFrame
        scene="photo"
        title="料理の写真"
        onClose={close}
        closeLabel="ひろばへ"
        progress={{ current: 1, total: 2 }}
        footer={
          <>
            {guided && (
              <PlayGuide id="meal-photo-guide" label="ごはんの記録ガイド">
                {ready
                  ? '写真を確認して、食卓へ進みましょう。'
                  : '今日作った料理の写真を選びましょう。'}
              </PlayGuide>
            )}
            <button
              className={`journey-primary${guided ? ' is-guide-target' : ''}`}
              aria-describedby={guided ? 'meal-photo-guide-text' : undefined}
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
                request.current += 1
                recognitionRequest.current?.abort()
                transitionScene(() => {
                  setPhoto(undefined)
                  setSample(true)
                  setError('')
                  setCandidates([])
                  setRecognition('idle')
                  if (!recipeChosen.current) setRecipeId('')
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
        {recognitionMessage && (
          <p className="meal-recognition-status" role="status">
            {recognitionMessage}
          </p>
        )}
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
      onClose={close}
      closeLabel="ひろばへ"
      progress={{ current: 2, total: 2 }}
      footer={
        <>
          {guided && (
            <PlayGuide id="meal-serve-guide" label="ごはんの記録ガイド">
              料理名を確認して、{name}にごはんをあげましょう。
            </PlayGuide>
          )}
          <button
            className={`journey-primary${guided ? ' is-guide-target' : ''}`}
            aria-describedby={guided ? 'meal-serve-guide-text' : undefined}
            type="submit"
            form="serve-meal"
            disabled={!ready || loading}
          >
            <Utensils size={20} />
            {name}にごはんをあげる
          </button>
        </>
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
        {recognitionMessage && (
          <p className="meal-recognition-status" role="status">
            {recognitionMessage}
          </p>
        )}
        {candidates.length > 0 && (
          <div className="meal-recipe-candidates" role="group" aria-label="写真から見つかった料理">
            {candidates.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={recipeId === id}
                onClick={() => {
                  recipeChosen.current = true
                  setRecipeId(id)
                }}
              >
                {recipes.find((entry) => entry.id === id)?.name}
              </button>
            ))}
          </div>
        )}
        <div className="meal-recipe-field">
          <span>つくった料理</span>
          <div className="meal-selected-recipe">
            <span className="meal-selected-recipe-art" aria-hidden="true">
              <RecipeArt recipe={recipe} />
            </span>
            <output aria-label="つくった料理">{recipe?.name ?? 'いつものごはん'}</output>
            <button type="button" onClick={() => transitionScene(() => setStep('recipe-pick'))}>
              <Search size={15} aria-hidden="true" />
              料理を選ぶ
            </button>
          </div>
        </div>
        {xp < 45 && <p className="repeat-hint">同じ料理が続いているため、今回は +{xp} XPです。</p>}
        <details className="meal-title-details">
          <summary>料理名をつける</summary>
          <label className="meal-recipe-field">
            <span>料理名（任意）</span>
            <input
              value={title}
              maxLength={40}
              placeholder={recipe?.name ?? '今日のごはん'}
              onChange={(event) => {
                titleEdited.current = true
                setTitle(event.target.value)
              }}
            />
          </label>
        </details>
      </form>
    </JourneyFrame>
  )
}
