import { useEffect, useRef } from 'react'

export function SpinningCursor() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (wrapperRef.current) {
        wrapperRef.current.style.left = `${e.clientX - 14}px`
        wrapperRef.current.style.top  = `${e.clientY - 14}px`
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        top: -100,
        left: -100,
        width: 28,
        height: 28,
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'left, top',
      }}
    >
      {/* Inner div handles rotation separately so left/top aren't affected */}
      <div style={{ animation: 'basketballSpin 2.4s linear infinite', width: '100%', height: '100%' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="12" fill="#E07B2A" stroke="#A85E20" strokeWidth="1.5" />
          <path d="M14 2 L14 26"          stroke="#A85E20" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2 14 L26 14"          stroke="#A85E20" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M5 7 Q14 10.5 23 7"   stroke="#A85E20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M5 21 Q14 17.5 23 21" stroke="#A85E20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
