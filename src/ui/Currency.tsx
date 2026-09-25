import { Coins } from 'lucide-react'

export function Currency({ kind, amount }: { kind: 'coins'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      <Coins size={17} />
      <strong key={amount}>{amount.toLocaleString()}</strong>
    </span>
  )
}
