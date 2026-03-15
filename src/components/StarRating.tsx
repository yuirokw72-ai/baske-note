interface Props {
  value: number
  onChange?: (v: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

export function StarRating({ value, onChange, max = 5, size = 'md', readOnly = false }: Props) {
  const sizeClass = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }[size]
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={`${sizeClass} transition-transform ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
