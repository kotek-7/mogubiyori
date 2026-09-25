import { useId } from 'react'
import type { DailyMealReport, FoodGroup } from '../../../shared/meals/types'
import { foodGroupLabels } from '../../../shared/meals/types'
import { mealDayLabel } from './mealReportLabels'

const groups: FoodGroup[] = ['staple', 'protein', 'vegetable', 'fruit', 'dairy']

function feedback(report: DailyMealReport) {
  if (!report.mealCount) return '食べたものを記録すると、その日のごはんを振り返れます。'
  if (!report.scoredMealCount)
    return '食べたものを記録できました。間食は食品の一覧で振り返れます。食事の内訳がわかれば、記録から食品を選んでみましょう。'
  if (!report.groupCounts.vegetable)
    return '記録には野菜がまだありません。次の食事に、野菜のおかずや汁ものを添えてみましょう。'
  if (!report.groupCounts.protein)
    return '記録にはたんぱく質のおかずがまだありません。卵、豆腐、魚などから一品添えてみましょう。'
  if (!report.groupCounts.staple)
    return '記録には主食がまだありません。ごはんやパン、麺なども一緒に記録してみましょう。'
  if (!report.groupCounts.fruit && !report.groupCounts.dairy)
    return '今日は主食・おかず・野菜を記録できました。間食には果物やヨーグルトも選べます。'
  return 'いろいろな食品を記録できました。次の食事も、食べたものをそのまま残してみましょう。'
}

export function TodayMealReport({
  report,
  onViewRecords,
}: {
  report: DailyMealReport
  onViewRecords?: () => void
}) {
  const headingId = useId()
  return (
    <section className="meal-report" aria-labelledby={headingId}>
      <div className="meal-report-heading">
        <div>
          <span>{mealDayLabel(report.day)}</span>
          <h2 id={headingId}>ごはんのバランス</h2>
        </div>
        <div
          className="meal-report-score"
          role="group"
          aria-label={report.score === null ? '未判定' : `${report.score}点 / 100点`}
        >
          <strong>{report.score ?? '—'}</strong>
          <span>{report.score === null ? '未判定' : '/ 100'}</span>
        </div>
      </div>
      <div className="meal-report-counts">
        <span>記録 {report.mealCount}食</span>
        <span>判定 {report.scoredMealCount}食</span>
        <span>自炊 {report.homeMealCount}食</span>
      </div>
      <ul className="meal-report-groups" aria-label="記録した食品群">
        {groups.map((group) => (
          <li key={group} className={report.groupCounts[group] ? 'is-recorded' : ''}>
            <span>{foodGroupLabels[group]}</span>
            <strong>
              {report.groupCounts[group] || report.scoredMealCount
                ? `${report.groupCounts[group]}食`
                : '—'}
            </strong>
          </li>
        ))}
      </ul>
      <p className="meal-report-feedback">{feedback(report)}</p>
      <p className="meal-report-note">
        食事ごとの主食・おかず・野菜のそろい具合を平均しています。間食と、食品がすべて未設定の食事は点数に含めません。
      </p>
      <details className="meal-report-method">
        <summary>点数の見方</summary>
        <p>
          主食は30点、肉・魚・卵・豆は30点、野菜・きのこ・海藻は40点です。食品の種類を振り返る目安で、食べた量やカロリーを表すものではありません。果物・乳製品は食品の一覧に数えています。
        </p>
      </details>
      {onViewRecords && (
        <button className="meal-report-link" type="button" onClick={onViewRecords}>
          ごはんの記録を見る
        </button>
      )}
    </section>
  )
}

export function WeekMealReport({
  reports,
  selectedDay,
  onSelectDay,
  legacyDays = [],
}: {
  reports: DailyMealReport[]
  selectedDay: string
  onSelectDay: (day: string) => void
  legacyDays?: string[]
}) {
  const homeDays = reports.filter((report) => report.homeMealCount > 0).length
  const recordedDays = reports.filter((report) => report.mealCount > 0).length
  return (
    <section className="meal-week" aria-label="7日間のごはんバランス">
      <div className="meal-week-heading">
        <h2>7日間のごはん</h2>
        <span>
          自炊した日 {homeDays}日 · 記録した日 {recordedDays}日
        </span>
      </div>
      <div className="meal-week-chart">
        {reports.map((report) => {
          const legacyOnly = !report.mealCount && legacyDays.includes(report.day)
          const status =
            report.score !== null
              ? `${report.score}点`
              : report.mealCount || legacyOnly
                ? '未判定'
                : '未記録'
          return (
            <button
              key={report.day}
              type="button"
              className="meal-week-day"
              aria-pressed={selectedDay === report.day}
              aria-label={`${mealDayLabel(report.day)}、${legacyOnly ? '以前の記録・' : ''}${status}、記録 ${report.mealCount}食、判定 ${report.scoredMealCount}食`}
              onClick={() => onSelectDay(report.day)}
            >
              <span className="meal-week-value">{report.score ?? '—'}</span>
              <span className="meal-week-track" aria-hidden="true">
                {report.score !== null && (
                  <span className="meal-week-bar" style={{ height: `${report.score}%` }} />
                )}
              </span>
              <span className="meal-week-date">{report.day.slice(5).replace('-', '/')}</span>
              <span className="meal-week-status">{report.score === null ? status : '判定済'}</span>
            </button>
          )
        })}
      </div>
      <p className="meal-report-note">
        日付を選ぶと、その日の食事が見られます。未記録の日には点数を付けません。
      </p>
      <details className="meal-report-method meal-week-foods">
        <summary>食べたものの推移</summary>
        <table>
          <caption>食品を含む食事の数（食）</caption>
          <thead>
            <tr>
              <th scope="col">食品</th>
              {reports.map((report) => (
                <th key={report.day} scope="col" aria-label={mealDayLabel(report.day)}>
                  {Number(report.day.slice(8))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group}>
                <th scope="row">{foodGroupLabels[group]}</th>
                {reports.map((report) => (
                  <td key={report.day}>
                    {report.scoredMealCount || Object.values(report.groupCounts).some(Boolean)
                      ? report.groupCounts[group]
                      : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>間食も含めた一覧です。未記録の日や、食品の内訳がまだない日は「—」で表示します。</p>
      </details>
    </section>
  )
}
