import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { recipes, species } from '../game/browserGame'
import type { GameMeal, GameState, GrowthStage, Item, SpeciesId } from '../game/browserGame'
import { RecipeDetail } from '../../features/collection/RecipeDetail'
import { useGameSession } from '../game/useGameSession'
import { Sheet } from '../../ui/Sheet'
import { createOperationId } from '../../lib/operationId'
import type { GameCommand } from '../../../shared/game/commands'
import { CompanionProfile } from '../../features/companions/CompanionProfile'
import { MealDetail } from '../../features/album/MealDetail'
import { ItemDetail } from '../../features/shop/ItemDetail'
import { SettingsPanel } from '../../features/settings/SettingsPanel'
import { HelpPanel } from '../../features/settings/HelpPanel'
import { DebugPanel } from '../../features/settings/DebugPanel'
import { RestPanel } from '../../features/room/RestPanel'
import { MealReminder } from '../../features/room/MealReminder'
import { StreakPanel } from '../../features/streak/StreakPanel'
import { SubscriptionSettings } from '../../features/subscription/Subscription'
import type { Page } from '../gameUi'

export type Dialog =
  | { type: 'recipe'; recipeId: string }
  | { type: 'meal'; meal: GameMeal }
  | { type: 'mealRecord'; recordId: string }
  | { type: 'item'; item: Item }
  | { type: 'profile'; speciesId?: SpeciesId }
  | { type: 'subscription'; reason?: 'daily-meal-limit' }
  | { type: 'settings' | 'streak' | 'rest' | 'letters' | 'help' | 'debug' }

type Props = {
  dialog: Dialog
  state: GameState
  onClose: () => void
  onNavigate: (page: Page) => void
  onToast: (text: string) => void
  onRecord: (options?: { recipeId?: string; targetId?: SpeciesId; mealRecordId?: string }) => void
  onTutorial: () => void
}

export function GameDialogs({
  dialog,
  state,
  onClose,
  onNavigate,
  onToast,
  onRecord,
  onTutorial,
}: Props) {
  const { execute, gateway, busy } = useGameSession()
  const inFlight = useRef(false)
  const retryCommand = useRef<{ encoded: string; operationId: string } | null>(null)
  const isLocal = gateway.mode === 'local'
  async function perform(action: () => Promise<unknown>, onSuccess?: () => void) {
    if (busy || inFlight.current) return
    inFlight.current = true
    try {
      await action()
      onSuccess?.()
    } catch {
      // The session displays the error. Keep this dialog and its input for retry.
    } finally {
      inFlight.current = false
    }
  }
  function runCommand(command: GameCommand, onSuccess?: () => void) {
    if (busy || inFlight.current) return
    const encoded = JSON.stringify(command)
    if (retryCommand.current?.encoded !== encoded)
      retryCommand.current = { encoded, operationId: createOperationId() }
    const operationId = retryCommand.current.operationId
    void perform(
      () => execute(command, operationId),
      () => {
        retryCommand.current = null
        onSuccess?.()
      },
    )
  }
  const [local, setLocal] = useState<Dialog>(dialog)
  const [previewStage, setPreviewStage] = useState<GrowthStage | null>(null)
  const [returnRecipeId, setReturnRecipeId] = useState<string | null>(null)
  function close() {
    onClose()
  }

  function leave(page: Page) {
    onNavigate(page)
    close()
  }
  let title = ''
  let content: ReactNode
  switch (local.type) {
    case 'debug':
      title = 'デバッグ設定'
      content = (
        <DebugPanel
          onCommand={(command, onSuccess) =>
            runCommand(command, () => {
              onSuccess?.()
              if (command.type === 'debugReset' && command.preset === 'fresh') leave('room')
            })
          }
        />
      )
      break
    case 'subscription':
      title = local.reason === 'daily-meal-limit' ? 'ごはんをもっと記録する' : '会員プラン'
      content = (
        <>
          {local.reason === 'daily-meal-limit' && (
            <p>無料プランのごはん記録は1日1回です。有料プランなら、1日に何回でも記録できます。</p>
          )}
          <SubscriptionSettings />
        </>
      )
      break
    case 'recipe':
      title = recipes.find((recipe) => recipe.id === local.recipeId)?.name ?? 'レシピ'
      content = (
        <RecipeDetail
          recipeId={local.recipeId}
          state={state}
          onCook={() => onRecord({ recipeId: local.recipeId })}
          onOpenMemory={(memory) => {
            setReturnRecipeId(local.recipeId)
            if (memory.record) setLocal({ type: 'mealRecord', recordId: memory.record.id })
            else if (memory.meal) setLocal({ type: 'meal', meal: memory.meal })
          }}
        />
      )
      break
    case 'meal':
    case 'mealRecord': {
      const meal =
        local.type === 'meal'
          ? state.meals.find((entry) => entry.id === local.meal.id)
          : (state.meals.find(
              (entry) => entry.mealRecordId === local.recordId && (entry.photo || entry.photoId),
            ) ?? state.meals.find((entry) => entry.mealRecordId === local.recordId))
      const recordId = local.type === 'mealRecord' ? local.recordId : meal?.mealRecordId
      const record = state.mealRecords?.find((entry) => entry.id === recordId)
      const sharedMeals = record
        ? state.meals.filter((entry) => entry.mealRecordId === record.id)
        : []
      const sharedWith = new Set(sharedMeals.map((entry) => entry.targetId))
      const canShare =
        record?.day === state.today &&
        [...state.companions.map((entry) => entry.id), ...state.visitors].some(
          (id) => !sharedWith.has(id),
        )
      title = record?.title ?? meal?.title ?? 'ごはんの記録'
      content = (
        <MealDetail
          meal={meal}
          record={record}
          sharedMeals={sharedMeals}
          today={state.today}
          busy={busy}
          onSave={
            record
              ? (input, onSuccess) =>
                  runCommand({ type: 'updateMealRecord', id: record.id, input }, () => {
                    onToast('食事の記録を更新しました')
                    onSuccess()
                  })
              : undefined
          }
          onShare={record && canShare ? () => onRecord({ mealRecordId: record.id }) : undefined}
        />
      )
      break
    }
    case 'item': {
      const item = local.item
      title = item.name
      content = (
        <ItemDetail
          state={state}
          item={item}
          busy={busy}
          guided={state.tutorial.status === 'completed' && state.tutorial.homeGuide === 'shop'}
          onDismissGuide={() => runCommand({ type: 'tutorial', input: { homeGuide: 'done' } })}
          onUse={() =>
            runCommand(
              { type: state.owned.includes(item.id) ? 'equip' : 'purchase', id: item.id },
              () => {
                onToast(`${item.name}を設定しました`)
                leave('room')
              },
            )
          }
        />
      )
      break
    }
    case 'profile': {
      const speciesId = local.speciesId ?? state.activeId ?? 'komugi'
      title =
        speciesId === state.activeId
          ? state.name
          : species.find((entry) => entry.id === speciesId)!.name
      content = (
        <CompanionProfile
          state={state}
          speciesId={speciesId}
          previewStage={previewStage}
          onPreviewStage={setPreviewStage}
          onShop={() => leave('shop')}
        />
      )
      break
    }
    case 'streak':
      title = '連続記録'
      content = <StreakPanel state={state} onRest={() => setLocal({ type: 'rest' })} />
      break
    case 'rest':
      title = 'おやすみチケット'
      content = (
        <RestPanel
          state={state}
          busy={busy}
          onUse={() =>
            runCommand({ type: 'rest' }, () => {
              onToast('おやすみチケットを使いました')
              close()
            })
          }
        />
      )
      break
    case 'letters':
      title = 'ごはんのお知らせ'
      content = <MealReminder state={state} onRecord={() => onRecord()} />
      break
    case 'settings':
      title = '設定'
      content = (
        <SettingsPanel
          state={state}
          busy={busy}
          isLocal={isLocal}
          onReminderChange={(reminder) =>
            runCommand({ type: 'updateSettings', input: { reminder } })
          }
          onTutorial={onTutorial}
          onHelp={() => setLocal({ type: 'help' })}
        />
      )
      break
    case 'help':
      title = 'あそびかた'
      content = <HelpPanel state={state} onNavigate={leave} />
      break
  }
  const contentKey =
    local.type === 'recipe'
      ? `recipe:${local.recipeId}`
      : local.type === 'mealRecord'
        ? `mealRecord:${local.recordId}`
        : local.type === 'meal'
          ? `meal:${local.meal.id}`
          : local.type === 'item'
            ? `item:${local.item.id}`
            : local.type
  return (
    <Sheet title={title} contentKey={contentKey} onClose={close}>
      <div aria-busy={busy}>
        {returnRecipeId && (local.type === 'meal' || local.type === 'mealRecord') && (
          <button
            type="button"
            className="recipe-memory-back"
            onClick={() => setLocal({ type: 'recipe', recipeId: returnRecipeId })}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            料理カードに戻る
          </button>
        )}
        {content}
      </div>
    </Sheet>
  )
}
