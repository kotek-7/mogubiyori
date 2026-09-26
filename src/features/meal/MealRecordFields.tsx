import { useId } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { foodGroupLabels, mealPortionLabels, mealSlotLabels } from '../../../shared/meals/types'
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
  const helpId = useId()
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
      <label className="meal-record-time">
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
      <p className="meal-record-help" id={helpId}>
        料理ごとに、含まれる食材と1人分の量を確認できます。わからない項目は未設定のままで大丈夫です。
      </p>
      {value.items.map((item, index) => (
        <fieldset className="meal-record-item" key={index} disabled={disabled}>
          <legend>料理 {index + 1}</legend>
          <p className="meal-record-item-kind">{index === 0 ? '主な料理' : '副菜・汁ものなど'}</p>
          <div className="meal-record-item-basics">
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
            <label>
              量
              <select
                value={item.portion}
                aria-describedby={helpId}
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
          </div>
          <div className="meal-record-group-heading">
            <span>含まれる食材</span>
            <span>複数選べます</span>
          </div>
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
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="meal-record-help">
            {item.groupsConfirmed
              ? '確認した内容で集計します。'
              : item.groups.length
                ? '写真や料理からの目安です。違う食材はチェックを外せます。'
                : 'わかる食材にチェック。未設定でも食事は記録できます。'}
          </p>
          {index > 0 && (
            <button
              type="button"
              className="quiet-button meal-record-remove"
              aria-label={`料理 ${index + 1} を削除`}
              onClick={() =>
                onChange({
                  ...value,
                  items: value.items.filter((_, position) => position !== index),
                })
              }
            >
              <Trash2 size={14} aria-hidden="true" />
              この一品を削除
            </button>
          )}
        </fieldset>
      ))}
      <div className="meal-record-add-row">
        <p className="meal-record-help">ごはん・副菜・汁ものがほかにもあれば追加できます。</p>
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
          <Plus size={17} aria-hidden="true" />
          一品追加
        </button>
      </div>
    </div>
  )
}
