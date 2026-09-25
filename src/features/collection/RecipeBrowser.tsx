import { useId, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Clock3, Search, Sparkles } from 'lucide-react'
import type { GameState } from '../../app/game/browserGame'
import { recipes, recipeCategories } from '../../../shared/content/recipes'
import { RecipeArt } from '../../ui/art/RecipeArt'

const pageSize = 24
const difficultyNames = ['かんたん', 'ひと工夫', 'じっくり']
const rarityNames = { common: 'ノーマル', rare: 'レア', special: 'スペシャル' }

function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (character) => String.fromCharCode(character.charCodeAt(0) + 0x60))
}

const searchableRecipes = recipes.map((recipe) => ({
  recipe,
  searchText: normalizeSearch(
    [recipe.name, ...recipe.ingredients, ...(recipe.tags ?? [])].join(' '),
  ),
}))

export function RecipeBrowser({
  state,
  onRecipe,
  mode = 'browse',
}: {
  state: GameState
  onRecipe: (id: string) => void
  mode?: 'browse' | 'select'
}) {
  const id = useId()
  const browser = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [minutes, setMinutes] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [acquired, setAcquired] = useState('all')
  const [page, setPage] = useState(1)
  const cards = useMemo(() => new Set(state.cards), [state.cards])
  const matching = useMemo(() => {
    const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean)
    const matchingRecipes = searchableRecipes
      .filter(({ recipe, searchText }) => {
        if (category !== 'all' && recipe.category !== category) return false
        if (minutes !== 'all' && recipe.minutes > Number(minutes)) return false
        if (difficulty !== 'all' && recipe.difficulty !== Number(difficulty)) return false
        if (acquired === 'yes' && !cards.has(recipe.id)) return false
        if (acquired === 'no' && cards.has(recipe.id)) return false
        return terms.every((term) => searchText.includes(term))
      })
      .map(({ recipe }) => recipe)
    return mode === 'browse'
      ? matchingRecipes.sort(
          (left, right) => Number(cards.has(right.id)) - Number(cards.has(left.id)),
        )
      : matchingRecipes
  }, [query, category, minutes, difficulty, acquired, cards, mode])
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * pageSize
  const visible = matching.slice(firstIndex, firstIndex + pageSize)
  const filtered =
    !!query || [category, minutes, difficulty, acquired].some((value) => value !== 'all')

  function resetFilters() {
    setQuery('')
    setCategory('all')
    setMinutes('all')
    setDifficulty('all')
    setAcquired('all')
    setPage(1)
  }

  function changePage(nextPage: number) {
    setPage(nextPage)
    browser.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  return (
    <div className="recipe-browser" ref={browser}>
      <div className="recipe-browser-controls" role="search" aria-label="レシピを探す">
        <label className="recipe-browser-search" htmlFor={`${id}-search`}>
          <span>名前・材料で検索</span>
          <span className="recipe-browser-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              id={`${id}-search`}
              type="search"
              value={query}
              placeholder="例：たまご、キャベツ"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </span>
        </label>
        <div className="recipe-browser-filters">
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
              {Object.entries(recipeCategories).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={`${id}-minutes`}>
            <span>調理時間</span>
            <select
              id={`${id}-minutes`}
              value={minutes}
              onChange={(event) => {
                setMinutes(event.target.value)
                setPage(1)
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
                setPage(1)
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
                setPage(1)
              }}
            >
              <option value="all">すべてのカード</option>
              <option value="yes">獲得済み</option>
              <option value="no">未獲得</option>
            </select>
          </label>
        </div>
      </div>
      <div className="recipe-browser-summary">
        <p role="status">
          <strong>{matching.length}</strong> 品
          {matching.length > 0 && (
            <span>
              {' '}
              · {firstIndex + 1}〜{firstIndex + visible.length}品目
            </span>
          )}
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
          <p>条件に合うレシピが見つかりませんでした。</p>
          <button type="button" className="recipe-browser-reset" onClick={resetFilters}>
            すべてのレシピを見る
          </button>
        </div>
      ) : (
        <div className="recipe-board">
          {visible.map((recipe) => {
            const open = cards.has(recipe.id)
            return (
              <button
                type="button"
                key={recipe.id}
                className={`recipe-collection-card recipe-rarity-${recipe.rarity} ${open ? 'is-discovered' : 'is-unknown'}`}
                aria-label={
                  mode === 'select'
                    ? `${recipe.name}を選ぶ`
                    : open
                      ? `${recipe.name}のレシピを見る`
                      : `${recipe.name}のレシピを見る（未獲得）`
                }
                onClick={() => onRecipe(recipe.id)}
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
                  {!open && (
                    <span className="recipe-card-undiscovered">
                      <BookOpen size={12} />
                      未獲得 · {mode === 'select' ? 'この料理を選ぶ' : 'レシピを見る'}
                    </span>
                  )}
                </span>
                <ChevronRight className="recipe-card-arrow" size={15} />
              </button>
            )
          })}
        </div>
      )}
      {pageCount > 1 && (
        <nav className="recipe-browser-pagination" aria-label="レシピ一覧のページ">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <ChevronLeft size={17} aria-hidden="true" />
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
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
