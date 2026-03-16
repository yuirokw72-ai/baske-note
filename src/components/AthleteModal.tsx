import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useCoachStore } from '../hooks/useCoachStore'
import type { CoachFeedback, PracticeLog, GameRecord } from '../types'

interface Props {
  athleteUserId: string
  athleteName: string
  onClose: () => void
}

function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ===== MyMemory 翻訳 API (無料・APIキー不要) =====
async function translateOne(text: string, to: string): Promise<string> {
  if (!text.trim()) return text
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${to}`
    )
    const json = await res.json()
    return (json.responseData?.translatedText as string) ?? text
  } catch {
    return text
  }
}

async function translateBatch(fields: Record<string, string>, to: string): Promise<Record<string, string>> {
  const entries = Object.entries(fields).filter(([, v]) => v.trim())
  const results = await Promise.all(entries.map(([k, v]) => translateOne(v, to).then(t => [k, t] as [string, string])))
  return Object.fromEntries(results)
}

// ===== FBフォーム =====
interface FBFormProps {
  initial?: CoachFeedback
  recordType: 'practice' | 'game'
  onSave: (fb: CoachFeedback) => Promise<void>
  onCancel: () => void
  lang: string
}

function FBForm({ initial, recordType, onSave, onCancel, lang }: FBFormProps) {
  const [goodPoints,      setGoodPoints]      = useState(initial?.goodPoints ?? '')
  const [improvements,    setImprovements]    = useState(initial?.improvements ?? '')
  const [nextInstruction, setNextInstruction] = useState(initial?.nextInstruction ?? '')
  const [coachName,       setCoachName]       = useState(initial?.coachName ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    await onSave({
      goodPoints, improvements, nextInstruction, coachName,
      date: new Date().toISOString().slice(0, 10),
    })
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { label: lang === 'ja' ? '良かった点' : 'Good Points',       value: goodPoints,      setter: setGoodPoints,      ph: lang === 'ja' ? 'よく頑張っていたところ' : 'What they did well' },
        { label: lang === 'ja' ? '改善ポイント' : 'Improvements',     value: improvements,    setter: setImprovements,    ph: lang === 'ja' ? '次はここを修正してほしい' : 'What to improve' },
        { label: lang === 'ja' ? '次回への指示' : 'Next Instruction', value: nextInstruction, setter: setNextInstruction, ph: lang === 'ja' ? (recordType === 'practice' ? '次の練習で意識すること' : '次の試合で意識すること') : (recordType === 'practice' ? 'Focus for next practice' : 'Focus for next game') },
      ].map(f => (
        <div key={f.label}>
          <p style={{ fontSize: '0.72rem', color: '#A89F92', marginBottom: 3 }}>{f.label}</p>
          <textarea
            value={f.value}
            onChange={e => f.setter(e.target.value)}
            placeholder={f.ph}
            rows={2}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid rgba(195,175,148,0.4)',
              background: 'rgba(195,175,148,0.08)', color: '#1E1A14',
              fontSize: '0.82rem', resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
      <div>
        <p style={{ fontSize: '0.72rem', color: '#A89F92', marginBottom: 3 }}>
          {lang === 'ja' ? 'コーチ名' : 'Coach Name'}
        </p>
        <input
          value={coachName}
          onChange={e => setCoachName(e.target.value)}
          placeholder={lang === 'ja' ? '山田コーチ' : 'Coach Smith'}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            border: '1px solid rgba(195,175,148,0.4)',
            background: 'rgba(195,175,148,0.08)', color: '#1E1A14',
            fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            flex: 1, padding: '9px', borderRadius: 10, border: 'none',
            background: '#1E3A5F', color: 'white', fontWeight: 700,
            fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          {saving ? '…' : (lang === 'ja' ? '保存する' : 'Save')}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 14px', borderRadius: 10,
            border: '1px solid rgba(195,175,148,0.4)',
            background: 'transparent', color: '#7A6E5F', fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          {lang === 'ja' ? 'キャンセル' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}

// ===== 練習ノートの詳細表示 =====
type Translated = Record<string, string>

function PracticeDetail({ pl, lang, tr }: { pl: PracticeLog; lang: string; tr?: Translated }) {
  const get = (key: string, val: string | undefined) => tr?.[key] ?? val ?? ''
  const achieveColor = pl.goalAchievement === 'achieved' ? '#2E7D52' : pl.goalAchievement === 'partial' ? '#E07B2A' : '#DC3545'
  const achieveLabel = pl.goalAchievement === 'achieved'
    ? (lang === 'ja' ? '○ 達成' : '○ Achieved')
    : pl.goalAchievement === 'partial'
    ? (lang === 'ja' ? '△ 一部達成' : '△ Partial')
    : (lang === 'ja' ? '× 未達成' : '× Not achieved')

  const rows: { label: string; value: string; color?: string }[] = [
    { label: lang === 'ja' ? '目標' : 'Goal',                    value: get('todayGoal', pl.todayGoal) },
    { label: lang === 'ja' ? '達成度' : 'Achievement',           value: achieveLabel, color: achieveColor },
    ...(pl.achievementReason ? [{ label: lang === 'ja' ? '達成理由' : 'Reason',     value: get('achievementReason', pl.achievementReason) }] : []),
    ...(pl.menus?.length    ? [{ label: lang === 'ja' ? '練習メニュー' : 'Menus',   value: get('menus', pl.menus.join(' / ')) }] : []),
    ...(pl.didWell          ? [{ label: lang === 'ja' ? 'できたこと' : 'Did Well',  value: get('didWell', pl.didWell),       color: '#2E7D52' }] : []),
    ...(pl.struggled        ? [{ label: lang === 'ja' ? 'できなかったこと' : 'Struggled', value: get('struggled', pl.struggled), color: '#DC3545' }] : []),
    ...(pl.todayLearning    ? [{ label: lang === 'ja' ? '本日の学び' : "Today's Learning", value: get('todayLearning', pl.todayLearning) }] : []),
    ...(pl.nextChallenge    ? [{ label: lang === 'ja' ? '次の課題' : 'Next Challenge',     value: get('nextChallenge', pl.nextChallenge), color: '#1E3A5F' }] : []),
    { label: lang === 'ja' ? '自己評価' : 'Self Rating',   value: `${'★'.repeat(pl.selfRating)}${'☆'.repeat(5 - pl.selfRating)} (${pl.selfRating}/5)` },
    { label: lang === 'ja' ? 'コンディション' : 'Condition', value: `${pl.condition}/5` },
    { label: lang === 'ja' ? 'モチベ' : 'Motivation',      value: `${pl.motivation}/5` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(r => r.value ? (
        <div key={r.label}>
          <p style={{ fontSize: '0.68rem', color: '#A89F92', marginBottom: 1 }}>{r.label}</p>
          <p style={{ fontSize: '0.82rem', color: r.color ?? '#1E1A14', lineHeight: 1.5 }}>{r.value}</p>
        </div>
      ) : null)}
    </div>
  )
}

// ===== 試合記録の詳細表示 =====
function GameDetail({ gr, lang, tr }: { gr: GameRecord; lang: string; tr?: Translated }) {
  const get = (key: string, val: string | undefined) => tr?.[key] ?? val ?? ''
  const fgPct = gr.fgAttempts > 0 ? Math.round((gr.fgMade / gr.fgAttempts) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* スタッツ */}
      <div>
        <p style={{ fontSize: '0.68rem', color: '#A89F92', marginBottom: 4 }}>
          {lang === 'ja' ? 'スタッツ' : 'Stats'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {[
            { label: lang === 'ja' ? '得点' : 'PTS', value: gr.points },
            { label: 'RB',  value: gr.rebounds },
            { label: 'AS',  value: gr.assists },
            { label: 'ST',  value: gr.steals },
            { label: 'TO',  value: gr.turnovers },
            { label: 'BL',  value: gr.blocks },
            { label: 'FG',  value: gr.fgAttempts > 0 ? `${gr.fgMade}/${gr.fgAttempts}(${fgPct}%)` : '-' },
            { label: lang === 'ja' ? '出場' : 'MIN', value: gr.minutesPlayed > 0 ? `${gr.minutesPlayed}min` : '-' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(195,175,148,0.15)',
              borderRadius: 6, padding: '4px 6px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E1A14' }}>{s.value}</p>
              <p style={{ fontSize: '0.62rem', color: '#A89F92' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 振り返り */}
      {[
        { label: lang === 'ja' ? 'できたプレー' : 'Good Plays',          key: 'goodPlays',       value: gr.goodPlays,       color: '#2E7D52' },
        { label: lang === 'ja' ? '改善したいプレー' : 'Bad Plays',       key: 'badPlays',        value: gr.badPlays,        color: '#DC3545' },
        { label: lang === 'ja' ? 'チーム分析' : 'Team Analysis',         key: 'teamAnalysis',    value: gr.teamAnalysis },
        { label: lang === 'ja' ? '次試合への課題' : 'Next Game Focus',   key: 'nextGameFocus',   value: gr.nextGameFocus,   color: '#1E3A5F' },
        { label: lang === 'ja' ? 'メンタル振り返り' : 'Mental',         key: 'mentalReflection', value: gr.mentalReflection },
        { label: lang === 'ja' ? '自己評価' : 'Self Rating',             key: '_rating',          value: `${'★'.repeat(gr.selfRating)}${'☆'.repeat(5 - gr.selfRating)} (${gr.selfRating}/5)` },
      ].map(r => {
        const display = r.key === '_rating' ? r.value : get(r.key, r.value)
        return display ? (
          <div key={r.label}>
            <p style={{ fontSize: '0.68rem', color: '#A89F92', marginBottom: 1 }}>{r.label}</p>
            <p style={{ fontSize: '0.82rem', color: r.color ?? '#1E1A14', lineHeight: 1.5 }}>{display}</p>
          </div>
        ) : null
      })}
    </div>
  )
}

// ===== メインコンポーネント =====
type RecordTab = 'practice' | 'game'

export function AthleteModal({ athleteUserId, athleteName, onClose }: Props) {
  const { lang } = useLanguage()
  const { practiceLogs, gameRecords, loading, fetchAthleteRecords, updateCoachFeedback } = useCoachStore()
  const [tab,       setTab]       = useState<RecordTab>('practice')
  const [editId,    setEditId]    = useState<string | null>(null)
  const [expandId,  setExpandId]  = useState<string | null>(null)

  // 翻訳キャッシュ: recordId → { fieldKey: translatedText }
  const [translations, setTranslations] = useState<Record<string, Translated>>({})
  // 翻訳中のrecordId
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  // 翻訳表示中か（原文表示 toggle）: recordId → boolean
  const [showTranslated, setShowTranslated] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchAthleteRecords(athleteUserId)
  }, [athleteUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  const records: (PracticeLog | GameRecord)[] = tab === 'practice' ? practiceLogs : gameRecords

  const handleSaveFB = async (recordId: string, fb: CoachFeedback) => {
    await updateCoachFeedback(
      tab === 'practice' ? 'practice_logs' : 'game_records',
      recordId,
      athleteUserId,
      fb,
    )
    setEditId(null)
  }

  // 翻訳実行
  const handleTranslate = useCallback(async (rec: PracticeLog | GameRecord) => {
    const id = rec.id
    const targetLang = lang // コーチの言語に翻訳

    // 既にキャッシュある場合はトグルするだけ
    if (translations[id]) {
      setShowTranslated(prev => ({ ...prev, [id]: !prev[id] }))
      return
    }

    setTranslating(prev => ({ ...prev, [id]: true }))

    let fields: Record<string, string> = {}

    if (tab === 'practice') {
      const pl = rec as PracticeLog
      if (pl.todayGoal)        fields.todayGoal        = pl.todayGoal
      if (pl.achievementReason) fields.achievementReason = pl.achievementReason
      if (pl.menus?.length)    fields.menus            = pl.menus.join(' / ')
      if (pl.didWell)          fields.didWell          = pl.didWell
      if (pl.struggled)        fields.struggled        = pl.struggled
      if (pl.todayLearning)    fields.todayLearning    = pl.todayLearning
      if (pl.nextChallenge)    fields.nextChallenge    = pl.nextChallenge
    } else {
      const gr = rec as GameRecord
      if (gr.goodPlays)        fields.goodPlays        = gr.goodPlays
      if (gr.badPlays)         fields.badPlays         = gr.badPlays
      if (gr.teamAnalysis)     fields.teamAnalysis     = gr.teamAnalysis
      if (gr.nextGameFocus)    fields.nextGameFocus    = gr.nextGameFocus
      if (gr.mentalReflection) fields.mentalReflection = gr.mentalReflection
    }

    const translated = await translateBatch(fields, targetLang)
    setTranslations(prev => ({ ...prev, [id]: translated }))
    setShowTranslated(prev => ({ ...prev, [id]: true }))
    setTranslating(prev => ({ ...prev, [id]: false }))
  }, [lang, tab, translations])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#FDFAF5',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#A89F92' }}>
              {lang === 'ja' ? '担当選手' : 'Athlete'}
            </p>
            <h2 style={{ color: '#1E3A5F', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{athleteName}</h2>
          </div>
          <button onClick={onClose} style={{ color: '#A89F92', fontSize: '1.3rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['practice', 'game'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setEditId(null); setExpandId(null) }} style={{
              flex: 1, padding: '7px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem',
              background: tab === t ? '#1E3A5F' : 'rgba(195,175,148,0.2)',
              color: tab === t ? 'white' : '#7A6E5F',
            }}>
              {t === 'practice'
                ? (lang === 'ja' ? '練習ノート' : 'Practice')
                : (lang === 'ja' ? '試合記録' : 'Games')}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#A89F92', fontSize: '0.85rem', padding: '20px 0' }}>…</p>
        ) : records.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#A89F92', fontSize: '0.85rem', padding: '20px 0' }}>
            {lang === 'ja' ? 'まだ記録がありません' : 'No records yet'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {records.map(rec => {
              const isPractice = tab === 'practice'
              const pl = rec as PracticeLog
              const gr = rec as GameRecord
              const fb = rec.coachFeedback
              const isEditing   = editId   === rec.id
              const isExpanded  = expandId === rec.id
              const isTranslating = !!translating[rec.id]
              const translated    = showTranslated[rec.id] ? translations[rec.id] : undefined
              const hasTranslation = !!translations[rec.id]

              return (
                <div key={rec.id} style={{
                  background: 'rgba(195,175,148,0.12)',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  {/* レコードヘッダー */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.75rem', color: '#A89F92', marginBottom: 2 }}>
                        {fmtDate(rec.date ?? rec.createdAt ?? '')}
                        {isPractice && ` · ${pl.duration}${lang === 'ja' ? '分' : 'min'}`}
                        {!isPractice && ` vs ${gr.opponent}`}
                        {isPractice && pl.practiceType && (
                          <span style={{
                            marginLeft: 6, fontSize: '0.68rem', fontWeight: 700,
                            color: pl.practiceType === 'team' ? '#1E3A5F' : '#E07B2A',
                          }}>
                            [{lang === 'ja' ? (pl.practiceType === 'team' ? 'チーム' : '個人') : pl.practiceType}]
                          </span>
                        )}
                      </p>
                      {isPractice && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1E1A14', margin: 0 }}>
                            {translated?.todayGoal ?? pl.todayGoal}
                          </p>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 700,
                            color: pl.goalAchievement === 'achieved' ? '#2E7D52' : pl.goalAchievement === 'partial' ? '#E07B2A' : '#DC3545',
                          }}>
                            {pl.goalAchievement === 'achieved' ? '○' : pl.goalAchievement === 'partial' ? '△' : '×'}
                          </span>
                        </div>
                      )}
                      {!isPractice && (
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1E1A14', margin: 0 }}>
                          {(gr.result === 'win' ? '🏆' : gr.result === 'lose' ? '💔' : '🤝')} {gr.myScore}–{gr.opponentScore}
                          <span style={{
                            marginLeft: 8, fontSize: '0.7rem', fontWeight: 700,
                            color: gr.result === 'win' ? '#2E7D52' : gr.result === 'lose' ? '#DC3545' : '#7A6E5F',
                          }}>
                            {gr.result === 'win' ? (lang === 'ja' ? '勝' : 'W') : gr.result === 'lose' ? (lang === 'ja' ? '負' : 'L') : (lang === 'ja' ? '引' : 'D')}
                          </span>
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      {!isEditing && (
                        <button
                          onClick={() => setExpandId(isExpanded ? null : rec.id)}
                          style={{
                            padding: '4px 8px', borderRadius: 8, border: 'none',
                            background: isExpanded ? 'rgba(195,175,148,0.4)' : 'rgba(195,175,148,0.2)',
                            color: '#7A6E5F',
                            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? (lang === 'ja' ? '閉じる' : 'Close') : (lang === 'ja' ? '詳細' : 'Detail')}
                        </button>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => { setEditId(rec.id); setExpandId(null) }}
                          style={{
                            padding: '4px 10px', borderRadius: 8, border: 'none',
                            background: fb ? 'rgba(30,58,95,0.08)' : '#E07B2A',
                            color: fb ? '#1E3A5F' : 'white',
                            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {fb
                            ? (lang === 'ja' ? 'FB編集' : 'Edit FB')
                            : (lang === 'ja' ? 'FB追加 +' : 'Add FB +')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 詳細展開 */}
                  {isExpanded && !isEditing && (
                    <div style={{
                      borderTop: '1px solid rgba(195,175,148,0.35)',
                      paddingTop: 10, marginTop: 4,
                    }}>
                      {/* 翻訳ボタン */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <button
                          onClick={() => handleTranslate(rec)}
                          disabled={isTranslating}
                          style={{
                            padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: hasTranslation && showTranslated[rec.id]
                              ? 'rgba(30,58,95,0.15)'
                              : 'rgba(30,58,95,0.08)',
                            color: '#1E3A5F',
                            fontSize: '0.72rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          {isTranslating
                            ? (lang === 'ja' ? '翻訳中…' : 'Translating…')
                            : hasTranslation && showTranslated[rec.id]
                              ? (lang === 'ja' ? '🌐 翻訳表示中' : '🌐 Translated')
                              : (lang === 'ja' ? '🌐 翻訳して表示' : '🌐 Translate')}
                        </button>
                        {hasTranslation && showTranslated[rec.id] && (
                          <button
                            onClick={() => setShowTranslated(prev => ({ ...prev, [rec.id]: false }))}
                            style={{
                              padding: '4px 10px', borderRadius: 8,
                              border: '1px solid rgba(195,175,148,0.4)',
                              background: 'transparent', color: '#A89F92',
                              fontSize: '0.68rem', cursor: 'pointer',
                            }}
                          >
                            {lang === 'ja' ? '原文に戻す' : 'Show Original'}
                          </button>
                        )}
                        {/* 翻訳中ステータス表示 */}
                        {isTranslating && (
                          <p style={{ fontSize: '0.68rem', color: '#A89F92', alignSelf: 'center' }}>
                            {lang === 'ja' ? 'MyMemory API で翻訳中…' : 'Translating via MyMemory…'}
                          </p>
                        )}
                      </div>

                      {isPractice
                        ? <PracticeDetail pl={pl} lang={lang} tr={translated} />
                        : <GameDetail gr={gr} lang={lang} tr={translated} />
                      }
                    </div>
                  )}

                  {/* 既存FB表示（詳細閉じ時） */}
                  {fb && !isEditing && !isExpanded && (
                    <div style={{
                      background: 'rgba(30,58,95,0.05)',
                      borderRadius: 8, padding: '8px 10px',
                      borderLeft: '2px solid #1E3A5F',
                    }}>
                      <p style={{ fontSize: '0.7rem', color: '#A89F92', marginBottom: 4 }}>
                        {lang === 'ja' ? `📝 ${fb.coachName || 'コーチ'} のFB` : `📝 FB by ${fb.coachName || 'Coach'}`}
                      </p>
                      {fb.goodPoints && <p style={{ fontSize: '0.78rem', color: '#2E7D52', marginBottom: 2 }}>✓ {fb.goodPoints}</p>}
                      {fb.improvements && <p style={{ fontSize: '0.78rem', color: '#E07B2A', marginBottom: 2 }}>△ {fb.improvements}</p>}
                      {fb.nextInstruction && <p style={{ fontSize: '0.78rem', color: '#1E3A5F' }}>→ {fb.nextInstruction}</p>}
                    </div>
                  )}

                  {/* FB表示（詳細展開時） */}
                  {fb && !isEditing && isExpanded && (
                    <div style={{
                      borderTop: '1px solid rgba(195,175,148,0.35)',
                      marginTop: 10, paddingTop: 10,
                    }}>
                      <p style={{ fontSize: '0.72rem', color: '#A89F92', marginBottom: 6 }}>
                        📝 {lang === 'ja' ? 'コーチFB' : 'Coach Feedback'}
                        {fb.coachName ? ` (${fb.coachName})` : ''}
                      </p>
                      {fb.goodPoints && <p style={{ fontSize: '0.78rem', color: '#2E7D52', marginBottom: 4 }}>✓ {fb.goodPoints}</p>}
                      {fb.improvements && <p style={{ fontSize: '0.78rem', color: '#E07B2A', marginBottom: 4 }}>△ {fb.improvements}</p>}
                      {fb.nextInstruction && <p style={{ fontSize: '0.78rem', color: '#1E3A5F' }}>→ {fb.nextInstruction}</p>}
                    </div>
                  )}

                  {/* FB入力フォーム */}
                  {isEditing && (
                    <FBForm
                      initial={fb}
                      recordType={tab}
                      lang={lang}
                      onSave={(feedback) => handleSaveFB(rec.id, feedback)}
                      onCancel={() => setEditId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
