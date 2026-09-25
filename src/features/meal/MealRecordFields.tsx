import {
  foodGroupLabels,
  mealPortionLabels,
  mealSlotLabels,
  mealSourceLabels,
} from '../../../shared/meals/types'
import type { FoodGroup, MealItem, MealRecordInput } from '../../../shared/meals/types'

export function MealRecordFields({
  value,
  onChange,
  disabled = false,
}: {
  value: MealRecordInput
  onChange: (value: MealRecordInput) => void
  disabled?: boolean
  primaryChoiceId?: string
}) {
  function updateItem(index: number, changes: Partial<MealItem>) {
    onChange({
      ...value,
      items: value.items.map((item, position) =>
        position === index ? { ...item, ...changes } : item,
      ),
    })
  }
  return (
    <div className="meal-record-fields">
      <div className="meal-record-selects">
        <label>
          食事の時間
          <select
            value={value.slot}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, slot: event.target.value as MealRecordInput['slot'] })
            }
          >
            {Object.entries(mealSlotLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          用意のしかた
          <select
            value={value.source}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, source: event.target.value as MealRecordInput['source'] })
            }
          >
            {Object.entries(mealSourceLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="meal-record-help">
        料理に入っていたものを確認できます。わからない項目は未設定のままで大丈夫です。
      </p>
      {value.items.map((item, index) => (
        <fieldset className="meal-record-item" key={index} disabled={disabled}>
          <legend>料理 {index + 1}</legend>
          <label>
            料理 {index + 1} の名前
            <input
              value={item.name}
              maxLength={80}
              required
              placeholder="例：ごはん、みそ汁、サラダ"
              onChange={(event) => updateItem(index, { name: event.target.value })}
            />
          </label>
          <div className="meal-record-groups" role="group" aria-label="食品グループ">
            {(Object.entries(foodGroupLabels) as [FoodGroup, string][]).map(([group, label]) => (
              <label key={group}>
                <input
                  type="checkbox"
                  checked={item.groups.includes(group)}
                  onChange={(event) =>
                    updateItem(index, {
                      groups: event.target.checked
                        ? [...item.groups, group]
                        : item.groups.filter((entry) => entry !== group),
                      groupsConfirmed: true,
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <p className="meal-record-help">
            {item.groupsConfirmed
              ? '確認した内容で集計します。'
              : item.groups.length
                ? '選んだ料理からの目安です。実際の食材に合わせて直せます。'
                : '食品グループが未設定の料理は、スコアの計算を保留します。'}
          </p>
          <label>
            量
            <select
              value={item.portion}
              onChange={(event) =>
                updateItem(index, { portion: event.target.value as MealItem['portion'] })
              }
            >
              {Object.entries(mealPortionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {index > 0 && (
            <button
              type="button"
              className="quiet-button"
              aria-label={`料理 ${index + 1} を削除`}
              onClick={() =>
                onChange({
                  ...value,
                  items: value.items.filter((_, position) => position !== index),
                })
              }
            >
              この一品を削除
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        className="quiet-button meal-record-add"
        disabled={disabled || value.items.length >= 12}
        onClick={() =>
          onChange({
            ...value,
            items: [
              ...value.items,
              { name: '', groups: [], groupsConfirmed: false, portion: 'unknown' },
            ],
          })
        }
      >
        一品追加
      </button>
    </div>
  )
}
