import { Coins } from 'lucide-react'

export function ShopCurrency({ kind, amount }: { kind: 'coins'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      <Coins size={18} />
      <strong>{amount.toLocaleString()}</strong>
      <span className="sr-only">コイン</span>
    </span>
  )
}
