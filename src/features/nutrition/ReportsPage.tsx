import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useGameUi } from '../../app/gameUi'
import { useMealHistory } from '../album/useMealHistory'
import { TodayMealReport, WeekMealReport } from './MealReports'
import { mealDayLabel } from './mealReportLabels'

export function ReportsPage() {
  const { openMeal, navigate } = useGameUi()
  const {
    state,
    legacyMeals,
    selectedDay,
    weekEnd,
    reports,
    report,
    selectDate,
    moveWeek,
    showToday,
  } = useMealHistory('reports')
  const hasWeekMeals = reports.some((day) => day.mealCount > 0)
  const hasWeekLegacy = legacyMeals.some(
    (meal) => meal.day >= reports[0].day && meal.day <= weekEnd,
  )

  return (
    <div className="meal-history meal-reports-page">
      <div className="play-page-heading">
        <h1>自炊レポート</h1>
      </div>
      <p className="meal-page-description">
        自炊を続けた日と、ごはんのバランスを振り返れます。グラフの日付を選ぶと、その日の詳しい内容を見られます。
      </p>
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
      {!hasWeekMeals && (
        <section className="meal-reports-empty" aria-label="レポートの記録案内">
          <h2>
            {hasWeekLegacy
              ? '以前の記録も、記録画面から見られます'
              : 'この7日間の記録はまだありません'}
          </h2>
          <p>
            {hasWeekLegacy
              ? '以前の記録には食品の内訳がないため、バランスの判定には含めていません。これからの自炊を記録すると、ここに少しずつ積み重なります。'
              : '作った料理を記録すると、自炊した日や食べたものの変化が見えてきます。'}
          </p>
          <button type="button" className="primary-button" onClick={() => openMeal()}>
            自炊を記録する
          </button>
        </section>
      )}
      <WeekMealReport
        reports={reports}
        selectedDay={selectedDay}
        onSelectDay={selectDate}
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
        <button
          type="button"
          disabled={selectedDay === state.today && weekEnd === state.today}
          onClick={showToday}
        >
          今日へ
        </button>
      </div>
      <div className="meal-report-selected-heading">
        <span>{mealDayLabel(selectedDay)}を振り返る</span>
        <button
          type="button"
          className="meal-report-link"
          onClick={() => navigate('album', { day: selectedDay, end: weekEnd })}
        >
          この日の記録を見る
        </button>
      </div>
      <TodayMealReport report={report} />
    </div>
  )
}
