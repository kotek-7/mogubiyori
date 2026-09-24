import { useCallback, useEffect, useRef, useState } from 'react'
import { useMachine } from '@xstate/react'
import { fromPromise } from 'xstate'
import { ArrowRight, Camera, ImagePlus, Search, Utensils } from 'lucide-react'
import { Pet } from '../../ui/art/GameArt'
import { RecipeArt } from '../../ui/art/RecipeArt'
import { RecipeBrowser } from '../collection/RecipeBrowser'
import { JourneyFrame } from '../../ui/journey/JourneyFrame'
import { PlayGuide } from '../tutorial/PlayGuide'
import { mealXp, stageOf } from '../../../shared/game/game'
import { recipes, species } from '../../../shared/content/catalog'
import type { FeedInput, GameState, SpeciesId } from '../../../shared/game/types'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { resizePhoto } from './photo'
import { recognizeFood } from './foodRecognition'
import { transitionScene } from '../../ui/journey/journeyTransition'
import { createMealMachine } from './mealMachine'

export type MealJourneyProps = {
  state: GameState
  recipeId?: string
  targetId?: SpeciesId
  guided?: boolean
  onFeed: (input: FeedInput, operationId: string) => Promise<FeedReceipt>
  onCommitted: (receipt: FeedReceipt, photo?: string) => void
  onClose: () => void
}

export function MealJourney({
  state,
  recipeId: initialRecipeId,
  targetId,
  guided = false,
  onFeed,
  onCommitted,
  onClose,
}: MealJourneyProps) {
  const [machine] = useState(() =>
    createMealMachine({
      resizePhoto,
      recognizeFood,
      submit: onFeed,
    }),
  )
  const [snapshot, send, actor] = useMachine(
    machine.provide({
      actors: {
        submit: fromPromise<FeedReceipt, { meal: FeedInput; operationId: string }>(({ input }) =>
          onFeed(input.meal, input.operationId),
        ),
      },
    }),
    { input: { targetId: targetId ?? state.activeId ?? 'komugi', recipeId: initialRecipeId } },
  )
  const { photo, sample, recipeId, title, candidates, error, targetId: target } = snapshot.context
  const step = snapshot.matches({ editing: { navigation: 'photo' } })
    ? 'photo'
    : snapshot.matches({ editing: { navigation: 'recipes' } })
      ? 'recipe-pick'
      : 'serve'
  const loading = snapshot.matches({ editing: { media: 'resizing' } })
  const submitting = snapshot.matches('submitting') || snapshot.matches('committed')
  const recognition = snapshot.matches({ editing: { media: 'recognizing' } })
    ? 'recognizing'
    : snapshot.matches({ editing: { media: 'recognized' } })
      ? candidates.length
        ? 'matched'
        : 'unknown'
      : snapshot.matches({ editing: { media: 'failed' } })
        ? 'failed'
        : 'idle'
  const input = useRef<HTMLInputElement>(null)
  const delivered = useRef(false)
  useEffect(() => {
    if (delivered.current) return
    if (snapshot.matches('committed') && snapshot.context.receipt) {
      delivered.current = true
      onCommitted(snapshot.context.receipt, snapshot.context.submittedInput?.photo)
    }
  }, [snapshot, onCommitted])
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
    if (!actor.getSnapshot().matches('editing')) return
    send({ type: 'CANCEL' })
    onClose()
  }, [actor, send, onClose])

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (submitting || event.key !== 'Escape' || event.defaultPrevented) return
      // Let native select menus handle their own dismissal.
      if (event.target instanceof HTMLSelectElement) return
      event.preventDefault()
      if (step !== 'photo') transitionScene(() => send({ type: 'BACK' }))
      else close()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [step, submitting, close, send])

  function chooseRecipe(recipeId: string) {
    transitionScene(() => send({ type: 'RECIPE_SELECTED', recipeId }))
  }

  const dish = photo ? <img src={photo} alt="今日の料理" /> : <RecipeArt recipe={recipe} />

  if (step === 'recipe-pick')
    return (
      <JourneyFrame
        scene="recipe-pick"
        title="つくった料理を選ぶ"
        onBack={() => transitionScene(() => send({ type: 'BACK' }))}
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
        onClose={submitting ? undefined : close}
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
                ready ? transitionScene(() => send({ type: 'NEXT' })) : input.current?.click()
              }
            >
              {ready ? <ArrowRight size={20} /> : <Camera size={20} />}
              {loading ? '読み込み中' : ready ? '食卓へ' : '料理の写真を選ぶ'}
            </button>
            <button
              className="journey-secondary"
              disabled={loading}
              onClick={() => transitionScene(() => send({ type: 'USE_SAMPLE' }))}
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
                const file = event.target.files?.[0]
                if (file) send({ type: 'PHOTO_SELECTED', file })
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
              neck={state.equipped.neck}
              bag={state.equipped.bag}
            />
          </div>
        </div>
        {!ready && (
          <p className="meal-recognition-status">
            写真からAIが料理の候補を見つけます。違うときは食卓で選び直せます。
          </p>
        )}
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
      onBack={submitting ? undefined : () => transitionScene(() => send({ type: 'BACK' }))}
      backLabel="写真にもどる"
      onClose={submitting ? undefined : close}
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
            disabled={!ready || loading || submitting}
          >
            <Utensils size={20} />
            {submitting ? 'ごはんを保存中' : `${name}にごはんをあげる`}
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
            neck={state.equipped.neck}
            bag={state.equipped.bag}
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
          send({ type: 'SUBMIT' })
        }}
      >
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
        {submitting && <p role="status">ごはんを保存しています。</p>}
        {candidates.length > 0 && (
          <div className="meal-recipe-candidates" role="group" aria-label="写真から見つかった料理">
            {candidates.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={recipeId === id}
                disabled={submitting}
                onClick={() => send({ type: 'RECIPE_CHANGED', recipeId: id })}
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
            <button
              type="button"
              disabled={submitting}
              onClick={() => transitionScene(() => send({ type: 'OPEN_RECIPES' }))}
            >
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
              disabled={submitting}
              onChange={(event) => send({ type: 'TITLE_CHANGED', title: event.target.value })}
            />
          </label>
        </details>
      </form>
    </JourneyFrame>
  )
}
