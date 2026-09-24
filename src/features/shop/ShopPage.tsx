import { VillageSign } from '../../ui/art/GameMotifs'
import { Check } from 'lucide-react'
import { Pet, ItemArt } from '../../ui/art/GameArt'
import { Currency } from '../../ui/Currency'
import { items, stageOf } from '../../app/game/browserGame'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'

export function ShopPage() {
  const { state } = useGameSession()
  const { shopKind, setShopKind, setDialog } = useGameUi()
  const stage = stageOf(state.xp)
  return (
    <>
      <div className="play-page-heading">
        <h1>おみせ</h1>
        <VillageSign kind="shop" />
      </div>
      <div className="play-book-tabs" role="group" aria-label="おみせのカテゴリ">
        <button aria-pressed={shopKind === 'hat'} onClick={() => setShopKind('hat')}>
          ぼうし
        </button>
        <button aria-pressed={shopKind === 'room'} onClick={() => setShopKind('room')}>
          ひろば
        </button>
      </div>
      <div className="shop-grid">
        {items
          .filter((item) => item.kind === shopKind)
          .map((item) => {
            const owned = state.owned.includes(item.id),
              equipped = state.equipped[item.kind] === item.id
            return (
              <button
                className={`shop-card ${equipped ? 'is-equipped' : ''}`}
                key={item.id}
                onClick={() => setDialog({ type: 'item', item })}
              >
                <div className="item-art">
                  {item.id === 'none' ? (
                    <Pet species={state.activeId!} stage={stage} mood="happy" />
                  ) : (
                    <ItemArt id={item.id} />
                  )}
                  {equipped && (
                    <span className="equipped-label">
                      <Check size={12} />
                      使用中
                    </span>
                  )}
                </div>
                <strong>{item.name}</strong>
                <span className="item-price">
                  {owned ? (
                    <span className="owned-label">所持済み</span>
                  ) : (
                    <Currency kind={item.currency} amount={item.price} />
                  )}
                </span>
              </button>
            )
          })}
      </div>
    </>
  )
}
