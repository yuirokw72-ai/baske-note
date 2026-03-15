import { useState, useEffect } from 'react'
import { Plus, ChevronRight, BookOpen } from 'lucide-react'
import type { Formation, CourtType, FormationCategory, PlayerPos, TeamWithRole } from '../types'
import { FormationDiagram } from '../components/FormationDiagram'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ===== プリセットフォーメーション =====
const PRESET_FORMATIONS: Formation[] = [
  // ----------------------------------------------------------------
  // 1. トライアングルオフェンス
  // ----------------------------------------------------------------
  {
    id: 'preset-triangle',
    name: 'preset-triangle',
    courtType: 'half',
    category: 'offense',
    createdAt: '',
    players: [
      { id: 'o1', x: 0.42, y: 0.84, hasBall: true },
      { id: 'o2', x: 0.82, y: 0.58 },
      { id: 'o3', x: 0.88, y: 0.24 },
      { id: 'o4', x: 0.18, y: 0.56 },
      { id: 'o5', x: 0.72, y: 0.18 },
    ],
    arrows: [
      { id: 't1', type: 'pass', x1: 0.42, y1: 0.84, x2: 0.82, y2: 0.58, cx: 0.66, cy: 0.66 },
      { id: 't2', type: 'cut',  x1: 0.42, y1: 0.84, x2: 0.22, y2: 0.38, cx: 0.30, cy: 0.60 },
      { id: 't3', type: 'pass', x1: 0.82, y1: 0.58, x2: 0.88, y2: 0.24 },
      { id: 't4', type: 'pass', x1: 0.88, y1: 0.24, x2: 0.72, y2: 0.18, cx: 0.82, cy: 0.16 },
      { id: 't5', type: 'cut',  x1: 0.18, y1: 0.56, x2: 0.30, y2: 0.70 },
    ],
  },

  // ----------------------------------------------------------------
  // 2. モーションオフェンス（5アウト）
  // ----------------------------------------------------------------
  {
    id: 'preset-motion',
    name: 'preset-motion',
    courtType: 'half',
    category: 'offense',
    createdAt: '',
    players: [
      { id: 'o1', x: 0.50, y: 0.84, hasBall: true },
      { id: 'o2', x: 0.84, y: 0.62 },
      { id: 'o3', x: 0.16, y: 0.62 },
      { id: 'o4', x: 0.82, y: 0.24 },
      { id: 'o5', x: 0.18, y: 0.24 },
    ],
    arrows: [
      { id: 'm1', type: 'pass', x1: 0.50, y1: 0.84, x2: 0.84, y2: 0.62, cx: 0.70, cy: 0.70 },
      { id: 'm2', type: 'cut',  x1: 0.50, y1: 0.84, x2: 0.52, y2: 0.28, cx: 0.58, cy: 0.55 },
      { id: 'm3', type: 'cut',  x1: 0.16, y1: 0.62, x2: 0.42, y2: 0.82, cx: 0.22, cy: 0.78 },
      { id: 'm4', type: 'cut',  x1: 0.18, y1: 0.24, x2: 0.18, y2: 0.58 },
      { id: 'm5', type: 'pass', x1: 0.84, y1: 0.62, x2: 0.52, y2: 0.28, cx: 0.72, cy: 0.38 },
    ],
  },

  // ----------------------------------------------------------------
  // 3. ピック＆ロール
  // ----------------------------------------------------------------
  {
    id: 'preset-pickroll',
    name: 'preset-pickroll',
    courtType: 'half',
    category: 'offense',
    createdAt: '',
    players: [
      { id: 'o1', x: 0.46, y: 0.80, hasBall: true },
      { id: 'o2', x: 0.84, y: 0.52 },
      { id: 'o3', x: 0.16, y: 0.60 },
      { id: 'o4', x: 0.84, y: 0.22 },
      { id: 'o5', x: 0.44, y: 0.64 },
    ],
    arrows: [
      { id: 'pr1', type: 'screen',  x1: 0.44, y1: 0.64, x2: 0.50, y2: 0.74 },
      { id: 'pr2', type: 'dribble', x1: 0.46, y1: 0.80, x2: 0.70, y2: 0.56, cx: 0.54, cy: 0.64 },
      { id: 'pr3', type: 'cut',     x1: 0.50, y1: 0.74, x2: 0.56, y2: 0.18, cx: 0.60, cy: 0.44 },
      { id: 'pr4', type: 'pass',    x1: 0.70, y1: 0.56, x2: 0.56, y2: 0.18, cx: 0.66, cy: 0.34 },
      { id: 'pr5', type: 'cut',     x1: 0.84, y1: 0.52, x2: 0.88, y2: 0.28 },
    ],
  },

  // ----------------------------------------------------------------
  // 4. 2-3ゾーンディフェンス
  // ----------------------------------------------------------------
  {
    id: 'preset-zone23',
    name: 'preset-zone23',
    courtType: 'half',
    category: 'defense',
    createdAt: '',
    players: [
      { id: 'd1', x: 0.34, y: 0.70 },
      { id: 'd2', x: 0.66, y: 0.70 },
      { id: 'd3', x: 0.16, y: 0.30 },
      { id: 'd4', x: 0.84, y: 0.30 },
      { id: 'd5', x: 0.50, y: 0.18 },
    ],
    arrows: [
      { id: 'z1', type: 'cut', x1: 0.66, y1: 0.70, x2: 0.80, y2: 0.58, cx: 0.74, cy: 0.62 },
      { id: 'z2', type: 'cut', x1: 0.34, y1: 0.70, x2: 0.52, y2: 0.65 },
      { id: 'z3', type: 'cut', x1: 0.84, y1: 0.30, x2: 0.84, y2: 0.46 },
      { id: 'z4', type: 'cut', x1: 0.50, y1: 0.18, x2: 0.64, y2: 0.20 },
      { id: 'z5', type: 'cut', x1: 0.16, y1: 0.30, x2: 0.28, y2: 0.22 },
    ],
  },

  // ----------------------------------------------------------------
  // 5. マンツーマン（ヘルプディフェンス）
  // ----------------------------------------------------------------
  {
    id: 'preset-man2man',
    name: 'preset-man2man',
    courtType: 'half',
    category: 'defense',
    createdAt: '',
    players: [
      { id: 'd1', x: 0.50, y: 0.78 },
      { id: 'd2', x: 0.82, y: 0.60 },
      { id: 'd3', x: 0.18, y: 0.60 },
      { id: 'd4', x: 0.80, y: 0.26 },
      { id: 'd5', x: 0.50, y: 0.18 },
    ],
    arrows: [
      { id: 'h1', type: 'cut', x1: 0.50, y1: 0.78, x2: 0.56, y2: 0.72 },
      { id: 'h2', type: 'cut', x1: 0.82, y1: 0.60, x2: 0.62, y2: 0.46, cx: 0.76, cy: 0.50 },
      { id: 'h3', type: 'cut', x1: 0.80, y1: 0.26, x2: 0.80, y2: 0.48, cx: 0.84, cy: 0.38 },
      { id: 'h4', type: 'cut', x1: 0.18, y1: 0.60, x2: 0.30, y2: 0.44, cx: 0.20, cy: 0.50 },
      { id: 'h5', type: 'cut', x1: 0.50, y1: 0.18, x2: 0.48, y2: 0.26 },
    ],
  },
]

// Helper: get the translation key prefix from a preset ID
function presetKey(id: string): string {
  return id.replace('preset-', '')
}

// Initial players for a fresh formation
function makeDefaultPlayers(courtType: CourtType): PlayerPos[] {
  const isHalf = courtType === 'half'
  return isHalf
    ? [
        { id: 'o1', x: 0.500, y: 0.840, hasBall: true },
        { id: 'o2', x: 0.800, y: 0.650 },
        { id: 'o3', x: 0.200, y: 0.650 },
        { id: 'o4', x: 0.860, y: 0.320 },
        { id: 'o5', x: 0.140, y: 0.320 },
      ]
    : [
        { id: 'o1', x: 0.500, y: 0.920, hasBall: true },
        { id: 'o2', x: 0.800, y: 0.820 },
        { id: 'o3', x: 0.200, y: 0.820 },
        { id: 'o4', x: 0.880, y: 0.680 },
        { id: 'o5', x: 0.120, y: 0.680 },
      ]
}

const CAT_COLORS: Record<FormationCategory, string> = {
  offense: '#E07B2A',
  defense: '#1E3A5F',
}

interface Props {
  formations: Formation[]
  onAdd: (f: Omit<Formation, 'id' | 'createdAt'>) => Formation
  onUpdate: (id: string, updates: Partial<Formation>) => void
  onDelete: (id: string) => void
  teams: { myTeams: TeamWithRole[] }
}

// ===== Preset Detail View =====
function PresetDetail({ formation, onCopy, onBack }: {
  formation: Formation
  onCopy: () => void
  onBack: () => void
}) {
  const { t } = useLanguage()
  const pKey = presetKey(formation.id)
  const name = t(`preset.${pKey}.name`)
  const desc = t(`preset.${pKey}.desc`)
  const catLabel = t(`cat.${formation.category}`)

  return (
    <div className="space-y-4 page-enter">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <div className="flex-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2"
            style={{ backgroundColor: `${CAT_COLORS[formation.category]}18`, color: CAT_COLORS[formation.category] }}>
            {catLabel}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(195,175,148,0.15)', color: '#7A6E5F' }}>
            {t('fp.preset.badge')}
          </span>
        </div>
      </div>
      <h1 className="text-xl font-bold font-klee" style={{ color: '#1E1A14' }}>{name}</h1>

      {desc && (
        <p className="text-sm leading-relaxed" style={{ color: '#7A6E5F' }}>{desc}</p>
      )}

      <FormationDiagram
        formation={formation}
        readonly
        onChange={() => {}}
      />

      <button
        onClick={onCopy}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        style={{ backgroundColor: '#E07B2A', color: 'white' }}>
        <BookOpen size={15} />
        {t('fp.preset.copyButton')}
      </button>
    </div>
  )
}

// ===== New Formation Dialog =====
function NewFormationDialog({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (name: string, courtType: CourtType, category: FormationCategory) => void
}) {
  const { t } = useLanguage()
  const [name, setName]           = useState('')
  const [courtType, setCourtType] = useState<CourtType>('half')
  const [category, setCategory]   = useState<FormationCategory>('offense')

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}>
      <div className="w-full max-w-md mx-auto rounded-b-none rounded-t-2xl pb-8"
        style={{ backgroundColor: '#FEFCF8', border: '1px solid rgba(195,175,148,0.4)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 mt-2 bg-gray-300" />
        <div className="px-4">
          <p className="text-base font-bold mb-4" style={{ color: '#1E1A14' }}>{t('fp.new.title')}</p>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('fp.new.name')}</p>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder={t('fp.new.namePlaceholder')}
                className="nb-input" autoFocus />
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('fp.new.court')}</p>
              <div className="flex gap-2">
                {(['half', 'full'] as CourtType[]).map(ct => (
                  <button key={ct} onClick={() => setCourtType(ct)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{
                      backgroundColor: courtType === ct ? '#1E3A5F' : 'rgba(195,175,148,0.15)',
                      color: courtType === ct ? 'white' : '#7A6E5F',
                    }}>
                    {ct === 'half' ? t('fp.new.courtHalf') : t('fp.new.courtFull')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#7A6E5F' }}>{t('fp.new.category')}</p>
              <div className="flex gap-2">
                {(['offense', 'defense'] as FormationCategory[]).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      backgroundColor: category === cat ? `${CAT_COLORS[cat]}22` : 'rgba(195,175,148,0.15)',
                      color: category === cat ? CAT_COLORS[cat] : '#7A6E5F',
                      border: `1.5px solid ${category === cat ? CAT_COLORS[cat] : 'transparent'}`,
                    }}>
                    {t(`cat.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => name.trim() && onSubmit(name.trim(), courtType, category)}
              disabled={!name.trim()}
              className="btn-primary mt-2">
              {t('fp.new.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Mini Court Preview =====
function MiniCourtPreview({ formation }: { formation: Formation }) {
  const isHalf = formation.courtType === 'half'
  const ch = isHalf ? 80 : 160
  const cw = 100
  const scale = (x: number, y: number) => [x * cw, y * ch] as [number, number]

  return (
    <svg viewBox={`0 0 ${cw} ${ch}`} style={{ width: 60, height: isHalf ? 48 : 72, borderRadius: 6 }}>
      <rect width={cw} height={ch} fill="#D4A574" rx={3} />
      <rect x={2} y={2} width={cw - 4} height={ch - 4} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
      {(formation.players ?? []).map(p => {
        const [cx, cy] = scale(p.x, p.y)
        return p.id.startsWith('o')
          ? <circle key={p.id} cx={cx} cy={cy} r={4} fill="#E07B2A" stroke="white" strokeWidth={0.8} />
          : <circle key={p.id} cx={cx} cy={cy} r={4} fill="white" stroke="#1E3A5F" strokeWidth={0.8} />
      })}
    </svg>
  )
}

// ===== Detail View =====
function FormationDetail({ formation, onUpdate, onDelete, onBack }: {
  formation: Formation
  onUpdate: (updates: Partial<Formation>) => void
  onDelete: () => void
  onBack: () => void
}) {
  const { t, lang } = useLanguage()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const catLabel = t(`cat.${formation.category}`)
  const courtLabel = formation.courtType === 'half' ? t('fp.detail.half') : t('fp.detail.full')
  const statsText = t('fp.detail.stats')
    .replace('{n}', String(formation.players?.length ?? 0))
    .replace('{m}', String(formation.arrows?.length ?? 0))

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} style={{ color: '#7A6E5F', fontSize: '1.25rem' }}>←</button>
        <div className="flex-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold mr-2"
            style={{ backgroundColor: `${CAT_COLORS[formation.category]}18`, color: CAT_COLORS[formation.category] }}>
            {catLabel}
          </span>
          <span className="text-xs" style={{ color: '#7A6E5F' }}>{courtLabel}</span>
        </div>
      </div>
      <h1 className="text-xl font-bold font-klee" style={{ color: '#1E1A14' }}>{formation.name}</h1>

      <FormationDiagram
        formation={formation}
        onChange={f => onUpdate({ players: f.players, arrows: f.arrows })}
      />

      <div className="nb-card-plain">
        <p className="text-xs mb-1" style={{ color: '#7A6E5F' }}>{statsText}</p>
        <p className="text-xs" style={{ color: '#7A6E5F' }}>
          {t('fp.detail.created')} {new Date(formation.createdAt).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US')}
        </p>
      </div>

      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)}
          className="w-full py-3 rounded-xl text-sm"
          style={{ color: '#DC3545', border: '1px solid rgba(220,53,69,0.3)', backgroundColor: 'rgba(220,53,69,0.04)' }}>
          {t('fp.detail.delete')}
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ flex: 1 }}>
            {t('fp.detail.cancel')}
          </button>
          <button onClick={onDelete}
            className="py-3 rounded-xl text-sm font-bold flex-1"
            style={{ backgroundColor: '#DC3545', color: 'white' }}>
            {t('fp.detail.confirmDelete')}
          </button>
        </div>
      )}
    </div>
  )
}

// ===== Main Page =====
export function FormationsPage({ formations, onAdd, onUpdate, onDelete, teams }: Props) {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const [view, setView]             = useState<'list' | 'detail' | 'preset'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew]       = useState(false)

  // チームタブ: 'personal' | teamId
  const [activeTab, setActiveTab] = useState<'personal' | string>('personal')
  const [teamFormations, setTeamFormations] = useState<Formation[]>([])
  const [teamFormLoading, setTeamFormLoading] = useState(false)

  const myTeams = teams.myTeams
  const activeTeam = myTeams.find(t => t.id === activeTab)

  // チームタブが選択されたらフォーメーションを取得
  useEffect(() => {
    if (activeTab === 'personal' || !activeTab) return
    setTeamFormLoading(true)
    supabase
      .from('formations')
      .select('*')
      .eq('team_id', activeTab)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTeamFormations((data ?? []).map(r => ({
          id:        r.id as string,
          name:      (r.data as Formation).name ?? '',
          courtType: (r.data as Formation).courtType ?? 'half',
          category:  (r.data as Formation).category ?? 'offense',
          players:   (r.data as Formation).players ?? [],
          arrows:    (r.data as Formation).arrows ?? [],
          createdAt: r.created_at as string,
        })))
        setTeamFormLoading(false)
      })
  }, [activeTab])

  const selected       = formations.find(f => f.id === selectedId)
  const selectedPreset = PRESET_FORMATIONS.find(f => f.id === selectedId)

  const handleCreate = (name: string, courtType: CourtType, category: FormationCategory) => {
    const f = onAdd({ name, courtType, category, players: makeDefaultPlayers(courtType), arrows: [] })
    setSelectedId(f.id)
    setView('detail')
    setShowNew(false)
  }

  const handleCopyPreset = (preset: Formation) => {
    const displayName = t(`preset.${presetKey(preset.id)}.name`)
    const f = onAdd({
      name: `${displayName}${t('fp.copySuffix')}`,
      courtType: preset.courtType,
      category: preset.category,
      players: preset.players.map(p => ({ ...p })),
      arrows: preset.arrows.map(a => ({ ...a })),
    })
    setSelectedId(f.id)
    setView('detail')
  }

  if (view === 'detail' && selected) {
    return (
      <FormationDetail
        formation={selected}
        onUpdate={updates => onUpdate(selected.id, updates)}
        onDelete={() => { onDelete(selected.id); setView('list') }}
        onBack={() => setView('list')}
      />
    )
  }

  if (view === 'preset' && selectedPreset) {
    return (
      <PresetDetail
        formation={selectedPreset}
        onCopy={() => handleCopyPreset(selectedPreset)}
        onBack={() => setView('list')}
      />
    )
  }

  const categories = ['offense', 'defense'] as FormationCategory[]

  // チームコーチがチームフォーメーションを追加
  const handleCreateTeamFormation = async (name: string, courtType: CourtType, category: FormationCategory) => {
    if (!user || !activeTeam) return
    const newF: Omit<Formation, 'id' | 'createdAt'> = { name, courtType, category, players: makeDefaultPlayers(courtType), arrows: [] }
    const { data } = await supabase
      .from('formations')
      .insert({ user_id: user.id, team_id: activeTeam.id, data: newF })
      .select()
      .single()
    if (data) {
      const added: Formation = { ...(data.data as Formation), id: data.id as string, createdAt: data.created_at as string }
      setTeamFormations(prev => [added, ...prev])
    }
    setShowNew(false)
  }

  const handleDeleteTeamFormation = async (formId: string) => {
    await supabase.from('formations').delete().eq('id', formId)
    setTeamFormations(prev => prev.filter(f => f.id !== formId))
    setView('list')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-klee" style={{ color: '#1E1A14' }}>{t('fp.title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#7A6E5F' }}>
            {t('fp.count').replace('{n}', String(activeTab === 'personal' ? formations.length : teamFormations.length))}
          </p>
        </div>
        {/* コーチはチームフォーメーションを追加可、選手は不可 */}
        {(activeTab === 'personal' || (activeTeam && activeTeam.myRole === 'coach')) && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#1E3A5F', color: 'white' }}>
            <Plus size={14} /> {t('fp.newButton')}
          </button>
        )}
      </div>

      {/* 個人/チームタブ（チームがある場合） */}
      {myTeams.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          <button
            onClick={() => { setActiveTab('personal'); setView('list') }}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap',
              background: activeTab === 'personal' ? '#1E3A5F' : 'rgba(195,175,148,0.25)',
              color: activeTab === 'personal' ? 'white' : '#7A6E5F',
            }}
          >
            {lang === 'ja' ? '個人' : 'Personal'}
          </button>
          {myTeams.map(tm => (
            <button
              key={tm.id}
              onClick={() => { setActiveTab(tm.id); setView('list') }}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap',
                background: activeTab === tm.id ? '#1E3A5F' : 'rgba(195,175,148,0.25)',
                color: activeTab === tm.id ? 'white' : '#7A6E5F',
              }}
            >
              {tm.myRole === 'coach' ? '👑' : '🏀'} {tm.name}
            </button>
          ))}
        </div>
      )}

      {/* チームタブ選択中 */}
      {activeTab !== 'personal' && (
        <>
          {teamFormLoading ? (
            <p style={{ textAlign: 'center', color: '#A89F92', fontSize: '0.85rem', padding: '20px 0' }}>…</p>
          ) : teamFormations.length === 0 ? (
            <div className="nb-card text-center py-8">
              <p className="text-3xl mb-3">🏀</p>
              <p className="text-sm" style={{ color: '#7A6E5F' }}>{t('fp.noFormations')}</p>
              {activeTeam?.myRole === 'coach' && (
                <p className="text-sm font-semibold mt-1 cursor-pointer" style={{ color: '#E07B2A' }}
                  onClick={() => setShowNew(true)}>
                  {t('fp.createFirst')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {teamFormations.map(f => (
                <div key={f.id} className="nb-card-plain mb-2 cursor-pointer"
                  onClick={() => { setSelectedId(f.id); setView('detail') }}>
                  <div className="flex items-center gap-3">
                    <MiniCourtPreview formation={f} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: '#1E1A14' }}>{f.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#7A6E5F' }}>
                        {f.courtType === 'half' ? t('fp.detail.half') : t('fp.detail.full')}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: '#C8BFB2', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* チームフォーメーション詳細 */}
          {view === 'detail' && (() => {
            const tf = teamFormations.find(f => f.id === selectedId)
            if (!tf) return null
            const isCoach = activeTeam?.myRole === 'coach'
            return (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 60, background: '#FDFAF5',
                overflowY: 'auto', padding: '20px 16px 40px',
              }}>
                <button onClick={() => setView('list')} style={{ color: '#7A6E5F', fontSize: '1.25rem', marginBottom: 16 }}>←</button>
                <h1 className="text-xl font-bold font-klee mb-4" style={{ color: '#1E1A14' }}>{tf.name}</h1>
                <FormationDiagram
                  formation={tf}
                  readonly={!isCoach}
                  onChange={isCoach ? updates => {
                    supabase.from('formations').update({ data: { ...tf, ...updates } }).eq('id', tf.id)
                    setTeamFormations(prev => prev.map(f => f.id === tf.id ? { ...f, ...updates } : f))
                  } : () => {}}
                />
                {isCoach && (
                  <button
                    onClick={() => handleDeleteTeamFormation(tf.id)}
                    className="w-full mt-6 py-3 rounded-xl text-sm"
                    style={{ color: '#DC3545', border: '1px solid rgba(220,53,69,0.3)', backgroundColor: 'rgba(220,53,69,0.04)' }}>
                    {t('fp.detail.delete')}
                  </button>
                )}
              </div>
            )
          })()}

          {showNew && activeTeam?.myRole === 'coach' && (
            <NewFormationDialog
              onClose={() => setShowNew(false)}
              onSubmit={handleCreateTeamFormation}
            />
          )}
        </>
      )}

      {/* 個人タブ選択中 */}
      {activeTab === 'personal' && (
        <>
      {/* ユーザー作成フォーメーション */}
      {formations.length === 0 ? (
        <div className="nb-card text-center py-8" style={{}}
          onClick={() => setShowNew(true)}>
          <p className="text-3xl mb-3">🏀</p>
          <p className="text-sm" style={{ color: '#7A6E5F' }}>{t('fp.noFormations')}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#E07B2A' }}>{t('fp.createFirst')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => {
            const items = formations.filter(f => f.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <p className="text-xs font-bold px-1 mb-1.5 mt-3" style={{ color: CAT_COLORS[cat] }}>
                  {t(`cat.${cat}`)}
                </p>
                {items.map(f => (
                  <div key={f.id} className="nb-card-plain mb-2"
                    onClick={() => { setSelectedId(f.id); setView('detail') }}
                    style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-3">
                      <MiniCourtPreview formation={f} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#1E1A14' }}>{f.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: '#7A6E5F' }}>
                            {f.courtType === 'half' ? t('fp.detail.half') : t('fp.detail.full')}
                          </span>
                          <span className="text-xs" style={{ color: '#7A6E5F' }}>·</span>
                          <span className="text-xs" style={{ color: '#7A6E5F' }}>
                            {(f.players ?? []).length}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#C8BFB2', flexShrink: 0 }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* 定番フォーメーション（プリセット） */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={13} style={{ color: '#7A6E5F' }} />
          <p className="text-xs font-bold" style={{ color: '#7A6E5F' }}>{t('fp.preset.section')}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(195,175,148,0.15)', color: '#A89F92' }}>
            {t('fp.preset.hint')}
          </span>
        </div>
        {categories.map(cat => {
          const presets = PRESET_FORMATIONS.filter(f => f.category === cat)
          return (
            <div key={cat} className="mb-2">
              <p className="text-xs font-bold px-1 mb-1.5 mt-2" style={{ color: CAT_COLORS[cat] }}>
                {t(`cat.${cat}`)}
              </p>
              {presets.map(f => {
                const pKey = presetKey(f.id)
                return (
                  <div key={f.id}
                    onClick={() => { setSelectedId(f.id); setView('preset') }}
                    className="nb-card-plain mb-2"
                    style={{ cursor: 'pointer', opacity: 0.85 }}>
                    <div className="flex items-center gap-3">
                      <MiniCourtPreview formation={f} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#1E1A14' }}>{t(`preset.${pKey}.name`)}</p>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#7A6E5F' }}>
                          {t(`preset.${pKey}.desc`)}
                        </p>
                      </div>
                      <ChevronRight size={16} style={{ color: '#C8BFB2', flexShrink: 0 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {showNew && activeTab === 'personal' && (
        <NewFormationDialog
          onClose={() => setShowNew(false)}
          onSubmit={handleCreate}
        />
      )}
        </>
      )}
    </div>
  )
}
