import { useId, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { dishCategories, genericDishes } from '../../../shared/content/dishes'

const pageSize = 12

function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (character) => String.fromCharCode(character.charCodeAt(0) + 0x60))
}

const searchableDishes = genericDishes.map((dish) => ({
  dish,
  searchText: normalizeSearch([dish.name, ...dish.aliases].join(' ')),
}))

export function GenericDishPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string
  onSelect: (id: string) => void
}) {
  const id = useId()
  const picker = useRef<HTMLFieldSetElement>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(() => {
    const index = genericDishes.findIndex((dish) => dish.id === selectedId)
    return Math.floor(Math.max(0, index) / pageSize) + 1
  })
  const matching = useMemo(() => {
    const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean)
    return searchableDishes
      .filter(
        ({ dish, searchText }) =>
          (category === 'all' || dish.category === category) &&
          terms.every((term) => searchText.includes(term)),
      )
      .map(({ dish }) => dish)
  }, [query, category])
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * pageSize
  const visible = matching.slice(firstIndex, firstIndex + pageSize)
  const filtered = query !== '' || category !== 'all'

  function resetFilters() {
    setQuery('')
    setCategory('all')
    setPage(1)
  }

  function changePage(next: number) {
    setPage(next)
    picker.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  return (
    <fieldset className="meal-generic-dishes" ref={picker}>
      <legend>料理の種類で選ぶ</legend>
      <p>具材や味付けが違っても、この名前で記録できます。</p>
      <div className="meal-dish-controls">
        <label htmlFor={`${id}-search`}>
          <span>料理名で検索</span>
          <span className="meal-dish-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              id={`${id}-search`}
              type="search"
              value={query}
              placeholder="例：からあげ、ぎょうざ"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </span>
        </label>
        <label htmlFor={`${id}-category`}>
          <span>種類</span>
          <select
            id={`${id}-category`}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">すべての種類</option>
            {Object.entries(dishCategories).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="meal-dish-summary">
        <p role="status" aria-live="polite" aria-atomic="true">
          {matching.length}種類
          {matching.length > 0 && (
            <span>
              {' '}
              · {firstIndex + 1}〜{firstIndex + visible.length}件目
            </span>
          )}
        </p>
        {filtered && (
          <button type="button" className="meal-dish-reset" onClick={resetFilters}>
            条件をリセット
          </button>
        )}
      </div>
      <div className="meal-dish-list">
        {visible.map((dish) => (
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
      {matching.length === 0 && (
        <div className="meal-dish-empty">
          <p>料理が見つかりませんでした。別の名前でも探せます。</p>
          <button type="button" onClick={resetFilters}>
            すべての料理を見る
          </button>
        </div>
      )}
      {pageCount > 1 && (
        <nav className="meal-dish-pagination" aria-label="料理の種類のページ">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            前のページ
          </button>
          <span>
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => changePage(currentPage + 1)}
          >
            次のページ
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </fieldset>
  )
}
