import { useState } from 'react'
import { Coins, Sparkles } from 'lucide-react'
import type { GameMeal } from '../../app/game/browserGame'
import { species } from '../../app/game/browserGame'
import type { MealRecord, MealRecordInput } from '../../../shared/meals/types'
import {
  foodGroupLabels,
  mealPortionLabels,
  mealSlotLabels,
  mealSourceLabels,
} from '../../../shared/meals/types'
import { MealRecordFields } from '../meal/MealRecordFields'
import { mealDayLabel } from '../nutrition/mealReportLabels'
import { MealArtwork } from './MealArtwork'

type EditInput = MealRecordInput & { title: string; day: string }

export function MealDetail({
  meal,
  record,
  sharedMeals = [],
  today,
  busy = false,
  onSave,
  onShare,
}: {
  meal?: GameMeal
  record?: MealRecord
  sharedMeals?: GameMeal[]
  today: string
  busy?: boolean
  onSave?: (input: EditInput, onSuccess: () => void) => void
  onShare?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(record?.title ?? '')
  const [day, setDay] = useState(record?.day ?? today)
  const [value, setValue] = useState<MealRecordInput>(
    record ?? { slot: 'unknown', source: 'unknown', items: [] },
  )
  function edit() {
    if (!record) return
    setTitle(record.title)
    setDay(record.day)
    setValue({
      slot: record.slot,
      source: record.source,
      items: record.items.map((item) => ({ ...item, groups: [...item.groups] })),
    })
    setEditing(true)
  }
  if (editing && record && onSave) {
    return (
      <form
        className="meal-record-editor"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ ...value, title: title.trim(), day }, () => setEditing(false))
        }}
      >
        <label>
          食事の名前
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={80}
            disabled={busy}
          />
        </label>
        <label>
          食べた日
          <input
            type="date"
            value={day}
            max={today}
            onChange={(event) => setDay(event.target.value)}
            required
            disabled={busy}
          />
        </label>
        <MealRecordFields value={value} onChange={setValue} disabled={busy} />
        <p className="meal-report-note">
          食事の内容とレポートを更新します。もぐが受け取ったXPやコインは変わりません。
        </p>
        <div className="meal-record-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={
              busy ||
              !title.trim() ||
              !day ||
              day > today ||
              !value.items.length ||
              value.items.some((item) => !item.name.trim())
            }
          >
            {busy ? '保存中…' : '変更を保存'}
          </button>
          <button
            className="meal-report-link"
            type="button"
            disabled={busy}
            onClick={() => setEditing(false)}
          >
            編集をやめる
          </button>
        </div>
      </form>
    )
  }
  if (!record && !meal) return <p>この食事の記録が見つかりません。</p>
  return (
    <div className="meal-view">
      {meal && (
        <div className="meal-view-art">
          <MealArtwork meal={meal} />
        </div>
      )}
      <p>{mealDayLabel(record?.day ?? meal!.day)}のごはん</p>
      {record ? (
        <>
          <div className="meal-record-meta">
            <span>{mealSlotLabels[record.slot]}</span>
            <span>{mealSourceLabels[record.source]}</span>
          </div>
          <ul className="meal-record-items" aria-label="食べた料理">
            {record.items.map((item, index) => (
              <li key={index}>
                <strong>{item.name}</strong>
                <span>{mealPortionLabels[item.portion]}</span>
                <small>
                  {item.groups.length
                    ? `${item.groups.map((group) => foodGroupLabels[group]).join('・')}${item.groupsConfirmed ? '' : '（料理からの目安）'}`
                    : item.groupsConfirmed
                      ? '食品群なし'
                      : '食品群は未設定'}
                </small>
              </li>
            ))}
          </ul>
          {sharedMeals.length > 0 && (
            <ul className="meal-share-list" aria-label="この食事を分けたなかま">
              {sharedMeals.map((shared) => (
                <li key={shared.id}>
                  <span>
                    {species.find((entry) => entry.id === shared.targetId)?.name ?? 'なかま'}
                  </span>
                  <span>
                    +{shared.xp} XP · {shared.coins}コイン
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="meal-record-actions">
            {onSave && (
              <button className="primary-button" type="button" onClick={edit} disabled={busy}>
                記録を編集
              </button>
            )}
            {onShare && (
              <button className="meal-report-link" type="button" onClick={onShare} disabled={busy}>
                この食事をほかのもぐに分ける
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="meal-report-note">
            以前の記録・未判定
            <br />
            食品の内訳がないため、バランスの判定には含めていません。
          </p>
          <div className="meal-rewards">
            <span>
              <Sparkles size={18} />+{meal!.xp} XP
            </span>
            <span>
              <Coins size={18} />+{meal!.coins}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
