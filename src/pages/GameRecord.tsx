import { useState } from 'react'
import { Trophy, Star } from 'lucide-react'
import type { GameRecord, GameResult, QuarterNote, CoachFeedback } from '../types'
import { useLanguage } from '../contexts/LanguageContext'

interface Props {
  records: GameRecord[]
  onAdd: (r: Omit<GameRecord, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, updates: Partial<GameRecord>) => void
  onDelete: (id: string) => void
}

const RESULT_MAP: Record<GameResult, { labelKey: string; color: string; bg: string; border: string }> = {
  win:  { labelKey: 'gr.result.win',  color: '#2E7D52', bg: 'rgba(46,125,82,0.12)',  border: '#2E7D52' },
  lose: { labelKey: 'gr.result.lose', color: '#DC3545', bg: 'rgba(220,53,69,0.12)', border: '#DC3545' },
  draw: { labelKey: 'gr.result.draw', color: '#7A6E5F', bg: 'rgba(195,175,148,0.25)', border: '#A89F92' },
}

function fmtDate(s: string, lang: string) {
  if (!s) return ''
  const d = new Date(s + 'T00:00:00')
  if (lang === 'en') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// ===== StarRow =====
function StarRow({ value, onChange, readonly }: { value: number; onChange?: (n: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} disabled={readonly} className="p-0.5 disabled:cursor-default">
          <Star size={22}
            fill={n <= value ? '#E07B2A' : 'none'}
            stroke={n <= value ? '#E07B2A' : '#C8BFB2'}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

// ===== NumBox =====
function NumBox({ label, value, onChange, big }: { label: string; value: number; onChange: (v: number) => void; big?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs" style={{ color: '#A89F92' }}>{label}</span>
      <input type="number" inputMode="numeric"
        value={value === 0 ? '' : value}
        onChange={e => onChange(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
        onFocus={e => e.target.select()}
        min={0}
        className="nb-input text-center font-bold"
        style={{ width: big ? 72 : 56, fontSize: big ? '1.75rem' : '1.1rem', padding: '4px 0' }} />
    </div>
  )
}

// ===== QuarterNoteEditor =====
function QuarterNoteEditor({ notes, onChange }: {
  notes: QuarterNote[]
  onChange: (n: QuarterNote[]) => void
}) {
  const { t } = useLanguage()
  const [activeQ, setActiveQ] = useState<1 | 2 | 3 | 4>(1)
  const getNote = (q: number) => notes.find(n => n.quarter === q)?.note ?? ''
  const setNote = (q: 1 | 2 | 3 | 4, note: string) => {
    const rest = notes.filter(n => n.quarter !== q)
    onChange(note.trim() ? [...rest, { quarter: q, note }] : rest)
  }
  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {([1, 2, 3, 4] as const).map(q => {
          const hasNote = !!getNote(q)
          return (
            <button key={q} onClick={() => setActiveQ(q)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: activeQ === q ? '#1E3A5F' : hasNote ? 'rgba(30,58,95,0.1)' : 'rgba(195,175,148,0.15)',
                color: activeQ === q ? 'white' : hasNote ? '#1E3A5F' : '#A89F92',
              }}>
              Q{q}
            </button>
          )
        })}
      </div>
      <textarea
        value={getNote(activeQ)}
        onChange={e => setNote(activeQ, e.target.value)}
        placeholder={`Q${activeQ}${t('gr.qPh')}`}
        className="nb-textarea" style={{ minHeight: 72 }} />
    </div>
  )
}

// ===== CoachFeedbackSection =====
function CoachFeedbackSection({ feedback, onSave }: {
  feedback?: CoachFeedback
  onSave: (fb: CoachFeedback) => void
}) {
  const { lang, t } = useLanguage()
  const today = new Date().toISOString().split('T')[0]
  const [editing, setEditing] = useState(!feedback)
  const [goodPoints, setGoodPoints]           = useState(feedback?.goodPoints ?? '')
  const [improvements, setImprovements]       = useState(feedback?.improvements ?? '')
  const [nextInstruction, setNextInstruction] = useState(feedback?.nextInstruction ?? '')
  const [coachName, setCoachName]             = useState(feedback?.coachName ?? '')
  const [date, setDate]                       = useState(feedback?.date ?? today)

  const save = () => {
    onSave({ goodPoints, improvements, nextInstruction, coachName, date })
    setEditing(false)
  }

  if (!editing && feedback) {
    return (
      <div className="nb-card-coach">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold" style={{ color: '#1E3A5F' }}>{t('cf.title')}</p>
            {feedback.coachName && (
              <p className="text-xs mt-0.5" style={{ color: '#5B7BA8' }}>
                {feedback.coachName}{feedback.date ? ` · ${fmtDate(feedback.date, lang)}` : ''}
              </p>
            )}
          </div>
          <button onClick={() => setEditing(true)}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: 'rgba(30,58,95,0.1)', color: '#1E3A5F' }}>
            {t('cf.edit')}
          </button>
        </div>
        {feedback.goodPoints && (
          <div className="mb-2">
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#2E7D52' }}>{t('cf.good')}</p>
            <p className="text-sm" style={{ color: '#1E1A14' }}>{feedback.goodPoints}</p>
          </div>
        )}
        {feedback.improvements && (
          <div className="mb-2">
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#E07B2A' }}>{t('cf.improve')}</p>
            <p className="text-sm" style={{ color: '#1E1A14' }}>{feedback.improvements}</p>
          </div>
        )}
        {feedback.nextInstruction && (
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#1E3A5F' }}>{t('cf.next')}</p>
            <p className="text-sm" style={{ color: '#1E1A14' }}>{feedback.nextInstruction}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="nb-card-coach">
      <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('cf.title')}</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#2E7D52' }}>{t('cf.good')}</p>
          <textarea value={goodPoints} onChange={e => setGoodPoints(e.target.value)}
            placeholder={t('cf.goodPh')}
            className="nb-textarea nb-textarea-coach" style={{ minHeight: 52 }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#E07B2A' }}>{t('cf.improve')}</p>
          <textarea value={improvements} onChange={e => setImprovements(e.target.value)}
            placeholder={t('cf.improvePh')}
            className="nb-textarea nb-textarea-coach" style={{ minHeight: 52 }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#1E3A5F' }}>{t('cf.next')}</p>
          <textarea value={nextInstruction} onChange={e => setNextInstruction(e.target.value)}
            placeholder={t('cf.nextPh.game')}
            className="nb-textarea nb-textarea-coach" style={{ minHeight: 52 }} />
        </div>
        <div className="flex gap-2">
          <input value={coachName} onChange={e => setCoachName(e.target.value)}
            placeholder={t('cf.coachName')} className="nb-input nb-input-coach" style={{ flex: 1 }} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="nb-input nb-input-coach" style={{ flex: 1 }} />
        </div>
        <div className="flex gap-2">
          {feedback && (
            <button onClick={() => setEditing(false)} className="btn-secondary" style={{ flex: 1 }}>
              {t('cf.cancel')}
            </button>
          )}
          <button onClick={save} className="btn-navy" style={{ flex: 2 }}>
            {t('cf.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== GameForm =====
function GameForm({ onSubmit, onCancel, initialData }: {
  onSubmit: (r: Omit<GameRecord, 'id' | 'createdAt'>) => void
  onCancel: () => void
  initialData?: GameRecord
}) {
  const { t } = useLanguage()
  const isEditing = !!initialData
  const today = new Date().toISOString().split('T')[0]
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [date, setDate]               = useState(initialData?.date ?? today)
  const [opponent, setOpponent]       = useState(initialData?.opponent ?? '')
  const [venue, setVenue]             = useState(initialData?.venue ?? '')
  const [result, setResult]           = useState<GameResult>(initialData?.result ?? 'win')
  const [myScore, setMyScore]         = useState(initialData?.myScore ?? 0)
  const [opponentScore, setOpponentScore] = useState(initialData?.opponentScore ?? 0)

  // Step 2
  const [points, setPoints]           = useState(initialData?.points ?? 0)
  const [rebounds, setRebounds]       = useState(initialData?.rebounds ?? 0)
  const [assists, setAssists]         = useState(initialData?.assists ?? 0)
  const [steals, setSteals]           = useState(initialData?.steals ?? 0)
  const [turnovers, setTurnovers]     = useState(initialData?.turnovers ?? 0)
  const [blocks, setBlocks]           = useState(initialData?.blocks ?? 0)
  const [fgMade, setFgMade]           = useState(initialData?.fgMade ?? 0)
  const [fgAttempts, setFgAttempts]   = useState(initialData?.fgAttempts ?? 0)
  const [minutesPlayed, setMinutesPlayed] = useState(initialData?.minutesPlayed ?? 0)
  const [quarterNotes, setQuarterNotes] = useState<QuarterNote[]>(initialData?.quarterNotes ?? [])

  // Step 3
  const [goodPlays, setGoodPlays]           = useState(initialData?.goodPlays ?? '')
  const [badPlays, setBadPlays]             = useState(initialData?.badPlays ?? '')
  const [teamAnalysis, setTeamAnalysis]     = useState(initialData?.teamAnalysis ?? '')
  const [nextGameFocus, setNextGameFocus]   = useState(initialData?.nextGameFocus ?? '')
  const [mentalReflection, setMentalReflection] = useState(initialData?.mentalReflection ?? '')
  const [selfRating, setSelfRating]         = useState(initialData?.selfRating ?? 3)

  const handleSubmit = () => {
    onSubmit({
      date, opponent, venue, result, myScore, opponentScore,
      points, rebounds, assists, steals, turnovers, blocks,
      fgMade, fgAttempts, minutesPlayed,
      quarterNotes,
      goodPlays, badPlays, teamAnalysis, nextGameFocus, mentalReflection,
      selfRating,
    })
  }

  const resultM = RESULT_MAP[result]
  const fgPct = fgAttempts > 0 ? Math.round((fgMade / fgAttempts) * 100) : 0

  const stepLabels = [t('gr.step1'), t('gr.step2'), t('gr.step3')]

  return (
    <div>
      {/* ステップ */}
      <div className="flex gap-2 mb-5">
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3
          const isDone = isEditing ? step !== stepNum : step > stepNum
          const dotState = step === stepNum ? 'active' : isDone ? 'done' : 'todo'
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1"
              onClick={() => isEditing && setStep(stepNum)}
              style={{ cursor: isEditing ? 'pointer' : 'default' }}>
              <div className={`step-dot ${dotState}`}>
                {isDone ? '✓' : stepNum}
              </div>
              <span className="text-xs" style={{ color: step === stepNum ? '#E07B2A' : '#A89F92', fontWeight: step === stepNum ? 600 : 400 }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="nb-card-plain space-y-3">
            <p className="text-xs font-bold" style={{ color: '#1E3A5F' }}>{t('gr.gameInfo')}</p>
            <div>
              <p className="text-xs mb-1" style={{ color: '#A89F92' }}>{t('gr.gameDate')}</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="nb-input" />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#A89F92' }}>{t('gr.opponent')}</p>
              <input value={opponent} onChange={e => setOpponent(e.target.value)}
                placeholder={t('gr.opponentPh')} className="nb-input" />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#A89F92' }}>{t('gr.venue')}</p>
              <input value={venue} onChange={e => setVenue(e.target.value)}
                placeholder={t('gr.venuePh')} className="nb-input" />
            </div>
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('gr.result')}</p>
            <div className="flex gap-2 mb-5">
              {(Object.entries(RESULT_MAP) as [GameResult, typeof RESULT_MAP[GameResult]][]).map(([v, m]) => (
                <button key={v} onClick={() => setResult(v)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: result === v ? m.bg : 'rgba(195,175,148,0.1)',
                    color: result === v ? m.color : '#A89F92',
                    border: result === v ? `1.5px solid ${m.border}` : '1.5px solid transparent',
                    fontWeight: result === v ? 700 : 400,
                  }}>
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-5">
              <div className="text-center">
                <p className="text-xs mb-2" style={{ color: '#A89F92' }}>{t('gr.myTeam')}</p>
                <input type="number" inputMode="numeric"
                  value={myScore === 0 ? '' : myScore}
                  onChange={e => setMyScore(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                  onFocus={e => e.target.select()}
                  min={0}
                  className="nb-input text-center font-bold"
                  style={{ width: 72, fontSize: '2rem', color: resultM.color }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: '#C8BFB2' }}>-</span>
              <div className="text-center">
                <p className="text-xs mb-2" style={{ color: '#A89F92' }}>{t('gr.oppTeam')}</p>
                <input type="number" inputMode="numeric"
                  value={opponentScore === 0 ? '' : opponentScore}
                  onChange={e => setOpponentScore(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                  onFocus={e => e.target.select()}
                  min={0}
                  className="nb-input text-center font-bold"
                  style={{ width: 72, fontSize: '2rem', color: '#7A6E5F' }} />
              </div>
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!opponent.trim()} className="btn-primary">
            {t('gr.next1')}
          </button>
        </div>
      )}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="nb-card">
            <p className="text-xs font-bold mb-4" style={{ color: '#1E3A5F' }}>{t('gr.personalStats')}</p>
            <div className="grid grid-cols-4 gap-3 mb-3 justify-items-center">
              <NumBox label={t('gr.points')}   value={points}   onChange={setPoints} />
              <NumBox label={t('gr.rebounds')} value={rebounds} onChange={setRebounds} />
              <NumBox label={t('gr.assists')}  value={assists}  onChange={setAssists} />
              <NumBox label={t('gr.steals')}   value={steals}   onChange={setSteals} />
            </div>
            <div className="grid grid-cols-4 gap-3 pt-3 justify-items-center"
              style={{ borderTop: '1px solid rgba(195,175,148,0.35)' }}>
              <NumBox label={t('gr.turnovers')} value={turnovers} onChange={setTurnovers} />
              <NumBox label={t('gr.blocks')}    value={blocks}    onChange={setBlocks} />
              <NumBox label={t('gr.fgMade')}    value={fgMade}    onChange={setFgMade} />
              <NumBox label={t('gr.fgAttempts')} value={fgAttempts} onChange={setFgAttempts} />
            </div>
            {fgAttempts > 0 && (
              <p className="text-center text-xs mt-2" style={{ color: '#A89F92' }}>
                {t('gr.fgPct')} {fgPct}%
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(195,175,148,0.35)' }}>
              <span className="text-xs" style={{ color: '#A89F92' }}>{t('gr.minutes')}</span>
              <input type="number" inputMode="numeric"
                value={minutesPlayed === 0 ? '' : minutesPlayed}
                onChange={e => setMinutesPlayed(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                onFocus={e => e.target.select()}
                min={0}
                className="nb-input font-bold text-center" style={{ width: 60 }} />
              <span className="text-xs" style={{ color: '#A89F92' }}>{t('gr.minUnit')}</span>
            </div>
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('gr.quarterNotes')}</p>
            <QuarterNoteEditor notes={quarterNotes} onChange={setQuarterNotes} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>{t('gr.back')}</button>
            <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2 }}>{t('gr.next2')}</button>
          </div>
        </div>
      )}

      {/* ===== STEP 3 ===== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#2E7D52' }}>{t('gr.goodPlays')}</p>
            <textarea value={goodPlays} onChange={e => setGoodPlays(e.target.value)}
              placeholder={t('gr.goodPh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#DC3545' }}>{t('gr.badPlays')}</p>
            <textarea value={badPlays} onChange={e => setBadPlays(e.target.value)}
              placeholder={t('gr.badPh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#1E3A5F' }}>{t('gr.teamAnalysis')}</p>
            <p className="text-xs mb-2" style={{ color: '#A89F92' }}>{t('gr.teamAnalysisHint')}</p>
            <textarea value={teamAnalysis} onChange={e => setTeamAnalysis(e.target.value)}
              placeholder={t('gr.teamPh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#E07B2A' }}>{t('gr.nextGame')}</p>
            <textarea value={nextGameFocus} onChange={e => setNextGameFocus(e.target.value)}
              placeholder={t('gr.nextGamePh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#7B2FA0' }}>{t('gr.mental')}</p>
            <textarea value={mentalReflection} onChange={e => setMentalReflection(e.target.value)}
              placeholder={t('gr.mentalPh')} className="nb-textarea" />
          </div>

          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('gr.selfRating')}</p>
            <StarRow value={selfRating} onChange={setSelfRating} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>{t('gr.back')}</button>
            <button onClick={handleSubmit} disabled={!opponent.trim()} className="btn-primary" style={{ flex: 2 }}>
              {isEditing ? t('gr.update') : t('gr.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== GameDetail =====
function GameDetail({ record, onDelete, onUpdate, onEdit }: {
  record: GameRecord
  onDelete: () => void
  onUpdate: (updates: Partial<GameRecord>) => void
  onEdit: () => void
}) {
  const { lang, t } = useLanguage()
  const m = RESULT_MAP[record.result]
  const fgPct = record.fgAttempts > 0 ? Math.round((record.fgMade / record.fgAttempts) * 100) : 0

  return (
    <div className="space-y-4 page-enter">
      {/* ヘッダー */}
      <div className="nb-card" style={{ borderLeft: `4px solid ${m.color}` }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs mb-1" style={{ color: '#A89F92' }}>
              {fmtDate(record.date, lang)}{record.venue ? ` @ ${record.venue}` : ''}
            </p>
            <p className="text-base font-bold font-klee" style={{ color: '#1E3A5F' }}>vs {record.opponent}</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-bold"
            style={{ backgroundColor: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
            {t(m.labelKey)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold" style={{ color: m.color }}>{record.myScore}</span>
          <span className="text-xl" style={{ color: '#C8BFB2' }}>-</span>
          <span className="text-3xl font-bold" style={{ color: '#7A6E5F' }}>{record.opponentScore}</span>
        </div>
      </div>

      {/* スタッツ */}
      <div className="nb-card">
        <p className="text-xs font-bold mb-4 text-center" style={{ color: '#1E3A5F' }}>{t('gr.detail.stats')}</p>
        <div className="grid grid-cols-4 gap-3 text-center mb-3">
          {([
            [t('gr.detail.pts'), record.points],
            ['RB', record.rebounds],
            ['AS', record.assists],
            ['ST', record.steals],
          ] as [string, number][]).map(([l, v]) => (
            <div key={l}>
              <p className="text-2xl font-bold" style={{ color: '#1E1A14' }}>{v}</p>
              <p className="text-xs" style={{ color: '#A89F92' }}>{l}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3 text-center pt-3"
          style={{ borderTop: '1px solid rgba(195,175,148,0.35)' }}>
          {([
            ['TO', record.turnovers],
            ['BL', record.blocks],
            ['FG%', fgPct + '%'],
            [t('gr.detail.min'), record.minutesPlayed + t('gr.detail.minUnit')],
          ] as [string, string | number][]).map(([l, v]) => (
            <div key={l}>
              <p className="text-lg font-bold" style={{ color: '#7A6E5F' }}>{v}</p>
              <p className="text-xs" style={{ color: '#A89F92' }}>{l}</p>
            </div>
          ))}
        </div>
        {record.fgAttempts > 0 && (
          <p className="text-center text-xs mt-2" style={{ color: '#A89F92' }}>
            FG: {record.fgMade}/{record.fgAttempts}
          </p>
        )}
      </div>

      {/* クォーターノート */}
      {record.quarterNotes.length > 0 && (
        <div className="nb-card">
          <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('gr.detail.qNotes')}</p>
          <div className="space-y-2">
            {record.quarterNotes.sort((a, b) => a.quarter - b.quarter).map(qn => (
              <div key={qn.quarter}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#E07B2A' }}>Q{qn.quarter}</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E1A14' }}>{qn.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 振り返り */}
      {(record.goodPlays || record.badPlays) && (
        <div className="nb-card space-y-3">
          {record.goodPlays && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#2E7D52' }}>{t('gr.detail.goodPlays')}</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E1A14' }}>{record.goodPlays}</p>
            </div>
          )}
          {record.badPlays && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#DC3545' }}>{t('gr.detail.badPlays')}</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E1A14' }}>{record.badPlays}</p>
            </div>
          )}
        </div>
      )}

      {record.teamAnalysis && (
        <div className="nb-card-plain" style={{ borderLeft: '4px solid #1E3A5F' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#1E3A5F' }}>{t('gr.detail.teamAnalysis')}</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E1A14' }}>{record.teamAnalysis}</p>
        </div>
      )}

      {record.nextGameFocus && (
        <div className="nb-card-plain" style={{ borderLeft: '4px solid #E07B2A' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#E07B2A' }}>{t('gr.detail.nextGame')}</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E1A14' }}>{record.nextGameFocus}</p>
        </div>
      )}

      {record.mentalReflection && (
        <div className="nb-card-plain" style={{ borderLeft: '4px solid #7B2FA0' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#7B2FA0' }}>{t('gr.detail.mental')}</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#1E1A14' }}>{record.mentalReflection}</p>
        </div>
      )}

      <div className="nb-card-plain">
        <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('gr.detail.selfRating')}</p>
        <StarRow value={record.selfRating} readonly />
      </div>

      {/* コーチFB */}
      <CoachFeedbackSection
        feedback={record.coachFeedback}
        onSave={fb => onUpdate({ coachFeedback: fb })}
      />

      <div className="flex gap-2">
        <button onClick={onEdit}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ color: '#1E3A5F', border: '1px solid rgba(30,58,95,0.3)', backgroundColor: 'rgba(30,58,95,0.05)' }}>
          {t('gr.editBtn')}
        </button>
        <button onClick={onDelete}
          className="flex-1 py-3 rounded-xl text-sm"
          style={{ color: '#DC3545', border: '1px solid rgba(220,53,69,0.3)', backgroundColor: 'rgba(220,53,69,0.04)' }}>
          {t('gr.delete')}
        </button>
      </div>
    </div>
  )
}

// ===== GameRecordPage (main) =====
export function GameRecordPage({ records, onAdd, onUpdate, onDelete }: Props) {
  const { lang, t } = useLanguage()
  const [view, setView] = useState<'list' | 'form' | 'detail' | 'edit'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = records.find(r => r.id === selectedId)

  if (view === 'form') return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('list')} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('gr.formTitle')}</h1>
      </div>
      <GameForm onSubmit={r => { onAdd(r); setView('list') }} onCancel={() => setView('list')} />
    </div>
  )

  if (view === 'edit' && selected) return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('detail')} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('gr.editTitle')}</h1>
      </div>
      <GameForm
        onSubmit={updates => {
          onUpdate(selected.id, updates)
          setView('detail')
        }}
        onCancel={() => setView('detail')}
        initialData={selected}
      />
    </div>
  )

  if (view === 'detail' && selected) return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('list')} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('gr.detailTitle')}</h1>
      </div>
      <GameDetail
        record={selected}
        onDelete={() => { onDelete(selected.id); setView('list') }}
        onUpdate={updates => onUpdate(selected.id, updates)}
        onEdit={() => setView('edit')}
      />
    </div>
  )

  const wins   = records.filter(r => r.result === 'win').length
  const losses = records.filter(r => r.result === 'lose').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('gr.title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#A89F92' }}>
            {t('gr.gameCount')
              .replace('{n}', String(records.length))
              .replace('{w}', String(wins))
              .replace('{l}', String(losses))}
          </p>
        </div>
        <button onClick={() => setView('form')}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ backgroundColor: '#1E3A5F', color: 'white' }}>
          <Trophy size={14} /> {t('gr.record')}
        </button>
      </div>

      {records.length === 0 ? (
        <div className="nb-card text-center py-12" style={{}}
          onClick={() => setView('form')}>
          <p className="text-3xl mb-3">🏀</p>
          <p className="text-sm" style={{ color: '#A89F92' }}>{t('gr.noRecords')}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#E07B2A' }}>{t('gr.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const m = RESULT_MAP[r.result]
            return (
              <div key={r.id} className="nb-card"
                onClick={() => { setSelectedId(r.id); setView('detail') }}
                style={{ cursor: 'pointer', borderLeft: `4px solid ${m.color}` }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-xs mb-0.5" style={{ color: '#A89F92' }}>{fmtDate(r.date, lang)}</p>
                    <p className="text-sm font-bold" style={{ color: '#1E1A14' }}>vs {r.opponent}</p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: m.color }}>
                      {r.myScore} - {r.opponentScore}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: m.bg, color: m.color }}>
                      {t(m.labelKey)}
                    </span>
                    <p className="text-xs font-semibold" style={{ color: '#7A6E5F' }}>
                      {r.points}pt {r.rebounds}rb {r.assists}as
                    </p>
                  </div>
                </div>
                {r.coachFeedback && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1E3A5F' }} />
                    <p className="text-xs" style={{ color: '#5B7BA8' }}>{t('gr.coachFB')}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
