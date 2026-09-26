import { useId, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  Clock3,
  Search,
  Sparkles,
  Utensils,
} from 'lucide-react'
import type { GameState } from '../../app/game/browserGame'
import { recipes } from '../../../shared/content/recipes'
import type { Recipe } from '../../../shared/content/recipes'
import { FREE_RECIPE_IDS } from '../../../shared/content/freeRecipes'
import { RecipeArt } from '../../ui/art/RecipeArt'
import { SubscriptionPrompt } from '../subscription/Subscription'
import { filterFoodEntries, foodCategories, getFoodEntries } from './foodBrowse'
import type { FoodCategory, FoodEntry } from './foodBrowse'

const pageSize = 24
const dishPageSize = 12
const difficultyNames = ['かんたん', 'ひと工夫', 'じっくり']
const rarityNames = { common: 'ノーマル', rare: 'レア', special: 'スペシャル' }

function selectedPage(
  entries: readonly FoodEntry[],
  selectedId: string | undefined,
  kind: FoodEntry['kind'],
  size: number,
) {
  const selected = entries.find((entry) => entry.id === selectedId)
  const index = entries
    .filter((entry) => entry.kind === kind && entry.category === selected?.category)
    .findIndex((entry) => entry.id === selectedId)
  return Math.floor(Math.max(0, index) / size) + 1
}

export function RecipeBrowser({
  state,
  onRecipe,
  mode = 'browse',
  includeDishes = false,
  selectedId,
}: {
  state: GameState
  onRecipe: (id: string) => void
  mode?: 'browse' | 'select'
  includeDishes?: boolean
  selectedId?: string
}) {
  const id = useId()
  const browser = useRef<HTMLDivElement>(null)
  const categoryButtons = useRef<Partial<Record<FoodCategory, HTMLButtonElement | null>>>({})
  const recipeResults = useRef<HTMLElement>(null)
  const dishResults = useRef<HTMLFieldSetElement>(null)
  const entries = useMemo(
    () => getFoodEntries({ subscriptionPlan: state.subscriptionPlan }, includeDishes),
    [state.subscriptionPlan, includeDishes],
  )
  const selected = entries.find((entry) => entry.id === selectedId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | FoodCategory>(selected?.category ?? 'all')
  const [minutes, setMinutes] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [acquired, setAcquired] = useState('all')
  const [page, setPage] = useState(() => selectedPage(entries, selectedId, 'recipe', pageSize))
  const [dishPage, setDishPage] = useState(() =>
    selectedPage(entries, selectedId, 'dish', dishPageSize),
  )
  const cards = useMemo(() => new Set(state.cards), [state.cards])
  const matching = useMemo(
    () => filterFoodEntries(entries, { query, category, minutes, difficulty, acquired }, cards),
    [entries, query, category, minutes, difficulty, acquired, cards],
  )
  const matchingRecipes = matching.filter((entry) => entry.kind === 'recipe')
  if (mode === 'browse') {
    matchingRecipes.sort((left, right) => Number(cards.has(right.id)) - Number(cards.has(left.id)))
  }
  const matchingDishes = matching.filter((entry) => entry.kind === 'dish')
  const categories = (Object.keys(foodCategories) as FoodCategory[]).filter((key) =>
    entries.some((entry) => entry.category === key),
  )
  const hasRecipeFilters = [minutes, difficulty, acquired].some((value) => value !== 'all')
  const overview = category === 'all' && !query.trim() && !hasRecipeFilters
  const filtered = !overview
  const pageCount = Math.max(1, Math.ceil(matchingRecipes.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const dishPageCount = Math.max(1, Math.ceil(matchingDishes.length / dishPageSize))
  const currentDishPage = Math.min(dishPage, dishPageCount)

  function resetPages() {
    setPage(1)
    setDishPage(1)
  }

  function resetFilters() {
    setQuery('')
    setCategory('all')
    setMinutes('all')
    setDifficulty('all')
    setAcquired('all')
    resetPages()
  }

  function selectCategory(value: 'all' | FoodCategory, scroll = false) {
    setCategory(value)
    resetPages()
    if (scroll) {
      if (value !== 'all') categoryButtons.current[value]?.focus({ preventScroll: true })
      browser.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
  }

  function renderRecipes(items: typeof matchingRecipes) {
    return (
      <div className="recipe-board">
        {items.map(({ recipe }) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            open={cards.has(recipe.id)}
            mode={mode}
            selected={selectedId === recipe.id}
            onSelect={onRecipe}
          />
        ))}
      </div>
    )
  }

  function renderDishes(items: typeof matchingDishes) {
    return (
      <div className="food-dish-list">
        {items.map((dish) => (
          <button
            key={dish.id}
            type="button"
            aria-label={`${dish.name}として記録`}
            aria-pressed={selectedId === dish.id}
            onClick={() => onRecipe(dish.id)}
          >
            <Utensils size={16} aria-hidden="true" />
            <span>{dish.name}</span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="recipe-browser" ref={browser}>
      <div
        className="recipe-browser-controls"
        role="search"
        aria-label={includeDishes ? 'つくった料理を探す' : 'レシピを探す'}
      >
        <label className="recipe-browser-search" htmlFor={`${id}-search`}>
          <span>名前・材料で検索</span>
          <span className="recipe-browser-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              id={`${id}-search`}
              type="search"
              value={query}
              placeholder={includeDishes ? '料理名や材料で探す' : '例：たまご、キャベツ'}
              onChange={(event) => {
                setQuery(event.target.value)
                resetPages()
              }}
            />
          </span>
        </label>
        <div className="food-category-chips" role="group" aria-label="料理のカテゴリ">
          <button
            type="button"
            aria-pressed={category === 'all'}
            onClick={() => selectCategory('all')}
          >
            すべて
          </button>
          {categories.map((key) => (
            <button
              key={key}
              ref={(button) => {
                categoryButtons.current[key] = button
              }}
              type="button"
              aria-pressed={category === key}
              onClick={() => selectCategory(key)}
            >
              {foodCategories[key]}
            </button>
          ))}
        </div>
        <details className="recipe-browser-details">
          <summary>詳しく絞り込む{hasRecipeFilters && <span>条件あり</span>}</summary>
          {includeDishes && <p>調理時間・難しさ・カードでレシピを探せます。</p>}
          <div className="recipe-browser-filters">
            <label htmlFor={`${id}-minutes`}>
              <span>調理時間</span>
              <select
                id={`${id}-minutes`}
                value={minutes}
                onChange={(event) => {
                  setMinutes(event.target.value)
                  resetPages()
                }}
              >
                <option value="all">時間指定なし</option>
                <option value="10">10分以内</option>
                <option value="20">20分以内</option>
                <option value="30">30分以内</option>
              </select>
            </label>
            <label htmlFor={`${id}-difficulty`}>
              <span>難しさ</span>
              <select
                id={`${id}-difficulty`}
                value={difficulty}
                onChange={(event) => {
                  setDifficulty(event.target.value)
                  resetPages()
                }}
              >
                <option value="all">すべての難しさ</option>
                {difficultyNames.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-acquired`}>
              <span>カード</span>
              <select
                id={`${id}-acquired`}
                value={acquired}
                onChange={(event) => {
                  setAcquired(event.target.value)
                  resetPages()
                }}
              >
                <option value="all">すべてのカード</option>
                <option value="yes">獲得済み</option>
                <option value="no">未獲得</option>
              </select>
            </label>
          </div>
        </details>
      </div>
      <div className="recipe-browser-summary">
        <p role="status" aria-atomic="true">
          {includeDishes ? '料理カード' : 'レシピ'} <strong>{matchingRecipes.length}</strong>
          {includeDishes ? '枚' : '品'}
          {includeDishes && <span> · 料理名 {matchingDishes.length}件</span>}
        </p>
        {filtered && (
          <button type="button" className="recipe-browser-reset" onClick={resetFilters}>
            条件をリセット
          </button>
        )}
      </div>
      {matching.length === 0 ? (
        <div className="recipe-browser-empty">
          <Search size={28} aria-hidden="true" />
          <p>
            {includeDishes
              ? '条件に合う料理が見つかりませんでした。'
              : '条件に合うレシピが見つかりませんでした。'}
          </p>
          <button type="button" className="recipe-browser-reset" onClick={resetFilters}>
            {includeDishes ? 'すべての料理を見る' : 'すべてのレシピを見る'}
          </button>
        </div>
      ) : overview ? (
        <div className="food-category-shelves">
          {categories.map((key) => {
            const shelfRecipes = matchingRecipes.filter((entry) => entry.category === key)
            const shelfDishes = matchingDishes.filter((entry) => entry.category === key)
            return (
              <section
                key={key}
                className="food-category-shelf"
                aria-labelledby={`${id}-shelf-${key}`}
              >
                <div className="food-shelf-heading">
                  <h2 id={`${id}-shelf-${key}`}>{foodCategories[key]}</h2>
                  <button
                    type="button"
                    aria-label={`${foodCategories[key]}をすべて見る`}
                    onClick={() => selectCategory(key, true)}
                  >
                    すべて見る <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </div>
                {shelfRecipes.length > 0 && (
                  <>
                    {includeDishes && <RecipeChoiceHeading />}
                    {renderRecipes(shelfRecipes.slice(0, 2))}
                  </>
                )}
                {shelfDishes.length > 0 && (
                  <div className="food-shelf-dishes">
                    <div className="food-choice-heading">
                      <ClipboardPen size={18} aria-hidden="true" />
                      <h3>料理名で選ぶ</h3>
                      <span className="food-choice-fallback">合うレシピがないとき</span>
                    </div>
                    {renderDishes(shelfDishes.slice(0, 4))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="food-category-results">
          {category !== 'all' && (
            <h2 className="food-results-heading">{foodCategories[category]}</h2>
          )}
          {matchingRecipes.length > 0 && (
            <section
              className="food-recipe-results"
              ref={recipeResults}
              aria-label={includeDishes ? '料理カードから選ぶ' : 'レシピから選ぶ'}
            >
              {includeDishes && <RecipeChoiceHeading />}
              {renderRecipes(
                matchingRecipes.slice((currentPage - 1) * pageSize, currentPage * pageSize),
              )}
              <Pagination
                page={currentPage}
                count={pageCount}
                label="レシピ一覧のページ"
                onPage={(next) => {
                  setPage(next)
                  recipeResults.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
                }}
              />
            </section>
          )}
          {matchingDishes.length > 0 && (
            <fieldset className="food-dish-results" ref={dishResults}>
              <legend>
                <ClipboardPen size={18} aria-hidden="true" /> 料理名で選ぶ
              </legend>
              <span className="food-choice-fallback">合うレシピがないとき</span>
              {renderDishes(
                matchingDishes.slice(
                  (currentDishPage - 1) * dishPageSize,
                  currentDishPage * dishPageSize,
                ),
              )}
              <Pagination
                page={currentDishPage}
                count={dishPageCount}
                label="料理名のページ"
                onPage={(next) => {
                  setDishPage(next)
                  dishResults.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
                }}
              />
            </fieldset>
          )}
        </div>
      )}
      {state.subscriptionPlan !== 'premium' && (
        <SubscriptionPrompt
          reason={`無料プランでは定番の${FREE_RECIPE_IDS.length}品が見られます。有料プランなら全${recipes.length}品のレシピを楽しめます。`}
        />
      )}
    </div>
  )
}

function RecipeChoiceHeading() {
  return (
    <div className="food-choice-heading is-card-choice">
      <BookOpen size={18} aria-hidden="true" />
      <h3>料理カードから選ぶ</h3>
    </div>
  )
}

function RecipeCard({
  recipe,
  open,
  mode,
  selected,
  onSelect,
}: {
  recipe: Recipe
  open: boolean
  mode: 'browse' | 'select'
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={`recipe-collection-card recipe-rarity-${recipe.rarity} ${open ? 'is-discovered' : 'is-unknown'}`}
      aria-pressed={mode === 'select' ? selected : undefined}
      aria-label={
        mode === 'select'
          ? `${recipe.name}を選ぶ`
          : `${recipe.name}のレシピを見る${open ? '' : '（未獲得）'}`
      }
      onClick={() => onSelect(recipe.id)}
    >
      <span className="recipe-card-picture">
        <RecipeArt recipe={recipe} silhouette={!open} />
        <span className={`recipe-rarity recipe-rarity-${recipe.rarity}`}>
          {recipe.rarity === 'special' && <Sparkles size={10} />}
          {rarityNames[recipe.rarity]}
        </span>
      </span>
      <span className="recipe-card-description">
        <strong>{recipe.name}</strong>
        <span>
          <span>
            <Clock3 size={12} />
            {recipe.minutes}分
          </span>
          <span>{difficultyNames[recipe.difficulty - 1]}</span>
        </span>
        {mode === 'select' ? (
          <span className={`recipe-card-unlock${open ? ' is-collected' : ''}`}>
            {open ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            {open ? '獲得済み' : '記録で獲得'}
          </span>
        ) : !open ? (
          <span className="recipe-card-undiscovered">
            <BookOpen size={12} />
            未獲得 · レシピを見る
          </span>
        ) : null}
      </span>
      <ChevronRight className="recipe-card-arrow" size={15} />
    </button>
  )
}

function Pagination({
  page,
  count,
  label,
  onPage,
}: {
  page: number
  count: number
  label: string
  onPage: (page: number) => void
}) {
  if (count <= 1) return null
  return (
    <nav className="recipe-browser-pagination" aria-label={label}>
      <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={17} aria-hidden="true" />
        前のページ
      </button>
      <span role="status" aria-atomic="true">
        {page} / {count}
      </span>
      <button type="button" disabled={page === count} onClick={() => onPage(page + 1)}>
        次のページ
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  )
}
