import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
