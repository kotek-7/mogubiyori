import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { dailyMealReport } from '../../../shared/meals/analysis'
import type { DailyMealReport } from '../../../shared/meals/types'
import { WeekMealReport } from './MealReports'

const days = [
  '2026-09-19',
  '2026-09-20',
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
]

function populatedReport(day: string): DailyMealReport {
  return {
    day,
    score: 100,
    mealCount: 9,
    scoredMealCount: 9,
    homeMealCount: 9,
    groupCounts: { staple: 9, protein: 9, vegetable: 9, fruit: 9, dairy: 9 },
  }
}

function render(reports: DailyMealReport[], minDay?: string, legacyDays: string[] = []) {
  return renderToStaticMarkup(
    createElement(WeekMealReport, {
      reports,
      selectedDay: '2026-09-25',
      onSelectDay: () => undefined,
      minDay,
      legacyDays,
    }),
  )
}

describe('subscription report visibility', () => {
  it('renders the same locked chart, totals and foods whether older meals exist or not', () => {
    const empty = days.map((day) => dailyMealReport([], day))
    const olderMeals = empty.map((report) =>
      report.day < '2026-09-23' ? populatedReport(report.day) : report,
    )
    expect(render(olderMeals, '2026-09-23', ['2026-09-19'])).toBe(render(empty, '2026-09-23'))
    expect(render(empty, '2026-09-23', ['2026-09-19'])).toBe(render(empty, '2026-09-23'))
    expect(render(olderMeals, '2026-09-23')).toContain('自炊した日 0日 · 記録した日 0日')
  })

  it('includes the boundary day and disables exactly the four older dates', () => {
    const reports = days.map((day) =>
      day === '2026-09-23' ? populatedReport(day) : dailyMealReport([], day),
    )
    const html = render(reports, '2026-09-23')
    expect(html.match(/disabled=""/g)).toHaveLength(4)
    expect(html).toContain('9月23日、100点、記録 9食、判定 9食')
    expect(html).toContain('自炊した日 1日 · 記録した日 1日')
  })

  it('keeps all seven days and legacy markers available without a free-plan boundary', () => {
    const reports = days.map((day) =>
      day === '2026-09-19' ? populatedReport(day) : dailyMealReport([], day),
    )
    const html = render(reports, undefined, ['2026-09-20'])
    expect(html).not.toContain('disabled=""')
    expect(html).toContain('9月19日、100点、記録 9食、判定 9食')
    expect(html).toContain('9月20日、以前の記録・未判定')
  })
})
