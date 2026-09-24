import { Coins, Gem } from 'lucide-react'

export function ShopCurrency({ kind, amount }: { kind: 'coins' | 'gems'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      {kind === 'coins' ? <Coins size={18} /> : <Gem size={18} />}
      <strong>{amount.toLocaleString()}</strong>
      <span className="sr-only">{kind === 'coins' ? 'コイン' : 'ジェム'}</span>
    </span>
  )
}
