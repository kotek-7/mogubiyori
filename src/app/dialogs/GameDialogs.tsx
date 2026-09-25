import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { recipes, species } from '../game/browserGame'
import type { GameMeal, GameState, GrowthStage, Item, SpeciesId } from '../game/browserGame'
import { RecipeDetail } from '../../features/collection/RecipeDetail'
import { useGameSession } from '../game/useGameSession'
import { Sheet } from '../../ui/Sheet'
import { createOperationId } from '../../lib/operationId'
import type { GameCommand } from '../../../shared/game/commands'
import type { DemoCommand } from '../game/gameGateway'
import { CompanionProfile } from '../../features/companions/CompanionProfile'
import { MealDetail } from '../../features/album/MealDetail'
import { ItemDetail } from '../../features/shop/ItemDetail'
import { GemShop } from '../../features/shop/GemShop'
import { SettingsPanel } from '../../features/settings/SettingsPanel'
import { HelpPanel } from '../../features/settings/HelpPanel'
import { RestPanel } from '../../features/room/RestPanel'
import { MealReminder } from '../../features/room/MealReminder'
import { StreakPanel } from '../../features/streak/StreakPanel'
import type { Page } from '../gameUi'

export type Dialog =
  | { type: 'recipe'; recipeId: string }
  | { type: 'meal'; meal: GameMeal }
  | { type: 'mealRecord'; recordId: string }
  | { type: 'item'; item: Item }
  | { type: 'profile'; speciesId?: SpeciesId }
  | { type: 'settings' | 'streak' | 'gems' | 'rest' | 'letters' | 'help' }

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
  const { execute, demo, gateway, busy } = useGameSession()
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
  function runDemo(command: DemoCommand, onSuccess: () => void) {
    if (isLocal) void perform(() => demo(command), onSuccess)
  }
  const [local, setLocal] = useState<Dialog>(dialog)
  const [reset, setReset] = useState<'seed' | 'fresh' | null>(null)
  const [returnItem, setReturnItem] = useState<Item | null>(null)
  const [previewStage, setPreviewStage] = useState<GrowthStage | null>(null)
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
    case 'mealRecord': {
      const meal =
        local.type === 'meal'
          ? state.meals.find((entry) => entry.id === local.meal.id)
          : state.meals.find((entry) => entry.mealRecordId === local.recordId)
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
          isLocal={isLocal}
          onMoreGems={() => {
            setReturnItem(item)
            setLocal({ type: 'gems' })
          }}
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
    case 'gems':
      title = isLocal ? 'ジェムのおみせ' : 'ジェム'
      content = (
        <GemShop
          gems={state.gems}
          busy={busy}
          isLocal={isLocal}
          onPurchase={() =>
            runDemo({ type: 'addGems' }, () => {
              onToast('150ジェムを受け取りました')
              if (returnItem) setLocal({ type: 'item', item: returnItem })
              else close()
            })
          }
        />
      )
      break
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
          reset={reset}
          onResetChange={setReset}
          onReminderChange={(reminder) =>
            runCommand({ type: 'updateSettings', input: { reminder } })
          }
          onTutorial={onTutorial}
          onHelp={() => setLocal({ type: 'help' })}
          onAdvanceDay={() =>
            runDemo({ type: 'advanceDay' }, () => {
              onToast('翌日になりました')
              leave('room')
            })
          }
          onReset={(preset) =>
            runDemo({ type: 'reset', preset }, () => {
              onToast('育成記録を初期化しました')
              onNavigate('room')
              onClose()
            })
          }
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
      : local.type === 'item'
        ? `item:${local.item.id}`
        : local.type
  return (
    <Sheet title={title} contentKey={contentKey} onClose={close}>
      <div aria-busy={busy}>{content}</div>
    </Sheet>
  )
}
