import { Coins, Gem } from 'lucide-react'

export function Currency({ kind, amount }: { kind: 'coins' | 'gems'; amount: number }) {
  return (
    <span className={`currency ${kind}`}>
      {kind === 'coins' ? <Coins size={17} /> : <Gem size={17} />}
      <strong>{amount.toLocaleString()}</strong>
    </span>
  )
}
