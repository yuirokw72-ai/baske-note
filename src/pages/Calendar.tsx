import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { PracticeLog, GameRecord } from '../types'
import { useLanguage } from '../contexts/LanguageContext'

interface Props {
  practiceLogs: PracticeLog[]
  gameRecords: GameRecord[]
  onNavigate: (page: string) => void
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(dateStr: string, lang: string) {
  const d = new Date(dateStr)
  if (lang === 'en') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtYearMonth(year: number, month: number, lang: string) {
  if (lang === 'en') {
    const d = new Date(year, month, 1)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }
  return `${year}年${month + 1}月`
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const cells: (Date | null)[] = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function CalendarPage({ practiceLogs, gameRecords, onNavigate }: Props) {
  const { lang, t } = useLanguage()
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(toYMD(today))

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const practiceSet = new Set(practiceLogs.map(l => l.date))
  const gameSet     = new Set(gameRecords.map(r => r.date))
  const cells = buildCalendar(year, month)
  const todayStr = toYMD(today)

  const selectedPractices = selected ? practiceLogs.filter(l => l.date === selected) : []
  const selectedGames     = selected ? gameRecords.filter(r => r.date === selected) : []

  const WEEKDAYS = [0,1,2,3,4,5,6].map(i => t(`cal.wd.${i}`))

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('cal.title')}</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(195,175,148,0.2)', border: '1px solid rgba(195,175,148,0.5)' }}>
            <ChevronLeft size={18} style={{ color: '#7A6E5F' }} />
          </button>
          <span className="font-bold text-sm" style={{ color: '#1E1A14', minWidth: '80px', textAlign: 'center' }}>
            {fmtYearMonth(year, month, lang)}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(195,175,148,0.2)', border: '1px solid rgba(195,175,148,0.5)' }}>
            <ChevronRight size={18} style={{ color: '#7A6E5F' }} />
          </button>
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E07B2A' }} />
          <span className="text-xs" style={{ color: '#7A6E5F' }}>{t('cal.legend.practice')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1E3A5F' }} />
          <span className="text-xs" style={{ color: '#7A6E5F' }}>{t('cal.legend.game')}</span>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="nb-card-plain mb-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center py-1 text-xs font-semibold"
                 style={{ color: i === 0 ? '#DC3545' : i === 6 ? '#1E3A5F' : '#A89F92' }}>
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((cell, idx) => {
            if (!cell) return <div key={idx} />
            const dateStr  = toYMD(cell)
            const hasPrac  = practiceSet.has(dateStr)
            const hasGame  = gameSet.has(dateStr)
            const isToday  = dateStr === todayStr
            const isSel    = dateStr === selected
            const isSun    = cell.getDay() === 0
            const isSat    = cell.getDay() === 6

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr === selected ? null : dateStr)}
                className="flex flex-col items-center py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: isSel ? '#E07B2A' : isToday ? 'rgba(224,123,42,0.12)' : 'transparent',
                }}
              >
                <span className="text-sm font-medium leading-none"
                      style={{
                        color: isSel ? 'white' : isToday ? '#E07B2A' : isSun ? '#DC3545' : isSat ? '#1E3A5F' : '#1E1A14',
                        fontWeight: isToday || isSel ? 700 : 400,
                      }}>
                  {cell.getDate()}
                </span>
                <div className="flex gap-0.5 mt-1 h-2">
                  {hasPrac && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.85)' : '#E07B2A' }} />}
                  {hasGame && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.85)' : '#1E3A5F' }} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 選択日の記録 */}
      {selected && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold font-klee" style={{ color: '#1E3A5F' }}>
              {fmtDate(selected, lang)}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('practice')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: 'rgba(224,123,42,0.12)', color: '#E07B2A' }}
              >
                <Plus size={12} /> {t('cal.addPractice')}
              </button>
              <button
                onClick={() => onNavigate('game')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: 'rgba(30,58,95,0.1)', color: '#1E3A5F' }}
              >
                <Plus size={12} /> {t('cal.addGame')}
              </button>
            </div>
          </div>

          {selectedPractices.length === 0 && selectedGames.length === 0 && (
            <div className="nb-card text-center py-8" style={{ color: '#A89F92' }}>
              <p className="text-sm">{t('cal.noRecord')}</p>
              <p className="text-xs mt-1">{t('cal.noRecordHint')}</p>
            </div>
          )}

          {selectedPractices.map(log => (
            <div key={log.id} className="nb-card mb-3" onClick={() => onNavigate('practice')} style={{ cursor: 'pointer' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(224,123,42,0.12)', color: '#E07B2A' }}>
                      {t('cal.badge.practice')}
                    </span>
                    <span className="text-xs" style={{ color: '#A89F92' }}>{log.duration}{t('cal.minUnit')}</span>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: '#1E1A14' }}>{log.todayGoal}</p>
                  {log.todayLearning && (
                    <p className="text-xs mt-1 truncate" style={{ color: '#7A6E5F' }}>💡 {log.todayLearning}</p>
                  )}
                </div>
                <div className="ml-2 text-lg font-bold"
                  style={{ color: log.goalAchievement === 'achieved' ? '#2E7D52' : log.goalAchievement === 'partial' ? '#E07B2A' : '#DC3545' }}>
                  {log.goalAchievement === 'achieved' ? '○' : log.goalAchievement === 'partial' ? '△' : '×'}
                </div>
              </div>
            </div>
          ))}

          {selectedGames.map(rec => (
            <div key={rec.id} className="nb-card mb-3" onClick={() => onNavigate('game')} style={{ cursor: 'pointer' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(30,58,95,0.1)', color: '#1E3A5F' }}>
                      {t('cal.badge.game')}
                    </span>
                    <span className="text-xs" style={{ color: '#A89F92' }}>vs {rec.opponent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" style={{ color: '#1E1A14' }}>{rec.myScore} - {rec.opponentScore}</span>
                  </div>
                </div>
                <span className="text-lg font-bold px-3 py-1.5 rounded-xl"
                      style={{
                        backgroundColor: rec.result === 'win' ? 'rgba(46,125,82,0.1)' : rec.result === 'lose' ? 'rgba(220,53,69,0.08)' : 'rgba(195,175,148,0.2)',
                        color:           rec.result === 'win' ? '#2E7D52' : rec.result === 'lose' ? '#DC3545' : '#7A6E5F',
                      }}>
                  {rec.result === 'win' ? t('cal.win') : rec.result === 'lose' ? t('cal.lose') : t('cal.draw')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
