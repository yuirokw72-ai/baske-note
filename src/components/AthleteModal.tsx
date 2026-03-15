import { useEffect, useState } from 'react'
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

type RecordTab = 'practice' | 'game'

export function AthleteModal({ athleteUserId, athleteName, onClose }: Props) {
  const { lang } = useLanguage()
  const { practiceLogs, gameRecords, loading, fetchAthleteRecords, updateCoachFeedback } = useCoachStore()
  const [tab,     setTab]     = useState<RecordTab>('practice')
  const [editId,  setEditId]  = useState<string | null>(null)

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
          maxHeight: '85dvh',
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
            <button key={t} onClick={() => { setTab(t); setEditId(null) }} style={{
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
              const isEditing = editId === rec.id

              return (
                <div key={rec.id} style={{
                  background: 'rgba(195,175,148,0.12)',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  {/* レコードヘッダー */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#A89F92', marginBottom: 2 }}>
                        {fmtDate(rec.date ?? rec.createdAt ?? '')}
                        {isPractice && ` · ${pl.duration}${lang === 'ja' ? '分' : 'min'}`}
                        {!isPractice && ` vs ${gr.opponent}`}
                      </p>
                      <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1E1A14' }}>
                        {isPractice ? pl.todayGoal : (gr.result === 'win' ? '🏆' : gr.result === 'lose' ? '💔' : '🤝') + ` ${gr.myScore}–${gr.opponentScore}`}
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setEditId(rec.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, border: 'none',
                          background: fb ? 'rgba(30,58,95,0.08)' : '#E07B2A',
                          color: fb ? '#1E3A5F' : 'white',
                          fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        {fb
                          ? (lang === 'ja' ? 'FB編集' : 'Edit FB')
                          : (lang === 'ja' ? 'FB追加 +' : 'Add FB +')}
                      </button>
                    )}
                  </div>

                  {/* 既存FB表示 */}
                  {fb && !isEditing && (
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
