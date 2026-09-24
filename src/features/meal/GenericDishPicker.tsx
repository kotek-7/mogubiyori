import { genericDishes } from '../../../shared/content/dishes'

export function GenericDishPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string
  onSelect: (id: string) => void
}) {
  return (
    <fieldset className="meal-generic-dishes">
      <legend>料理の種類で選ぶ</legend>
      <p>具材や味付けが違っても、この名前で記録できます。</p>
      <div>
        {genericDishes.map((dish) => (
          <button
            key={dish.id}
            type="button"
            aria-label={`${dish.name}として記録`}
            aria-pressed={selectedId === dish.id}
            onClick={() => onSelect(dish.id)}
          >
            {dish.name}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
