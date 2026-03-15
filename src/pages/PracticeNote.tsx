import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Star, BookOpen } from 'lucide-react'
import type { PracticeLog, PracticeType, GoalAchievement, FormationNote, CoachFeedback, CourtType, PlayerPos, Formation, FormationCategory, TeamWithRole } from '../types'
import { FormationDiagram } from '../components/FormationDiagram'
import { useLanguage } from '../contexts/LanguageContext'

interface Props {
  logs: PracticeLog[]
  latestNextChallenge: string
  onAdd: (log: Omit<PracticeLog, 'id' | 'createdAt'>) => Promise<PracticeLog>
  onUpdate: (id: string, updates: Partial<PracticeLog>) => void
  onDelete: (id: string) => void
  onAddFormation: (f: Omit<Formation, 'id' | 'createdAt'>) => void
  teams: { myTeams: TeamWithRole[]; shareRecord: (id: string, type: 'practice' | 'game', teamId: string) => Promise<void> }
}

// Stored as Japanese keys (matches saved data); display via t('pn.menu.' + key)
const MENU_PRESET_KEYS = [
  'ハンドリング', 'ドリブル練習', 'シュート練習', 'フリースロー', 'レイアップ',
  'パス練習', 'DF練習', '1on1', '2on2', '3on3', '5on5',
  'フィジカル', 'ウォームアップ', 'ゲーム形式', 'フォーメーション',
]

const ACH_OPTIONS: { value: GoalAchievement; labelKey: string; border: string; color: string }[] = [
  { value: 'achieved',     labelKey: 'pn.ach.achieved',     border: '#2E7D52', color: 'rgba(46,125,82,0.12)'  },
  { value: 'partial',      labelKey: 'pn.ach.partial',      border: '#E07B2A', color: 'rgba(224,123,42,0.12)' },
  { value: 'not_achieved', labelKey: 'pn.ach.not_achieved', border: '#DC3545', color: 'rgba(220,53,69,0.12)'  },
]

function fmtDate(s: string, lang: string) {
  if (!s) return ''
  const d = new Date(s + 'T00:00:00')
  if (lang === 'en') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// Default players for a new note formation
function makeDefaultPlayers(courtType: CourtType, category: FormationCategory = 'offense'): PlayerPos[] {
  const isHalf = courtType === 'half'
  const prefix = category === 'defense' ? 'd' : 'o'
  const positions = isHalf
    ? [
        { x: 0.500, y: 0.840 },
        { x: 0.800, y: 0.650 },
        { x: 0.200, y: 0.650 },
        { x: 0.860, y: 0.320 },
        { x: 0.140, y: 0.320 },
      ]
    : [
        { x: 0.500, y: 0.920 },
        { x: 0.800, y: 0.820 },
        { x: 0.200, y: 0.820 },
        { x: 0.880, y: 0.680 },
        { x: 0.120, y: 0.680 },
      ]
  return positions.map((p, i) => ({
    id: `${prefix}${i + 1}`,
    x: p.x,
    y: p.y,
    ...(category === 'offense' && i === 0 ? { hasBall: true } : {}),
  }))
}

// Build a Formation object from a FormationNote (for passing to FormationDiagram)
function noteToFormation(note: FormationNote, idx: number): Formation {
  const courtType = note.courtType ?? 'half'
  const category = note.category ?? 'offense'
  return {
    id: `note-${idx}`,
    name: note.name,
    courtType,
    category,
    players: note.players && note.players.length > 0 ? note.players : makeDefaultPlayers(courtType, category),
    arrows: note.arrows ?? [],
    createdAt: '',
  }
}

// ===== StarRow =====
function StarRow({ value, onChange, readonly }: { value: number; onChange?: (n: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} disabled={readonly}
          className="p-0.5 disabled:cursor-default">
          <Star size={22}
            fill={n <= value ? '#E07B2A' : 'none'}
            stroke={n <= value ? '#E07B2A' : '#C8BFB2'}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

// ===== ConditionPicker =====
function ConditionPicker({ label, value, onChange, items }: {
  label: string; value: number; onChange: (n: number) => void
  items: { n: number; text: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{label}</p>
      <div className="flex gap-1.5">
        {items.map(({ n, text }) => (
          <button key={n} onClick={() => onChange(n)}
            className="flex-1 py-2 rounded-lg text-xs text-center transition-all"
            style={{
              backgroundColor: value === n ? '#E07B2A' : 'rgba(195,175,148,0.15)',
              color: value === n ? 'white' : '#7A6E5F',
              fontWeight: value === n ? 700 : 400,
              border: value === n ? '1.5px solid #E07B2A' : '1.5px solid transparent',
            }}>
            <p className="text-base leading-tight">{n}</p>
            <p style={{ fontSize: '0.6rem', opacity: 0.85, marginTop: 1 }}>{text}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const CAT_COLORS: Record<FormationCategory, string> = {
  offense: '#E07B2A',
  defense: '#1E3A5F',
}

// ===== FormationEditor =====
function FormationEditor({ formations, onChange }: {
  formations: FormationNote[]
  onChange: (f: FormationNote[]) => void
}) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState<number | null>(null)

  const add = () => {
    const nf: FormationNote = { name: '', courtType: 'half', category: 'offense', players: [], arrows: [], wentWell: '', challenge: '' }
    onChange([...formations, nf])
    setExpanded(formations.length)
  }

  const update = (i: number, patch: Partial<FormationNote>) =>
    onChange(formations.map((f, idx) => idx === i ? { ...f, ...patch } : f))

  const remove = (i: number) => {
    onChange(formations.filter((_, idx) => idx !== i))
    setExpanded(null)
  }

  return (
    <div className="space-y-2">
      {formations.map((f, i) => {
        const cat = f.category ?? 'offense'
        return (
          <div key={i} className="nb-card-plain">
            <div className="flex items-center justify-between"
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                  style={{ backgroundColor: `${CAT_COLORS[cat]}18`, color: CAT_COLORS[cat] }}>
                  {t(`cat.${cat}`)}
                </span>
                <span className="text-sm font-semibold truncate" style={{ color: '#1E3A5F' }}>
                  {f.name || `${t('pn.defaultFormation')} ${i + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <button onClick={e => { e.stopPropagation(); remove(i) }} style={{ color: '#C8BFB2' }}>
                  <Trash2 size={14} />
                </button>
                {expanded === i
                  ? <ChevronUp size={16} style={{ color: '#A89F92' }} />
                  : <ChevronDown size={16} style={{ color: '#A89F92' }} />
                }
              </div>
            </div>

            {expanded === i && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#7A6E5F' }}>{t('pn.formName')}</p>
                  <input value={f.name} onChange={e => update(i, { name: e.target.value })}
                    placeholder={t('pn.formNamePh')} className="nb-input" />
                </div>

                {/* カテゴリー選択 */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('pn.formCategory')}</p>
                  <div className="flex gap-2">
                    {(['offense', 'defense'] as FormationCategory[]).map(c => (
                      <button key={c}
                        onClick={() => update(i, {
                          category: c,
                          players: makeDefaultPlayers(f.courtType ?? 'half', c),
                          arrows: [],
                        })}
                        className="flex-1 py-2 rounded-xl text-xs font-bold"
                        style={{
                          backgroundColor: cat === c ? `${CAT_COLORS[c]}22` : 'rgba(195,175,148,0.15)',
                          color: cat === c ? CAT_COLORS[c] : '#7A6E5F',
                          border: `1.5px solid ${cat === c ? CAT_COLORS[c] : 'transparent'}`,
                        }}>
                        {t(`cat.${c}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* コート選択 */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('pn.formCourt')}</p>
                  <div className="flex gap-2">
                    {(['half', 'full'] as CourtType[]).map(ct => (
                      <button key={ct}
                        onClick={() => update(i, { courtType: ct, players: makeDefaultPlayers(ct, cat), arrows: [] })}
                        className="flex-1 py-2 rounded-xl text-xs font-bold"
                        style={{
                          backgroundColor: (f.courtType ?? 'half') === ct ? '#1E3A5F' : 'rgba(195,175,148,0.15)',
                          color: (f.courtType ?? 'half') === ct ? 'white' : '#7A6E5F',
                        }}>
                        {ct === 'half' ? t('pn.formHalf') : t('pn.formFull')}
                      </button>
                    ))}
                  </div>
                </div>

                <FormationDiagram
                  formation={noteToFormation(f, i)}
                  onChange={updated => update(i, { players: updated.players, arrows: updated.arrows })}
                />

                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#2E7D52' }}>{t('pn.formWell')}</p>
                  <textarea value={f.wentWell} onChange={e => update(i, { wentWell: e.target.value })}
                    className="nb-textarea" style={{ minHeight: 48 }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#DC3545' }}>{t('pn.formChallenge')}</p>
                  <textarea value={f.challenge} onChange={e => update(i, { challenge: e.target.value })}
                    className="nb-textarea" style={{ minHeight: 48 }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
      <button onClick={add}
        className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-1"
        style={{ backgroundColor: 'rgba(30,58,95,0.06)', color: '#1E3A5F', border: '1px dashed rgba(30,58,95,0.35)' }}>
        <Plus size={14} /> {t('pn.addFormation')}
      </button>
    </div>
  )
}

// ===== CoachFeedbackSection =====
function CoachFeedbackSection({ feedback, onSave, nextPhKey, readonly }: {
  feedback?: CoachFeedback
  onSave: (fb: CoachFeedback) => void
  nextPhKey: string
  readonly?: boolean
}) {
  const { lang, t } = useLanguage()
  const today = new Date().toISOString().split('T')[0]
  const [editing, setEditing] = useState(!feedback && !readonly)
  const [goodPoints, setGoodPoints]           = useState(feedback?.goodPoints ?? '')
  const [improvements, setImprovements]       = useState(feedback?.improvements ?? '')
  const [nextInstruction, setNextInstruction] = useState(feedback?.nextInstruction ?? '')
  const [coachName, setCoachName]             = useState(feedback?.coachName ?? '')
  const [date, setDate]                       = useState(feedback?.date ?? today)

  const save = () => {
    onSave({ goodPoints, improvements, nextInstruction, coachName, date })
    setEditing(false)
  }

  if (readonly && !feedback) return null

  if ((!editing && feedback) || (readonly && feedback)) {
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
          {!readonly && (
            <button onClick={() => setEditing(true)}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ backgroundColor: 'rgba(30,58,95,0.1)', color: '#1E3A5F' }}>
              {t('cf.edit')}
            </button>
          )}
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
            placeholder={t(nextPhKey)}
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

// ===== PracticeForm =====
function PracticeForm({ onSubmit, onCancel, latestNextChallenge, initialData, myTeams, onSelectTeam }: {
  onSubmit: (log: Omit<PracticeLog, 'id' | 'createdAt'>) => void
  onCancel: () => void
  latestNextChallenge: string
  initialData?: PracticeLog
  myTeams?: TeamWithRole[]
  onSelectTeam?: (teamId: string | null) => void
}) {
  const { t } = useLanguage()
  const isEditing = !!initialData
  const today = new Date().toISOString().split('T')[0]
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  // Step1
  const [date, setDate]               = useState(initialData?.date ?? today)
  const [practiceType, setPracticeType] = useState<PracticeType>(initialData?.practiceType ?? 'team')
  const [todayGoal, setTodayGoal]     = useState(initialData?.todayGoal ?? '')
  const [condition, setCondition]     = useState(initialData?.condition ?? 3)
  const [motivation, setMotivation]   = useState(initialData?.motivation ?? 3)

  // Step2
  const [duration, setDuration]       = useState(initialData?.duration ?? 90)
  const [menus, setMenus]             = useState<string[]>(initialData?.menus ?? [])
  const [customMenu, setCustomMenu]   = useState('')
  const [didWell, setDidWell]         = useState(initialData?.didWell ?? '')
  const [struggled, setStruggled]     = useState(initialData?.struggled ?? '')
  const [formations, setFormations]   = useState<FormationNote[]>(initialData?.formations ?? [])
  const [showFormations, setShowFormations] = useState((initialData?.formations?.length ?? 0) > 0)

  // Step3
  const [goalAchievement, setGoalAchievement] = useState<GoalAchievement>(initialData?.goalAchievement ?? 'achieved')
  const [achievementReason, setAchievementReason] = useState(initialData?.achievementReason ?? '')
  const [todayLearning, setTodayLearning]     = useState(initialData?.todayLearning ?? '')
  const [nextChallenge, setNextChallenge]     = useState(initialData?.nextChallenge ?? '')
  const [selfRating, setSelfRating]           = useState(initialData?.selfRating ?? 3)

  const toggleMenu = (m: string) =>
    setMenus(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const addCustomMenu = () => {
    const val = customMenu.trim()
    if (val && !menus.includes(val)) { setMenus(prev => [...prev, val]); setCustomMenu('') }
  }

  const handleSubmit = () => {
    onSubmit({
      date, practiceType, todayGoal, condition, motivation,
      duration, menus, didWell, struggled,
      formations: formations.length > 0 ? formations : undefined,
      goalAchievement, achievementReason,
      todayLearning, nextChallenge, selfRating,
    })
  }

  const condItems = [1,2,3,4,5].map(n => ({ n, text: t(`pn.cond.${n}`) }))
  const motvItems = [1,2,3,4,5].map(n => ({ n, text: t(`pn.motv.${n}`) }))

  const achOption = ACH_OPTIONS.find(o => o.value === goalAchievement)!
  const achLabel  = t(`pn.achReason.${goalAchievement}`)

  const stepLabels = [t('pn.step1'), t('pn.step2'), t('pn.step3')]

  return (
    <div>
      {/* ステップインジケーター */}
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
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('pn.date')}</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="nb-input" />
          </div>

          {/* 練習タイプ */}
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('pn.practiceType')}</p>
            <div className="flex gap-2">
              {(['team', 'solo'] as PracticeType[]).map(type => (
                <button key={type} onClick={() => setPracticeType(type)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: practiceType === type
                      ? (type === 'team' ? 'rgba(30,58,95,0.12)' : 'rgba(224,123,42,0.12)')
                      : 'rgba(195,175,148,0.15)',
                    color: practiceType === type
                      ? (type === 'team' ? '#1E3A5F' : '#E07B2A')
                      : '#7A6E5F',
                    border: practiceType === type
                      ? `1.5px solid ${type === 'team' ? '#1E3A5F' : '#E07B2A'}`
                      : '1.5px solid transparent',
                  }}>
                  {t(`pn.type.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-1" style={{ color: '#1E3A5F' }}>{t('pn.goal')}</p>
            <p className="text-xs mb-3" style={{ color: '#A89F92' }}>{t('pn.goalHint')}</p>
            {latestNextChallenge && (
              <button onClick={() => setTodayGoal(latestNextChallenge)}
                className="w-full text-left text-xs mb-3 px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(224,123,42,0.08)', color: '#E07B2A', border: '1px solid rgba(224,123,42,0.25)' }}>
                {t('pn.carryPrev')}「{latestNextChallenge}」
              </button>
            )}
            <textarea value={todayGoal} onChange={e => setTodayGoal(e.target.value)}
              placeholder={t('pn.goalPh')}
              className="nb-textarea" />
          </div>

          <div className="nb-card-plain space-y-4">
            <p className="text-xs font-bold" style={{ color: '#1E3A5F' }}>{t('pn.condState')}</p>
            <ConditionPicker label={t('pn.cond')} value={condition} onChange={setCondition} items={condItems} />
            <ConditionPicker label={t('pn.motv')} value={motivation} onChange={setMotivation} items={motvItems} />
          </div>

          {/* チーム共有（任意） */}
          {!isEditing && myTeams && myTeams.length > 0 && (
            <div className="nb-card-plain">
              <p className="text-xs font-bold mb-2" style={{ color: '#1E3A5F' }}>{t('practice.shareWithTeam')}</p>
              <div className="space-y-1">
                <button onClick={() => { setSelectedTeamId(null); onSelectTeam?.(null) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: selectedTeamId === null ? 'rgba(30,58,95,0.1)' : 'transparent',
                    color: selectedTeamId === null ? '#1E3A5F' : '#7A6E5F',
                    fontWeight: selectedTeamId === null ? 600 : 400,
                  }}>
                  ○ {t('practice.sharePrivate')}
                </button>
                {myTeams.map(team => (
                  <button key={team.id} onClick={() => { setSelectedTeamId(team.id); onSelectTeam?.(team.id) }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: selectedTeamId === team.id ? 'rgba(224,123,42,0.1)' : 'transparent',
                      color: selectedTeamId === team.id ? '#E07B2A' : '#7A6E5F',
                      fontWeight: selectedTeamId === team.id ? 600 : 400,
                    }}>
                    ● {team.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setStep(2)} disabled={!todayGoal.trim()} className="btn-primary">
            {t('pn.next1')}
          </button>
        </div>
      )}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('pn.duration')}</p>
            <div className="flex items-center gap-3">
              <input type="number" inputMode="numeric"
                value={duration === 0 ? '' : duration}
                onChange={e => setDuration(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value) || 0))}
                onFocus={e => e.target.select()}
                min={1} className="nb-input" style={{ width: 80, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }} />
              <span className="text-sm" style={{ color: '#7A6E5F' }}>{t('pn.minUnit')}</span>
            </div>
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('pn.menu')}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {MENU_PRESET_KEYS.map(m => (
                <button key={m} onClick={() => toggleMenu(m)}
                  className="tag-chip"
                  style={menus.includes(m) ? { backgroundColor: '#E07B2A', color: 'white', borderColor: '#E07B2A' } : {}}>
                  {t(`pn.menu.${m}`) !== `pn.menu.${m}` ? t(`pn.menu.${m}`) : m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customMenu} onChange={e => setCustomMenu(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomMenu()}
                placeholder={t('pn.menuOtherPh')} className="nb-input" style={{ flex: 1 }} />
              <button onClick={addCustomMenu}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'rgba(224,123,42,0.12)', color: '#E07B2A', whiteSpace: 'nowrap' }}>
                {t('pn.menuAdd')}
              </button>
            </div>
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#2E7D52' }}>{t('pn.didWell')}</p>
            <textarea value={didWell} onChange={e => setDidWell(e.target.value)}
              placeholder={t('pn.didWellPh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#DC3545' }}>{t('pn.struggled')}</p>
            <textarea value={struggled} onChange={e => setStruggled(e.target.value)}
              placeholder={t('pn.struggledPh')} className="nb-textarea" />
          </div>

          {/* フォーメーション（任意） */}
          <div className="nb-card-plain">
            <button className="w-full flex items-center justify-between"
              onClick={() => setShowFormations(v => !v)}>
              <p className="text-xs font-bold" style={{ color: '#1E3A5F' }}>
                {t('pn.formations')}
              </p>
              <div className="flex items-center gap-1">
                {formations.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(30,58,95,0.1)', color: '#1E3A5F' }}>
                    {t('pn.formationCount').replace('{n}', String(formations.length))}
                  </span>
                )}
                {showFormations
                  ? <ChevronUp size={16} style={{ color: '#A89F92' }} />
                  : <ChevronDown size={16} style={{ color: '#A89F92' }} />}
              </div>
            </button>
            {showFormations && (
              <div className="mt-3">
                <FormationEditor formations={formations} onChange={setFormations} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>{t('pn.back')}</button>
            <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2 }}>{t('pn.next2')}</button>
          </div>
        </div>
      )}

      {/* ===== STEP 3 ===== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="nb-card">
            <p className="text-xs font-bold mb-1" style={{ color: '#1E3A5F' }}>{t('pn.goalAch')}</p>
            <p className="text-xs mb-3 px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(224,123,42,0.08)', color: '#E07B2A' }}>
              「{todayGoal}」
            </p>
            <div className="flex gap-2">
              {ACH_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setGoalAchievement(opt.value)}
                  className="flex-1 py-3 rounded-xl text-xs text-center font-semibold transition-all"
                  style={{
                    backgroundColor: goalAchievement === opt.value ? opt.color : 'rgba(195,175,148,0.1)',
                    color: goalAchievement === opt.value ? opt.border : '#A89F92',
                    border: goalAchievement === opt.value ? `1.5px solid ${opt.border}` : '1.5px solid transparent',
                    fontWeight: goalAchievement === opt.value ? 700 : 400,
                  }}>
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: achOption.border }}>{achLabel}</p>
            <p className="text-xs mb-2" style={{ color: '#A89F92' }}>{t('pn.achReasonHint')}</p>
            <textarea value={achievementReason} onChange={e => setAchievementReason(e.target.value)}
              placeholder={t('pn.achReasonPh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#1E3A5F' }}>{t('pn.learning')}</p>
            <p className="text-xs mb-2" style={{ color: '#A89F92' }}>{t('pn.learningHint')}</p>
            <textarea value={todayLearning} onChange={e => setTodayLearning(e.target.value)}
              placeholder={t('pn.learningPh')} className="nb-textarea" />
          </div>

          <div className="nb-card">
            <p className="text-xs font-bold mb-2" style={{ color: '#E07B2A' }}>{t('pn.nextChallenge')}</p>
            <p className="text-xs mb-2" style={{ color: '#A89F92' }}>{t('pn.nextChallengeHint')}</p>
            <textarea value={nextChallenge} onChange={e => setNextChallenge(e.target.value)}
              placeholder={t('pn.nextChallengePh')} className="nb-textarea" />
          </div>

          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>{t('pn.selfRating')}</p>
            <StarRow value={selfRating} onChange={setSelfRating} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>{t('pn.back')}</button>
            <button onClick={handleSubmit} disabled={!todayLearning.trim()} className="btn-primary" style={{ flex: 2 }}>
              {isEditing ? t('pn.update') : t('pn.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== PracticeDetail =====
function PracticeDetail({ log, onBack, onDelete, onUpdate, onEdit }: {
  log: PracticeLog
  onBack: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<PracticeLog>) => void
  onEdit: () => void
}) {
  const { lang, t } = useLanguage()
  const ach = ACH_OPTIONS.find(o => o.value === log.goalAchievement) ?? ACH_OPTIONS[0]
  const condWords = ['', ...([1,2,3,4,5].map(n => t(`pn.cond.${n}`)))]
  const motvWords = ['', ...([1,2,3,4,5].map(n => t(`pn.motv.${n}`)))]

  return (
    <div className="space-y-4 page-enter">
      {/* ヘッダー */}
      <div className="nb-card-plain" style={{ borderLeft: `4px solid #E07B2A` }}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs" style={{ color: '#A89F92' }}>{fmtDate(log.date, lang)}</p>
          {log.practiceType && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{
                backgroundColor: log.practiceType === 'team' ? 'rgba(30,58,95,0.1)' : 'rgba(224,123,42,0.1)',
                color: log.practiceType === 'team' ? '#1E3A5F' : '#E07B2A',
              }}>
              {log.practiceType === 'team' ? '👥' : '🏃'} {t(`pn.type.${log.practiceType}`)}
            </span>
          )}
        </div>
        <p className="text-base font-bold font-klee" style={{ color: '#1E3A5F' }}>{log.todayGoal}</p>
        <div className="flex gap-3 mt-2 text-xs" style={{ color: '#7A6E5F' }}>
          <span>{log.duration}{t('pn.minUnit')}</span>
          <span>{t('pn.detail.cond')}{condWords[log.condition]}</span>
          <span>{t('pn.detail.motv')}{motvWords[log.motivation]}</span>
        </div>
      </div>

      {/* 練習メニュー */}
      {log.menus.length > 0 && (
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-2" style={{ color: '#1E3A5F' }}>{t('pn.detail.menu')}</p>
          <div className="flex flex-wrap gap-2">
            {log.menus.map(m => (
              <span key={m} className="tag-chip">
                {t(`pn.menu.${m}`) !== `pn.menu.${m}` ? t(`pn.menu.${m}`) : m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* できた・できなかった */}
      {(log.didWell || log.struggled) && (
        <div className="nb-card space-y-3">
          {log.didWell && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#2E7D52' }}>{t('pn.detail.didWell')}</p>
              <p className="text-sm" style={{ color: '#1E1A14' }}>{log.didWell}</p>
            </div>
          )}
          {log.struggled && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#DC3545' }}>{t('pn.detail.struggled')}</p>
              <p className="text-sm" style={{ color: '#1E1A14' }}>{log.struggled}</p>
            </div>
          )}
        </div>
      )}

      {/* フォーメーション */}
      {log.formations && log.formations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold px-1" style={{ color: '#1E3A5F' }}>{t('pn.detail.formations')}</p>
          {log.formations.map((f, i) => (
            <div key={i} className="nb-card-plain space-y-2">
              {f.name && (
                <p className="text-sm font-bold" style={{ color: '#1E3A5F' }}>{f.name}</p>
              )}
              {f.players && f.players.length > 0 && (
                <FormationDiagram
                  formation={noteToFormation(f, i)}
                  readonly
                />
              )}
              {f.wentWell && (
                <p className="text-xs" style={{ color: '#2E7D52' }}>◎ {f.wentWell}</p>
              )}
              {f.challenge && (
                <p className="text-xs" style={{ color: '#DC3545' }}>△ {f.challenge}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 振り返り */}
      <div className="nb-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: ach.color, color: ach.border, border: `1px solid ${ach.border}` }}>
            {t(ach.labelKey)}
          </span>
        </div>
        {log.achievementReason && (
          <p className="text-sm mt-2" style={{ color: '#1E1A14' }}>{log.achievementReason}</p>
        )}
      </div>

      {log.todayLearning && (
        <div className="nb-card" style={{ borderLeft: '4px solid #E07B2A' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#E07B2A' }}>{t('pn.detail.learning')}</p>
          <p className="text-sm" style={{ color: '#1E1A14' }}>{log.todayLearning}</p>
        </div>
      )}

      {log.nextChallenge && (
        <div className="nb-card-plain" style={{ borderLeft: '4px solid #1E3A5F' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#1E3A5F' }}>{t('pn.detail.nextChall')}</p>
          <p className="text-sm" style={{ color: '#1E1A14' }}>{log.nextChallenge}</p>
        </div>
      )}

      <div className="nb-card-plain">
        <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('pn.detail.selfRating')}</p>
        <StarRow value={log.selfRating} readonly />
      </div>

      {/* コーチFB */}
      <CoachFeedbackSection
        feedback={log.coachFeedback}
        onSave={fb => onUpdate({ coachFeedback: fb })}
        nextPhKey="cf.nextPh.practice"
        readonly
      />

      <div className="flex gap-2">
        <button onClick={onEdit}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ color: '#1E3A5F', border: '1px solid rgba(30,58,95,0.3)', backgroundColor: 'rgba(30,58,95,0.05)' }}>
          {t('pn.editBtn')}
        </button>
        <button onClick={onDelete}
          className="flex-1 py-3 rounded-xl text-sm"
          style={{ color: '#DC3545', border: '1px solid rgba(220,53,69,0.3)', backgroundColor: 'rgba(220,53,69,0.04)' }}>
          {t('pn.delete')}
        </button>
      </div>
    </div>
  )
}

// ===== PracticeNote (main) =====
export function PracticeNote({ logs, latestNextChallenge, onAdd, onUpdate, onDelete, onAddFormation, teams }: Props) {
  const { lang, t } = useLanguage()
  const [view, setView] = useState<'list' | 'form' | 'detail' | 'edit'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingShareTeamId, setPendingShareTeamId] = useState<string | null>(null)

  const selectedLog = logs.find(l => l.id === selectedId)

  const playerTeams = teams.myTeams.filter(t => t.myRole === 'player')

  if (view === 'form') return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('list')} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('pn.formTitle')}</h1>
      </div>
      <PracticeForm
        onSubmit={log => {
          onAdd(log).then(newLog => {
            if (pendingShareTeamId) {
              teams.shareRecord(newLog.id, 'practice', pendingShareTeamId).catch(console.error)
            }
          })
          // フォーメーションを作戦ボードに自動保存
          if (log.formations && log.formations.length > 0) {
            log.formations.forEach(f => {
              if (f.name.trim() || (f.players && f.players.length > 0)) {
                const cat = f.category ?? 'offense'
                onAddFormation({
                  name: f.name.trim() || t('pn.defaultFormation'),
                  courtType: f.courtType ?? 'half',
                  category: cat,
                  players: f.players && f.players.length > 0 ? f.players : makeDefaultPlayers(f.courtType ?? 'half', cat),
                  arrows: f.arrows ?? [],
                })
              }
            })
          }
          setView('list')
        }}
        onCancel={() => setView('list')}
        latestNextChallenge={latestNextChallenge}
        myTeams={playerTeams}
        onSelectTeam={setPendingShareTeamId}
      />
    </div>
  )

  if (view === 'edit' && selectedLog) return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('detail')} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('pn.editTitle')}</h1>
      </div>
      <PracticeForm
        onSubmit={updates => {
          onUpdate(selectedLog.id, updates)
          setView('detail')
        }}
        onCancel={() => setView('detail')}
        latestNextChallenge={latestNextChallenge}
        initialData={selectedLog}
      />
    </div>
  )

  if (view === 'detail' && selectedLog) return (
    <div className="page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setView('list')} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('pn.detailTitle')}</h1>
      </div>
      <PracticeDetail
        log={selectedLog}
        onBack={() => setView('list')}
        onDelete={() => { onDelete(selectedLog.id); setView('list') }}
        onUpdate={updates => onUpdate(selectedLog.id, updates)}
        onEdit={() => setView('edit')}
      />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('pn.title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#A89F92' }}>
            {t('pn.records').replace('{n}', String(logs.length))}
          </p>
        </div>
        <button onClick={() => setView('form')}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ backgroundColor: '#E07B2A', color: 'white' }}>
          <BookOpen size={14} /> {t('pn.write')}
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="nb-card text-center py-12" style={{}}
          onClick={() => setView('form')}>
          <p className="text-3xl mb-3">📓</p>
          <p className="text-sm" style={{ color: '#A89F92' }}>{t('pn.noNotes')}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#E07B2A' }}>{t('pn.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => {
            const ach = ACH_OPTIONS.find(o => o.value === log.goalAchievement) ?? ACH_OPTIONS[0]
            const menuDisplay = log.menus.map(m =>
              t(`pn.menu.${m}`) !== `pn.menu.${m}` ? t(`pn.menu.${m}`) : m
            ).join(' · ')
            return (
              <div key={log.id} className="nb-card"
                onClick={() => { setSelectedId(log.id); setView('detail') }}
                style={{ cursor: 'pointer' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs" style={{ color: '#A89F92' }}>
                        {fmtDate(log.date, lang)} · {log.duration}{t('pn.minUnit')}
                      </p>
                      {log.practiceType && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{
                            backgroundColor: log.practiceType === 'team' ? 'rgba(30,58,95,0.1)' : 'rgba(224,123,42,0.1)',
                            color: log.practiceType === 'team' ? '#1E3A5F' : '#E07B2A',
                          }}>
                          {t(`pn.type.${log.practiceType}`)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#1E1A14' }}>{log.todayGoal}</p>
                    {log.menus.length > 0 && (
                      <p className="text-xs mt-1 truncate" style={{ color: '#A89F92' }}>
                        {menuDisplay}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: ach.color, color: ach.border }}>
                      {t(ach.labelKey)}
                    </span>
                    <StarRow value={log.selfRating} readonly />
                  </div>
                </div>
                {log.todayLearning && (
                  <p className="text-xs mt-2 pt-2 truncate"
                    style={{ color: '#7A6E5F', borderTop: '1px solid rgba(195,175,148,0.35)' }}>
                    {log.todayLearning}
                  </p>
                )}
                {log.coachFeedback && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1E3A5F' }} />
                    <p className="text-xs" style={{ color: '#5B7BA8' }}>{t('pn.coachFB')}</p>
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
