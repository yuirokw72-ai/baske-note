import { useState, useEffect } from 'react'

const STORAGE_PREFIX = 'tn-tip-'

interface TooltipWrapperProps {
  tooltipKey: string
  message: { ja: string; en: string }
  lang: string
  position?: 'top' | 'bottom'
  fullWidth?: boolean
  delay?: number
  children: React.ReactNode
}

/**
 * 初回表示時にふわっとツールチップを出すラッパー。
 * localStorage に `tn-tip-{key}` が保存されたら二度と出ない。
 */
export function TooltipWrapper({
  tooltipKey,
  message,
  lang,
  position = 'bottom',
  fullWidth = false,
  delay = 600,
  children,
}: TooltipWrapperProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(`${STORAGE_PREFIX}${tooltipKey}`)
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [tooltipKey, delay])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => dismiss(), 4000)
    return () => clearTimeout(timer)
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(`${STORAGE_PREFIX}${tooltipKey}`, '1')
  }

  const isTop = position === 'top'

  return (
    <div style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block' }}>
      {children}
      {visible && (
        <div
          onClick={e => { e.stopPropagation(); dismiss() }}
          style={{
            position: 'absolute',
            [isTop ? 'bottom' : 'top']: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1E3A5F',
            color: 'white',
            borderRadius: 10,
            padding: '7px 13px',
            fontSize: '0.72rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            animation: 'tooltipFadeIn 0.3s ease',
            zIndex: 50,
            cursor: 'pointer',
            lineHeight: 1.4,
            pointerEvents: 'all',
          }}
        >
          {message[lang as 'ja' | 'en'] ?? message.ja}
          {/* 矢印 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            ...(isTop
              ? { bottom: -6, borderWidth: '7px 6px 0', borderColor: '#1E3A5F transparent transparent' }
              : { top: -6, borderWidth: '0 6px 7px', borderColor: 'transparent transparent #1E3A5F' }),
          }} />
        </div>
      )}
    </div>
  )
}
