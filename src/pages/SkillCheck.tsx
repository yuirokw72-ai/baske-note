import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell,
} from 'recharts'
import { ChevronDown, ChevronUp, TrendingUp, ClipboardList } from 'lucide-react'
import type { SkillRecord, SkillCategory } from '../types'
import { useLanguage } from '../contexts/LanguageContext'

interface Props {
  skillRecords: SkillRecord[]
  onUpdate: (id: string, level: number) => void
}

type SkillDef = {
  id: string
  category: SkillCategory
}

const CAT_STYLE: Record<SkillCategory, { color: string; bg: string }> = {
  offense:  { color: '#E07B2A', bg: 'rgba(224,123,42,0.09)'  },
  defense:  { color: '#1E3A5F', bg: 'rgba(30,58,95,0.07)'   },
  physical: { color: '#DC3545', bg: 'rgba(220,53,69,0.07)'  },
  iq:       { color: '#7B2FA0', bg: 'rgba(123,47,160,0.07)' },
}

const SKILLS: SkillDef[] = [
  { id: 'sk_drive',        category: 'offense'  },
  { id: 'sk_mid',          category: 'offense'  },
  { id: 'sk_three',        category: 'offense'  },
  { id: 'sk_ft',           category: 'offense'  },
  { id: 'sk_layup_strong', category: 'offense'  },
  { id: 'sk_layup_weak',   category: 'offense'  },
  { id: 'sk_pass',         category: 'offense'  },
  { id: 'sk_offball',      category: 'offense'  },
  { id: 'sk_1on1d',        category: 'defense'  },
  { id: 'sk_helpd',        category: 'defense'  },
  { id: 'sk_boxout',       category: 'defense'  },
  { id: 'sk_reb',          category: 'defense'  },
  { id: 'sk_footwork',     category: 'physical' },
  { id: 'sk_speed',        category: 'physical' },
  { id: 'sk_stamina',      category: 'physical' },
  { id: 'sk_strength',     category: 'physical' },
  { id: 'sk_jump',         category: 'physical' },
  { id: 'sk_decision',     category: 'iq'       },
  { id: 'sk_vision',       category: 'iq'       },
  { id: 'sk_comm',         category: 'iq'       },
  { id: 'sk_clutch',       category: 'iq'       },
  { id: 'sk_mental',       category: 'iq'       },
]

// ===== ヘルパー =====
function levelColor(level: number): { bg: string; text: string } {
  if (level === 0) return { bg: 'rgba(195,175,148,0.2)', text: '#A89F92' }
  if (level <= 2)  return { bg: 'rgba(224,123,42,0.12)', text: '#E07B2A' }
  if (level <= 4)  return { bg: 'rgba(224,123,42,0.28)', text: '#C4520D' }
  return              { bg: 'rgba(180,130,0,0.18)',   text: '#9B6700' }
}

function getLevel(records: SkillRecord[], id: string): number {
  return records.find(r => r.id === id)?.level ?? 0
}

function catAvg(records: SkillRecord[], cat: SkillCategory): number {
  const skills = SKILLS.filter(s => s.category === cat)
  if (!skills.length) return 0
  const total = skills.reduce((sum, s) => sum + getLevel(records, s.id), 0)
  return Math.round((total / skills.length) * 10) / 10
}

// ===== スキルアイテム =====
function SkillItem({ skill, level, onUpdate }: {
  skill: SkillDef; level: number; onUpdate: (n: number) => void
}) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const lc = levelColor(level)

  return (
    <div style={{ borderBottom: '1px solid rgba(195,175,148,0.25)', paddingBottom: 10, marginBottom: 10 }}>
      <div className="flex items-center gap-2" onClick={() => setExpanded(v => !v)}
        style={{ cursor: 'pointer' }}>
        <span className="text-sm flex-1" style={{ color: '#1E1A14' }}>{t(`skill.${skill.id}.name`)}</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ backgroundColor: lc.bg, color: lc.text, minWidth: 54, textAlign: 'center' }}>
          {level === 0 ? t('skill.unrated') : `Lv.${level}`}
        </span>
        {expanded
          ? <ChevronUp size={14} style={{ color: '#A89F92', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: '#A89F92', flexShrink: 0 }} />}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* レベルボタン */}
          <div className="flex gap-1.5">
            <button onClick={() => onUpdate(0)}
              className="px-2 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: level === 0 ? 'rgba(195,175,148,0.35)' : 'rgba(195,175,148,0.1)',
                color: level === 0 ? '#7A6E5F' : '#C8BFB2',
                border: level === 0 ? '1.5px solid rgba(195,175,148,0.7)' : '1.5px solid transparent',
              }}>
              {t('skill.unrated')}
            </button>
            {[1, 2, 3, 4, 5].map(n => {
              const lc2 = levelColor(n)
              return (
                <button key={n} onClick={() => onUpdate(n)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    backgroundColor: level === n ? lc2.bg : 'rgba(195,175,148,0.08)',
                    color: level === n ? lc2.text : '#C8BFB2',
                    border: level === n ? `1.5px solid ${lc2.text}` : '1.5px solid transparent',
                  }}>
                  {n}
                </button>
              )
            })}
          </div>

          {/* 基準一覧 */}
          <div className="space-y-1.5 pl-1">
            {[1,2,3,4,5].map(i => {
              const active = level === i
              return (
                <div key={i} onClick={() => onUpdate(i)}
                  className="flex gap-2 px-2 py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: active ? levelColor(i).bg : 'transparent', cursor: 'pointer' }}>
                  <span className="text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ color: levelColor(i).text, minWidth: 28 }}>
                    Lv.{i}
                  </span>
                  <span className="text-xs leading-relaxed"
                    style={{ color: active ? '#1E1A14' : '#7A6E5F' }}>
                    {t(`skill.${skill.id}.c${i}`)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== カテゴリーセクション =====
function CategorySection({ cat, records, onUpdate }: {
  cat: SkillCategory; records: SkillRecord[]
  onUpdate: (id: string, level: number) => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)
  const info = CAT_STYLE[cat]
  const catLabel = t(`skill.cat.${cat}`)
  const skills = SKILLS.filter(s => s.category === cat)
  const avg = catAvg(records, cat)
  const rated = skills.filter(s => getLevel(records, s.id) > 0).length

  return (
    <div className="nb-card-plain mb-3">
      <button className="w-full flex items-center gap-2" onClick={() => setOpen(v => !v)}>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: info.bg, color: info.color }}>
          {catLabel}
        </span>
        <span className="text-xs flex-1 text-left" style={{ color: '#A89F92' }}>
          {rated}/{skills.length} · {t('skill.avg')} {avg === 0 ? '-' : avg}
        </span>
        <div style={{ width: 44, height: 5, backgroundColor: 'rgba(195,175,148,0.3)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ width: `${(avg / 5) * 100}%`, height: '100%', backgroundColor: info.color, borderRadius: 3 }} />
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#A89F92', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: '#A89F92', flexShrink: 0 }} />}
      </button>

      {open && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(195,175,148,0.3)' }}>
          {skills.map(s => (
            <SkillItem key={s.id} skill={s} level={getLevel(records, s.id)}
              onUpdate={level => onUpdate(s.id, level)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ===== グラフタブ =====
function GraphTab({ records }: { records: SkillRecord[] }) {
  const { t } = useLanguage()
  const categories: SkillCategory[] = ['offense', 'defense', 'physical', 'iq']
  const radarData = categories.map(cat => ({
    subject: t(`skill.cat.${cat}`),
    value: catAvg(records, cat),
    fullMark: 5,
  }))

  const totalRated = records.filter(r => r.level > 0).length
  const totalAvg = SKILLS.length > 0
    ? Math.round((records.reduce((s, r) => s + r.level, 0) / SKILLS.length) * 10) / 10
    : 0

  return (
    <div className="space-y-4">
      {/* 総合カード */}
      <div className="nb-card-plain flex justify-between items-center">
        <div>
          <p className="text-xs font-bold" style={{ color: '#1E3A5F' }}>{t('skill.total')}</p>
          <p className="text-xs mt-0.5" style={{ color: '#A89F92' }}>{t('skill.ratedCount').replace('{n}', String(totalRated))}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold" style={{ color: '#E07B2A' }}>{totalAvg}</span>
          <span className="text-sm ml-1" style={{ color: '#A89F92' }}>/ 5.0</span>
        </div>
      </div>

      {/* レーダーチャート */}
      <div className="nb-card">
        <p className="text-xs font-bold mb-1" style={{ color: '#1E3A5F' }}>{t('skill.radar')}</p>
        {totalRated > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
              <PolarGrid stroke="rgba(195,175,148,0.5)" />
              <PolarAngleAxis dataKey="subject"
                tick={{ fontSize: 11, fill: '#7A6E5F', fontFamily: 'inherit' }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#E07B2A" fill="#E07B2A"
                fillOpacity={0.22} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: '#A89F92' }}>{t('skill.noGraph')}</p>
          </div>
        )}
      </div>

      {/* カテゴリー別バー */}
      {categories.map(cat => {
        const info = CAT_STYLE[cat]
        const catLabel = t(`skill.cat.${cat}`)
        const skills = SKILLS.filter(s => s.category === cat)
        const barData = skills.map(s => ({ name: t(`skill.${s.id}.name`), level: getLevel(records, s.id) }))
        return (
          <div key={cat} className="nb-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: info.bg, color: info.color }}>
                {catLabel}
              </span>
              <span className="text-xs" style={{ color: '#A89F92' }}>
                {t('skill.avg')} {catAvg(records, cat) === 0 ? '-' : catAvg(records, cat)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={skills.length * 30 + 16}>
              <BarChart data={barData} layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 9, fill: '#A89F92' }} tickCount={6} />
                <YAxis type="category" dataKey="name" width={108}
                  tick={{ fontSize: 10, fill: '#7A6E5F', fontFamily: 'inherit' }} />
                <Bar dataKey="level" radius={[0, 3, 3, 0]} barSize={12}>
                  {barData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.level === 0 ? 'rgba(195,175,148,0.25)' : info.color}
                      opacity={entry.level === 0 ? 1 : 0.25 + (entry.level / 5) * 0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}

// ===== メインページ =====
export function SkillCheck({ skillRecords, onUpdate }: Props) {
  const { t } = useLanguage()
  const [tab, setTab] = useState<'check' | 'graph'>('check')
  const totalRated = skillRecords.filter(r => r.level > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('skill.title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#A89F92' }}>
            {t('skill.ratedCount').replace('{n}', String(totalRated))}
          </p>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-1 p-1 rounded-xl mb-4"
        style={{ backgroundColor: 'rgba(195,175,148,0.2)' }}>
        {([
          { key: 'check', labelKey: 'skill.tabCheck', Icon: ClipboardList },
          { key: 'graph', labelKey: 'skill.tabGraph', Icon: TrendingUp },
        ] as const).map(({ key, labelKey, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === key
              ? { backgroundColor: 'white', color: '#1E3A5F', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: '#A89F92' }}>
            <Icon size={14} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === 'check' && (
        <div className="page-enter">
          {/* 凡例 */}
          <div className="nb-card-plain mb-3">
            <p className="text-xs font-bold mb-2" style={{ color: '#1E3A5F' }}>{t('skill.levelGuide')}</p>
            <div className="flex flex-wrap gap-1.5">
              {[0,1,2,3,4,5].map(i => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: levelColor(i).bg, color: levelColor(i).text }}>
                  {i === 0 ? t('skill.unrated') : `Lv.${i}`} {t(`skill.level.${i}`)}
                </span>
              ))}
            </div>
          </div>

          {(['offense', 'defense', 'physical', 'iq'] as SkillCategory[]).map(cat => (
            <CategorySection key={cat} cat={cat} records={skillRecords}
              onUpdate={onUpdate} />
          ))}
        </div>
      )}

      {tab === 'graph' && (
        <div className="page-enter">
          <GraphTab records={skillRecords} />
        </div>
      )}
    </div>
  )
}
