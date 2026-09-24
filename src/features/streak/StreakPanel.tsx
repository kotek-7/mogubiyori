import { Check, Flame, Moon } from 'lucide-react'
import { ItemArt } from '../../ui/art/GameArt'
import { fedToday, items, shiftDay, streakOf } from '../../app/game/browserGame'
import type { GameState } from '../../app/game/browserGame'

export function StreakPanel({ state, onRest }: { state: GameState; onRest: () => void }) {
  return (
    <div className="streak-sheet">
      <div className="big-streak">
        <Flame size={36} />
        <strong>{streakOf(state)}</strong>
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
      <div className="streak-gift">
        <ItemArt id="sprout" />
        <div>
          <small>7日のおくりもの</small>
          <strong>{items.find((item) => item.id === 'sprout')?.name}</strong>
          <span>
            {state.owned.includes('sprout')
              ? '受け取り済み'
              : `あと ${Math.max(0, 7 - streakOf(state))} 日`}
          </span>
        </div>
      </div>
      {!fedToday(state) && !state.rests.includes(state.today) && (
        <button className="quiet-button rest-link" onClick={onRest}>
          <Moon size={15} />
          おやすみチケット
          <span>チケット {state.tickets} 枚</span>
        </button>
      )}
    </div>
  )
}
