import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DishArt } from '../../ui/art/GameArt'
import { MealArtwork } from './MealArtwork'
import { species } from '../../app/game/browserGame'
import { useGameSession } from '../../app/game/useGameSession'
import { useGameUi } from '../../app/gameUi'
import { dailyMealReport, weekMealReports } from '../../../shared/meals/analysis'
import { mealSlotLabels, mealSourceLabels } from '../../../shared/meals/types'
import { TodayMealReport, WeekMealReport } from '../nutrition/MealReports'
import { mealDayLabel } from '../nutrition/mealReportLabels'

function shiftDay(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export function AlbumPage() {
  const { state } = useGameSession()
  const { setDialog, openMeal } = useGameUi()
  const [selectedDay, setSelectedDay] = useState(state.today)
  const [weekEnd, setWeekEnd] = useState(state.today)
  const records = state.mealRecords ?? []
  const recordIds = new Set(records.map((record) => record.id))
  const legacyMeals = state.meals.filter(
    (meal) => !meal.mealRecordId || !recordIds.has(meal.mealRecordId),
  )
  const dayRecords = records.filter((record) => record.day === selectedDay)
  const dayLegacyMeals = legacyMeals.filter((meal) => meal.day === selectedDay)
  const reports = weekMealReports(records, weekEnd)
  const report = dailyMealReport(records, selectedDay)
  function selectDate(day: string) {
    if (!day || day > state.today) return
    setSelectedDay(day)
    if (day < reports[0].day || day > weekEnd) setWeekEnd(day)
  }
  function moveWeek(amount: number) {
    const day = shiftDay(weekEnd, amount)
    const end = day > state.today ? state.today : day
    setWeekEnd(end)
    setSelectedDay(end)
  }

  return (
    <div className="meal-history">
      <div className="play-page-heading">
        <h1>ごはんの記録</h1>
        <span>{records.length + legacyMeals.length}件</span>
      </div>
      <div className="meal-history-period">
        <button type="button" aria-label="前の7日間" onClick={() => moveWeek(-7)}>
          <ChevronLeft size={20} />
        </button>
        <span>
          {mealDayLabel(reports[0].day)}〜{mealDayLabel(weekEnd)}
        </span>
        <button
          type="button"
          aria-label="次の7日間"
          disabled={weekEnd >= state.today}
          onClick={() => moveWeek(7)}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <WeekMealReport
        reports={reports}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        legacyDays={legacyMeals.map((meal) => meal.day)}
      />
      <div className="meal-history-date">
        <label>
          表示する日
          <input
            type="date"
            value={selectedDay}
            max={state.today}
            onChange={(event) => selectDate(event.target.value)}
          />
        </label>
        {selectedDay !== state.today && (
          <button type="button" onClick={() => selectDate(state.today)}>
            今日へ
          </button>
        )}
      </div>
      <TodayMealReport report={report} />
      <section className="meal-history-day" aria-label={`${mealDayLabel(selectedDay)}の食事`}>
        <h2>{mealDayLabel(selectedDay)}の食事</h2>
        <div className="album-grid">
          {dayRecords.map((record) => {
            const meals = state.meals.filter((meal) => meal.mealRecordId === record.id)
            const recipients = [
              ...new Set(
                meals
                  .map((meal) => species.find((entry) => entry.id === meal.targetId)?.name)
                  .filter(Boolean),
              ),
            ]
            return (
              <button
                key={record.id}
                className="memory-card"
                onClick={() => setDialog({ type: 'mealRecord', recordId: record.id })}
              >
                <div className="memory-photo">
                  {meals[0] ? <MealArtwork meal={meals[0]} /> : <DishArt kind="rice" />}
                  <span>{mealSlotLabels[record.slot]}</span>
                </div>
                <strong>{record.title}</strong>
                <small>
                  {mealSourceLabels[record.source]} · {record.items.length}品
                </small>
                {recipients.length > 0 && <small>{recipients.join('・')}に分けた</small>}
              </button>
            )
          })}
          {dayLegacyMeals.map((meal) => (
            <button
              key={meal.id}
              className="memory-card"
              onClick={() => setDialog({ type: 'meal', meal })}
            >
              <div className="memory-photo">
                <MealArtwork meal={meal} />
                <span>以前の記録</span>
              </div>
              <strong>{meal.title}</strong>
              <small>以前の記録・未判定</small>
              <small>
                {species.find((entry) => entry.id === meal.targetId)?.name ?? 'なかま'} · +{meal.xp}{' '}
                XP
              </small>
            </button>
          ))}
        </div>
        {dayLegacyMeals.length > 0 && (
          <p className="meal-report-note">
            以前の記録には食品の内訳がないため、バランスの判定には含めていません。
          </p>
        )}
        {!dayRecords.length && !dayLegacyMeals.length && (
          <div className="empty-state">
            <DishArt kind="rice" />
            <h3>この日の記録はまだありません</h3>
            {selectedDay === state.today && (
              <button className="primary-button" onClick={() => openMeal()}>
                ごはんを記録する
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
