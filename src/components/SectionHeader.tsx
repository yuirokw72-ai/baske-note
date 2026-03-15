interface Props {
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}

export function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm text-orange-500 font-semibold"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
