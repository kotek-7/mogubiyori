import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X, Clock3, ArrowUpRight, Check, Sparkles } from 'lucide-react'
import type { AppState, Recipe } from './domain'
import { recommendationReason } from './domain'
import { FoodArt } from './Illustrations'

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  drawer = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  drawer?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''} ${drawer ? 'drawer' : ''}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose()
        }
      }}
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">HITOSAJI</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="閉じる" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function RecipeCard({
  recipe,
  state,
  onSelect,
  label,
}: {
  recipe: Recipe
  state: AppState
  onSelect: () => void
  label?: string
}) {
  const missing = recipe.ingredients.filter((i) => !state.pantry.includes(i.name))
  return (
    <button className="recipe-card" onClick={onSelect}>
      <div className="recipe-card-art" style={{ background: recipe.color }}>
        <FoodArt recipe={recipe} />
        {label && <span className="card-tag">{label}</span>}
        <span className="card-arrow">
          <ArrowUpRight size={19} />
        </span>
      </div>
      <div className="recipe-card-content">
        <div className="recipe-meta">
          <span>
            <Clock3 size={13} /> {recipe.minutes}分
          </span>
          <span>
            {missing.length === 0 ? (
              <>
                <Check size={13} /> 買い足しなし
              </>
            ) : (
              `買い足し ${missing.length}品`
            )}
          </span>
        </div>
        <h3>{recipe.name}</h3>
        <p>{recipe.subtitle}</p>
        <div className="recipe-reason">
          <Sparkles size={13} />
          <span>{recommendationReason(recipe, state)}</span>
        </div>
      </div>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={option.value === value}
          className={option.value === value ? 'selected' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
