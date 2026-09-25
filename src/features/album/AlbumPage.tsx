import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DishArt } from '../../ui/art/GameArt'
import { MealArtwork } from './MealArtwork'
import { species } from '../../app/game/browserGame'
import { useGameUi } from '../../app/gameUi'
import { mealSlotLabels, mealSourceLabels } from '../../../shared/meals/types'
import { mealDayLabel } from '../nutrition/mealReportLabels'
import { useMealHistory } from './useMealHistory'

export function AlbumPage() {
  const { setDialog, openMeal, navigate } = useGameUi()
  const {
    state,
    records,
    legacyMeals,
    selectedDay,
    weekEnd,
    dayRecords,
    dayLegacyMeals,
    reports,
    selectDate,
    moveWeek,
    showToday,
  } = useMealHistory('album')

  return (
    <div className="meal-history">
      <div className="play-page-heading">
        <h1>ごはんの記録</h1>
        <span>{records.length + legacyMeals.length}件</span>
      </div>
      <div className="meal-page-intro">
        <p>作った料理を、写真といっしょに。日付を選んで、いつもの自炊を振り返れます。</p>
        <button type="button" className="primary-button" onClick={() => openMeal()}>
          <Plus size={18} />
          自炊を記録する
        </button>
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
      <div className="meal-history-strip" role="group" aria-label="7日間の記録">
        {reports.map((report) => {
          const legacyCount = legacyMeals.filter((meal) => meal.day === report.day).length
          return (
            <button
              key={report.day}
              type="button"
              aria-pressed={selectedDay === report.day}
              aria-label={`${mealDayLabel(report.day)}、記録 ${report.mealCount}食${legacyCount ? `、以前の記録 ${legacyCount}件` : ''}`}
              onClick={() => selectDate(report.day)}
            >
              <span>{report.day.slice(5).replace('-', '/')}</span>
              <strong>
                {report.mealCount
                  ? `${report.mealCount}食`
                  : legacyCount
                    ? '以前の記録'
                    : '記録なし'}
              </strong>
              {!!legacyCount && <small>{legacyCount}件</small>}
            </button>
          )
        })}
      </div>
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
        <button
          type="button"
          disabled={selectedDay === state.today && weekEnd === state.today}
          onClick={showToday}
        >
          今日へ
        </button>
      </div>
      <section className="meal-history-day" aria-label={`${mealDayLabel(selectedDay)}の食事`}>
        <div className="meal-history-day-heading">
          <h2>{mealDayLabel(selectedDay)}の食事</h2>
          <button
            type="button"
            className="meal-report-link"
            onClick={() => navigate('reports', { day: selectedDay, end: weekEnd })}
          >
            この日のレポートを見る
          </button>
        </div>
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
            <p>
              {selectedDay === state.today
                ? '今日作った料理を、上の「自炊を記録する」から残しましょう。'
                : '日付を選ぶと、その日に作った料理を見られます。'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
