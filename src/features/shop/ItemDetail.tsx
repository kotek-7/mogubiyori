import { GatheringScene, Pet } from '../../ui/art/GameArt'
import { stageOf } from '../../app/game/browserGame'
import type { GameState, Item } from '../../app/game/browserGame'
import { ShopCurrency } from './ShopCurrency'

export function ItemDetail({
  state,
  item,
  busy,
  onUse,
}: {
  state: GameState
  item: Item
  busy: boolean
  onUse: () => void
}) {
  const active = state.companions.find((entry) => entry.id === state.activeId)
  const activeStage = stageOf(active?.xp ?? 0)
  const activeSpecies = state.activeId ?? 'komugi'
  const owned = state.owned.includes(item.id)
  const equipped = state.equipped[item.kind] === item.id
  const enough = state[item.currency] >= item.price
  return (
    <div className="item-detail">
      <div className="item-preview">
        {item.kind === 'room' && <GatheringScene variant={item.id} />}
        <Pet
          species={activeSpecies}
          stage={activeStage}
          mood="happy"
          hat={item.kind === 'hat' ? item.id : state.equipped.hat}
          neck={item.kind === 'neck' ? item.id : state.equipped.neck}
          bag={item.kind === 'bag' ? item.id : state.equipped.bag}
        />
      </div>
      <p>{item.description}</p>
      {!owned && (
        <div className="purchase-price">
          <ShopCurrency kind={item.currency} amount={item.price} />
          <small>所持数 {state[item.currency]}</small>
        </div>
      )}
      <button
        className="primary-button full"
        disabled={busy || equipped || (!owned && !enough)}
        onClick={onUse}
      >
        {equipped ? '使用中' : owned ? '使う' : enough ? '購入して使う' : 'コインが足りません'}
      </button>
      {!owned && !enough && (
        <small className="purchase-hint">
          あと {item.price - state.coins} コイン。ごはんの記録や毎日のログインで貯められます。
        </small>
      )}
    </div>
  )
}
