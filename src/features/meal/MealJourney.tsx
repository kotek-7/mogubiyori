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
import { species } from '../../../shared/content/catalog'
import { mealChoiceById } from '../../../shared/content/mealChoices'
import type { FeedInput, GameState, SpeciesId } from '../../../shared/game/types'
import type { FeedReceipt } from '../../../shared/game/receipt'
import { resizePhoto } from './photo'
import { recognizeFood } from './foodRecognition'
import { transitionScene } from '../../ui/journey/journeyTransition'
import { createMealMachine } from './mealMachine'
import { GenericDishPicker } from './GenericDishPicker'
import { RecognitionStatus } from './RecognitionStatus'
import { MealRecordFields } from './MealRecordFields'
import { MealArtwork } from '../album/MealArtwork'
import { CameraCapture } from './CameraCapture'

export type MealJourneyProps = {
  state: GameState
  recipeId?: string
  targetId?: SpeciesId
  mealRecordId?: string
  guided?: boolean
  onFeed: (input: FeedInput, operationId: string) => Promise<FeedReceipt>
  onCommitted: (receipt: FeedReceipt, photo?: string) => void
  onClose: () => void
  closeLabel?: string
}

export function MealJourney({
  state,
  recipeId: initialRecipeId,
  targetId,
  mealRecordId,
  guided = false,
  onFeed,
  onCommitted,
  onClose,
  closeLabel = 'ひろばへ',
}: MealJourneyProps) {
  const sharedMeal = state.mealRecords?.find((record) => record.id === mealRecordId)
  const eligibleTargets = [
    ...state.companions,
    ...state.visitors
      .filter((id) => !state.companions.some((companion) => companion.id === id))
      .map((id) => ({ id })),
  ].filter(
    (companion) =>
      !mealRecordId ||
      !state.meals.some(
        (meal) => meal.mealRecordId === mealRecordId && meal.targetId === companion.id,
      ),
  )
  const firstTarget =
    eligibleTargets.find((entry) => entry.id === (targetId ?? state.activeId))?.id ??
    eligibleTargets[0]?.id ??
    state.activeId ??
    'komugi'
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
    {
      input: {
        targetId: mealRecordId ? firstTarget : (targetId ?? state.activeId ?? 'komugi'),
        recipeId: initialRecipeId,
        sharedMeal,
      },
    },
  )
  const {
    photo,
    sample,
    recipeId,
    dishId,
    title,
    mealRecord,
    candidates,
    error,
    targetId: target,
  } = snapshot.context
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
  const [cameraOpen, setCameraOpen] = useState(false)
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
  const selectedId = dishId ?? recipeId
  const recipe = mealChoiceById(selectedId)
  const sharing = Boolean(mealRecordId)
  const ready =
    Boolean(photo || sample) &&
    (!sharing || Boolean(sharedMeal && eligibleTargets.length && sharedMeal.day === state.today))
  const xp = mealXp(state, recipeId || undefined, target)
  const recognitionMessage =
    recognition === 'recognizing'
      ? step === 'photo'
        ? '先に食卓へ進めます。'
        : 'このままごはんをあげられます。'
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
      if (sharing) close()
      else if (step !== 'photo') transitionScene(() => send({ type: 'BACK' }))
      else close()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [step, submitting, close, send, sharing])

  function chooseRecipe(recipeId: string) {
    transitionScene(() => send({ type: 'RECIPE_SELECTED', recipeId }))
  }

  const previousFeed = sharing
    ? state.meals.find((meal) => meal.mealRecordId === mealRecordId)
    : undefined
  const dish = previousFeed ? (
    <MealArtwork meal={previousFeed} />
  ) : photo ? (
    <img src={photo} alt="今日の料理" />
  ) : (
    <RecipeArt recipe={recipe} />
  )

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
            今日のごはんにする
          </button>
        }
      >
        <div className="meal-recipe-browser">
          <GenericDishPicker selectedId={dishId} onSelect={chooseRecipe} />
          <h2 className="meal-specific-recipes-heading">レシピから選ぶ</h2>
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
        closeLabel={closeLabel}
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
                ready ? transitionScene(() => send({ type: 'NEXT' })) : setCameraOpen(true)
              }
            >
              {ready ? <ArrowRight size={20} /> : <Camera size={20} />}
              {loading ? '読み込み中' : ready ? '食卓へ' : '料理の写真を撮る'}
            </button>
            <button
              type="button"
              className="journey-secondary"
              disabled={loading}
              onClick={() => input.current?.click()}
            >
              <ImagePlus size={20} /> 撮った写真を選ぶ
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
              onClick={() => setCameraOpen(true)}
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
            写真を提出すると該当する料理の候補が提示されます。
          </p>
        )}
        <RecognitionStatus pending={recognition === 'recognizing'} message={recognitionMessage} />
        {error && (
          <p className="error-message meal-photo-error" role="alert">
            {error}
          </p>
        )}
        {cameraOpen && (
          <CameraCapture
            onCapture={(file) => {
              setCameraOpen(false)
              send({ type: 'PHOTO_SELECTED', file })
            }}
            onClose={() => setCameraOpen(false)}
            onChoosePhoto={() => {
              setCameraOpen(false)
              input.current?.click()
            }}
          />
        )}
      </JourneyFrame>
    )

  return (
    <JourneyFrame
      scene="serve"
      title="ごはんをあげる"
      onBack={
        submitting || sharing ? undefined : () => transitionScene(() => send({ type: 'BACK' }))
      }
      backLabel="写真にもどる"
      onClose={submitting ? undefined : close}
      closeLabel={closeLabel}
      progress={sharing ? undefined : { current: 2, total: 2 }}
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
        onInvalidCapture={(event) => {
          ;(event.target as HTMLElement).closest('details')?.setAttribute('open', '')
        }}
        onSubmit={(event) => {
          event.preventDefault()
          send({ type: 'SUBMIT' })
        }}
      >
        {sharing && (
          <>
            <p className="meal-share-note">
              「{sharedMeal?.title}」をほかのもぐにもおすそわけします。食事の記録は1回のままです。
            </p>
            <label className="meal-share-target">
              ごはんをあげるもぐ
              <select
                value={target}
                disabled={submitting || !eligibleTargets.length}
                onChange={(event) =>
                  send({ type: 'TARGET_CHANGED', targetId: event.target.value as SpeciesId })
                }
              >
                {eligibleTargets.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id === state.activeId
                      ? state.name
                      : species.find((pet) => pet.id === entry.id)!.name}
                  </option>
                ))}
              </select>
            </label>
            {!eligibleTargets.length && (
              <p className="meal-share-note">この食事は、なかま全員におすそわけ済みです。</p>
            )}
          </>
        )}
        {!sharing && (
          <>
            <RecognitionStatus
              pending={recognition === 'recognizing'}
              message={recognitionMessage}
            />
            {error && (
              <p className="error-message meal-photo-error" role="alert">
                {error}
              </p>
            )}
            {submitting && <p role="status">ごはんを保存しています。</p>}
            {candidates.length > 0 && (
              <div
                className="meal-recipe-candidates"
                role="group"
                aria-label="写真から見つかった料理"
              >
                {candidates.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selectedId === id}
                    disabled={submitting}
                    onClick={() => send({ type: 'RECIPE_CHANGED', recipeId: id })}
                  >
                    {mealChoiceById(id)?.name}
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
                <output aria-label="つくった料理">{recipe?.name ?? '今日のごはん'}</output>
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
            <details className="meal-record-disclosure">
              <summary>食事の内容を確認</summary>
              <MealRecordFields
                value={mealRecord}
                disabled={submitting}
                primaryChoiceId={selectedId}
                onChange={(value) => send({ type: 'RECORD_CHANGED', value })}
              />
            </details>
            {xp < 45 && (
              <p className="repeat-hint">同じ料理が続いているため、今回は +{xp} XPです。</p>
            )}
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
          </>
        )}
        {sharing && error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </form>
    </JourneyFrame>
  )
}
