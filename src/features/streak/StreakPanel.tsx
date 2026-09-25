import { Check, Flame, Moon } from 'lucide-react'
import { ItemArt } from '../../ui/art/GameArt'
import {
  fedToday,
  items,
  REST_TICKET_STREAK_INTERVAL,
  shiftDay,
  streakOf,
} from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'

export function StreakPanel({ state, onRest }: { state: GameState; onRest: () => void }) {
  const streak = streakOf(state)
  const daysUntilTicket = REST_TICKET_STREAK_INTERVAL - (streak % REST_TICKET_STREAK_INTERVAL)
  return (
    <div className="streak-sheet">
      <div className="big-streak">
        <Flame size={36} />
        <strong>{streak}</strong>
        <span>日連続</span>
      </div>
      <div className="streak-week">
        {Array.from({ length: 7 }, (_, index) => {
          const day = shiftDay(state.today, index - 6)
          const cooked = state.meals.some((meal) => meal.day === day)
          const rested = state.rests.includes(day)
          return (
            <div
              key={day}
              aria-label={`${day} ${cooked ? 'ごはんをあげた' : rested ? 'おやすみ' : 'まだ'}`}
            >
              <small>
                {new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(
                  new Date(`${day}T12:00:00+09:00`),
                )}
              </small>
              <span className={cooked ? 'cooked' : rested ? 'rested' : ''}>
                {cooked ? (
                  <Check size={17} />
                ) : rested ? (
                  <Moon size={15} />
                ) : (
                  <i className="day-dot" />
                )}
              </span>
            </div>
          )
        })}
      </div>
      <div className="streak-gift streak-ticket-gift">
        <Moon aria-hidden="true" />
        <div>
          <small>連続記録 {REST_TICKET_STREAK_INTERVAL} 日ごとに1枚</small>
          <strong>おやすみチケット {state.tickets} 枚</strong>
          <span>次の1枚まで あと {daysUntilTicket} 日</span>
        </div>
      </div>
      <div className="streak-gift">
        <ItemArt id="sprout" />
        <div>
          <small>7日のおくりもの</small>
          <strong>{items.find((item) => item.id === 'sprout')?.name}</strong>
          <span>
            {state.owned.includes('sprout') ? '受け取り済み' : `あと ${Math.max(0, 7 - streak)} 日`}
          </span>
        </div>
      </div>
      {!fedToday(state) && !state.rests.includes(state.today) && (
        <button className="quiet-button rest-link" onClick={onRest}>
          <Moon size={15} />
          おやすみチケットを使う
        </button>
      )}
    </div>
  )
}
