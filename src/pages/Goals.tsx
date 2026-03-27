import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2, CheckCircle2 } from 'lucide-react'
import { TooltipWrapper } from '../components/Tooltip'
import type { Goal, GoalType, GoalCategory } from '../types'
import { useLanguage } from '../contexts/LanguageContext'

interface Props {
  goals: Goal[]
  onAdd: (g: Omit<Goal, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, updates: Partial<Goal>) => void
  onDelete: (id: string) => void
}

const CAT_KEYS: Record<GoalCategory, string> = {
  skill:    'goal.cat.skill',
  physical: 'goal.cat.physical',
  mental:   'goal.cat.mental',
  team:     'goal.cat.team',
  other:    'goal.cat.other',
}

const CAT_STYLE: Record<GoalCategory, { color: string; bg: string }> = {
  skill:    { color: '#E07B2A', bg: 'rgba(224,123,42,0.12)' },
  physical: { color: '#DC3545', bg: 'rgba(220,53,69,0.08)' },
  mental:   { color: '#6B5CA5', bg: 'rgba(107,92,165,0.12)' },
  team:     { color: '#1E3A5F', bg: 'rgba(30,58,95,0.1)' },
  other:    { color: '#7A6E5F', bg: 'rgba(195,175,148,0.2)' },
}

function GoalForm({ onSubmit, onCancel }: { onSubmit: (g: Omit<Goal, 'id' | 'createdAt'>) => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const [title, setTitle]       = useState('')
  const [detail, setDetail]     = useState('')
  const [type, setType]         = useState<GoalType>('short')
  const [category, setCategory] = useState<GoalCategory>('skill')
  const [deadline, setDeadline] = useState('')

  const cats = Object.keys(CAT_KEYS) as GoalCategory[]

  return (
    <div className="space-y-4">
      <div className="nb-card-plain">
        <p className="text-xs font-bold mb-3" style={{ color: '#1E1A14' }}>{t('goal.form.type')}</p>
        <div className="flex gap-2">
          {([['short', 'goal.form.shortLabel', 'goal.form.shortSub'], ['long', 'goal.form.longLabel', 'goal.form.longSub']] as [GoalType, string, string][]).map(([v, lKey, sKey]) => (
            <button key={v} onClick={() => setType(v)}
              className="flex-1 py-3 rounded-xl text-sm text-center transition-all"
              style={{
                backgroundColor: type === v ? (v === 'short' ? 'rgba(224,123,42,0.12)' : 'rgba(30,58,95,0.1)') : 'rgba(195,175,148,0.15)',
                color:           type === v ? (v === 'short' ? '#E07B2A' : '#1E3A5F') : '#7A6E5F',
                fontWeight:      type === v ? 700 : 400,
                border:          type === v ? `1.5px solid ${v === 'short' ? '#E07B2A' : '#1E3A5F'}` : '1.5px solid transparent',
              }}>
              <p>{t(lKey)}</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: 2 }}>{t(sKey)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="nb-card-plain">
        <p className="text-xs font-bold mb-3" style={{ color: '#1E1A14' }}>{t('goal.form.category')}</p>
        <div className="grid grid-cols-3 gap-2">
          {cats.map(v => {
            const s = CAT_STYLE[v]
            return (
              <button key={v} onClick={() => setCategory(v)}
                className="py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: category === v ? s.bg : 'rgba(195,175,148,0.15)',
                  color:           category === v ? s.color : '#7A6E5F',
                  border:          category === v ? `1.5px solid ${s.color}` : '1.5px solid transparent',
                }}>
                {t(CAT_KEYS[v])}
              </button>
            )
          })}
        </div>
      </div>

      <div className="nb-card">
        <p className="text-xs font-bold mb-3" style={{ color: '#1E1A14' }}>{t('goal.form.content')}</p>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('goal.form.titlePh')} className="nb-input mb-4" />
        <textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder={t('goal.form.detailPh')} className="nb-textarea" style={{ minHeight: 60 }} />
      </div>

      <div className="nb-card-plain">
        <p className="text-xs font-bold mb-3" style={{ color: '#1E1A14' }}>{t('goal.form.deadline')}</p>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="nb-input" />
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1">{t('goal.form.cancel')}</button>
        <button disabled={!title.trim()}
          onClick={() => onSubmit({ title, detail, type, category, deadline, progress: 0, isCompleted: false })}
          className="btn-primary" style={{ flex: 2 }}>
          {t('goal.form.submit')}
        </button>
      </div>
    </div>
  )
}

function GoalItem({ goal, onProgressChange, onComplete, onDelete }: {
  goal: Goal
  onProgressChange: (p: number) => void
  onComplete: () => void
  onDelete: () => void
}) {
  const { t } = useLanguage()
  const s = CAT_STYLE[goal.category]
  const catLabel = t(CAT_KEYS[goal.category])

  const fmtDeadline = (str: string) => {
    if (!str) return t('goal.noDeadline')
    const d = new Date(str)
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
    if (days < 0) return t('goal.expired')
    if (days === 0) return t('goal.today')
    return t('goal.remaining').replace('{n}', String(days))
  }

  const dl = fmtDeadline(goal.deadline)
  const overdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted

  return (
    <div className="nb-card-plain" style={goal.isCompleted ? { opacity: 0.5 } : undefined}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>{catLabel}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: goal.type === 'short' ? 'rgba(224,123,42,0.12)' : 'rgba(30,58,95,0.1)',
                color:           goal.type === 'short' ? '#E07B2A' : '#1E3A5F',
              }}>
              {goal.type === 'short' ? t('goal.short') : t('goal.long')}
            </span>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#1E1A14', textDecoration: goal.isCompleted ? 'line-through' : 'none' }}>{goal.title}</p>
          {goal.detail && <p className="text-xs mt-0.5 truncate" style={{ color: '#7A6E5F' }}>{goal.detail}</p>}
        </div>
        {goal.isCompleted
          ? <CheckCircle2 size={20} style={{ color: '#2E7D52', flexShrink: 0 }} />
          : <span className="text-xs whitespace-nowrap" style={{ color: overdue ? '#DC3545' : '#A89F92', fontWeight: overdue ? 700 : 400 }}>{dl}</span>
        }
      </div>

      {!goal.isCompleted && (
        <>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'rgba(195,175,148,0.3)' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${goal.progress}%`, background: 'linear-gradient(90deg, #E07B2A, #C4520D)' }} />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color: '#A89F92' }}>{goal.progress}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={goal.progress}
            onChange={e => onProgressChange(Number(e.target.value))}
            className="w-full mb-3" style={{ accentColor: '#E07B2A' }} />
          <div className="flex gap-2">
            <button onClick={onComplete}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'rgba(46,125,82,0.12)', color: '#2E7D52' }}>
              {t('goal.achieve')}
            </button>
            <button onClick={onDelete} className="p-2 rounded-xl" style={{ color: '#C3AF94' }}>
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
      {goal.isCompleted && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs font-semibold" style={{ color: '#2E7D52' }}>{t('goal.achieved')}</span>
          <button onClick={onDelete} style={{ color: '#C3AF94' }}><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  )
}

export function GoalsPage({ goals, onAdd, onUpdate, onDelete }: Props) {
  const { t, lang } = useLanguage()
  const [showForm, setShowForm]           = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const active    = goals.filter(g => !g.isCompleted)
  const completed = goals.filter(g => g.isCompleted)

  if (showForm) return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setShowForm(false)} className="text-lg" style={{ color: '#7A6E5F' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('goal.setTitle')}</h1>
      </div>
      <GoalForm onSubmit={g => { onAdd(g); setShowForm(false) }} onCancel={() => setShowForm(false)} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('goal.title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#A89F92' }}>
            {t('goal.activeCount').replace('{n}', String(active.length)).replace('{m}', String(completed.length))}
          </p>
        </div>
        <TooltipWrapper
          tooltipKey="goals-add"
          message={{ ja: '🎯 目標を設定してみよう！', en: '🎯 Set your first goal!' }}
          lang={lang}
          position="bottom"
          align="right"
        >
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#E07B2A', color: 'white' }}>
            <Plus size={14} /> {t('goal.add')}
          </button>
        </TooltipWrapper>
      </div>

      {active.length === 0 && completed.length === 0 ? (
        <div className="nb-card text-center py-12" onClick={() => setShowForm(true)}>
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-sm" style={{ color: '#A89F92' }}>{t('goal.noGoals')}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#E07B2A' }}>{t('goal.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(g => (
            <GoalItem key={g.id} goal={g}
              onProgressChange={p => onUpdate(g.id, { progress: p })}
              onComplete={() => onUpdate(g.id, { isCompleted: true, progress: 100 })}
              onDelete={() => onDelete(g.id)} />
          ))}
          {completed.length > 0 && (
            <>
              <button onClick={() => setShowCompleted(v => !v)}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm"
                style={{ color: '#A89F92' }}>
                {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {t('goal.completedSect').replace('{n}', String(completed.length))}
              </button>
              {showCompleted && completed.map(g => (
                <GoalItem key={g.id} goal={g}
                  onProgressChange={() => {}} onComplete={() => {}}
                  onDelete={() => onDelete(g.id)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
