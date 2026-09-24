import { Gem, Sparkles } from 'lucide-react'
import { ShopCurrency } from './ShopCurrency'

export function GemShop({
  gems,
  busy,
  isLocal,
  onPurchase,
}: {
  gems: number
  busy: boolean
  isLocal: boolean
  onPurchase: () => void
}) {
  if (!isLocal)
    return (
      <div className="gem-sheet">
        <ShopCurrency kind="gems" amount={gems} />
        <p>ジェムの購入はまだ利用できません。</p>
      </div>
    )
  return (
    <div className="gem-sheet">
      <div className="gem-pile">
        <Gem size={77} />
        <Sparkles size={23} />
      </div>
      <h3>150 ジェム</h3>
      <div className="gem-price">
        ¥320<small>価格イメージ</small>
      </div>
      <button className="primary-button full" disabled={busy} onClick={onPurchase}>
        購入を体験する
      </button>
      <small>
        おためしのため、請求はありません。
        <br />
        ジェムはこの端末だけに追加されます。
      </small>
    </div>
  )
}
