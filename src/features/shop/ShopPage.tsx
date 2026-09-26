import { VillageSign } from '../../ui/art/GameMotifs'
import { Check } from 'lucide-react'
import { Pet, ItemArt } from '../../ui/art/GameArt'
import { Currency } from '../../ui/Currency'
import { items, stageOf } from '../../app/game/browserGame'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'
import { motion, useReducedMotion } from 'motion/react'
import { CategoryPanel, CategoryTabs } from '../../ui/motion/CategoryTabs'
import { PlayGuide } from '../tutorial/PlayGuide'
import './shop-guide.css'

export function ShopPage() {
  const { state } = useGameSession()
  const { shopKind, setShopKind, setDialog, showShopGuide, dismissHomeGuide } = useGameUi()
  const reducedMotion = useReducedMotion()
  const stage = stageOf(state.xp)
  const shopItems = items.filter((item) => item.kind === shopKind)
  const unownedItems = shopItems.filter((item) => !state.owned.includes(item.id))
  const guideItem = unownedItems.find((item) => item.price <= state.coins) ?? unownedItems[0]
  const visibleItems =
    showShopGuide && guideItem
      ? [guideItem, ...shopItems.filter((item) => item.id !== guideItem.id)]
      : shopItems
  return (
    <>
      <div className="play-page-heading">
        <h1>おみせ</h1>
        <VillageSign kind="shop" />
      </div>
      {showShopGuide && (
        <div className="shop-guide">
          <PlayGuide id="shop-item-guide" label="おみせのガイド" onDismiss={dismissHomeGuide}>
            いま持っているのは{state.coins}コイン。好きなアイテムを選んで、お買い物してみましょう。
          </PlayGuide>
        </div>
      )}
      <CategoryTabs
        label="おみせのカテゴリ"
        value={shopKind}
        onChange={setShopKind}
        options={[
          { value: 'hat', label: 'ぼうし' },
          { value: 'neck', label: 'くびもと' },
          { value: 'bag', label: 'かばん' },
          { value: 'room', label: 'ひろば' },
        ]}
      />
      <CategoryPanel
        category={shopKind}
        className={`shop-grid${showShopGuide ? ' is-guided' : ''}`}
      >
        {visibleItems.map((item, index) => {
          const owned = state.owned.includes(item.id),
            equipped = state.equipped[item.kind] === item.id
          const guided = showShopGuide && item.id === guideItem?.id
          return (
            <motion.button
              className={`shop-card ${equipped ? 'is-equipped' : ''}${guided ? ' is-guide-target' : ''}`}
              key={item.id}
              aria-describedby={guided ? 'shop-item-guide-text' : undefined}
              onClick={() => setDialog({ type: 'item', item })}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.2,
                delay: reducedMotion ? 0 : Math.min(index, 5) * 0.025,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="item-art">
                {item.id === 'none' || item.id === 'neck-none' || item.id === 'bag-none' ? (
                  <Pet
                    species={state.activeId ?? 'komugi'}
                    stage={stage}
                    mood="happy"
                    hat={item.kind === 'hat' ? item.id : state.equipped.hat}
                    neck={item.kind === 'neck' ? item.id : state.equipped.neck}
                    bag={item.kind === 'bag' ? item.id : state.equipped.bag}
                  />
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
            </motion.button>
          )
        })}
      </CategoryPanel>
    </>
  )
}
