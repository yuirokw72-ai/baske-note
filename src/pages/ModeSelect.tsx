import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { saveProfile } from '../lib/profile'
import { useTeams } from '../hooks/useTeams'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onComplete: () => void
}

type SubMode = null | 'create' | 'join'

export function ModeSelect({ onComplete }: Props) {
  const { lang, t } = useLanguage()
  const { user } = useAuth()
  const { createTeam, joinTeam } = useTeams(user?.id ?? null)

  const [teamSubMode, setTeamSubMode] = useState<SubMode>(null)
  const [teamName,    setTeamName]    = useState('')
  const [joinLink,    setJoinLink]    = useState('')
  const [busy,        setBusy]        = useState(false)
  const [error,       setError]       = useState('')

  const handleIndividual = () => {
    saveProfile({ mode: 'individual' })
    onComplete()
  }

  const handleTeamSkip = () => {
    saveProfile({ mode: 'team' })
    onComplete()
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    setBusy(true)
    setError('')
    try {
      await createTeam(teamName.trim())
      saveProfile({ mode: 'team' })
      onComplete()
    } catch {
      setError(lang === 'ja' ? 'チームの作成に失敗しました' : 'Failed to create team')
    } finally {
      setBusy(false)
    }
  }

  const handleJoinTeam = async () => {
    setBusy(true)
    setError('')
    try {
      // URLからトークンを抽出
      const token = joinLink.includes('?team=')
        ? joinLink.split('?team=')[1].split('&')[0]
        : joinLink.trim()

      const result = await joinTeam(token)
      if (!result.ok) {
        setError(lang === 'ja' ? '招待リンクが無効です' : 'Invalid invite link')
      } else {
        saveProfile({ mode: 'team' })
        onComplete()
      }
    } catch {
      setError(lang === 'ja' ? '参加に失敗しました' : 'Failed to join team')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#0D1B2A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏀</div>

      <h1 style={{
        color: 'white',
        fontSize: '1.3rem',
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 4,
        fontFamily: "'Klee One', cursive",
      }}>
        {t('mode.title')}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginBottom: 28 }}>
        {t('mode.later')}
      </p>

      {/* モード選択カード */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 380, marginBottom: 20 }}>
        {/* 個人 */}
        <button
          onClick={handleIndividual}
          style={{
            flex: 1,
            background: 'linear-gradient(145deg, rgba(30,58,95,0.9), rgba(20,40,70,0.9))',
            border: '1px solid rgba(100,150,220,0.35)',
            borderRadius: 16,
            padding: '20px 14px',
            color: 'white',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(100,150,220,0.12)',
          }}
        >
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>👤</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
            {t('mode.individual')}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {t('mode.individualSub')}
          </div>
        </button>

        {/* チーム */}
        <button
          onClick={() => setTeamSubMode(teamSubMode ? null : 'create')}
          style={{
            flex: 1,
            background: 'linear-gradient(145deg, rgba(224,123,42,0.25), rgba(180,80,20,0.25))',
            border: '1px solid rgba(224,123,42,0.5)',
            borderRadius: 16,
            padding: '20px 14px',
            color: 'white',
            textAlign: 'left',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(224,123,42,0.12)',
          }}
        >
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🏀</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
            {t('mode.team')}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {t('mode.teamSub')}
          </div>
        </button>
      </div>

      {/* チームモード展開パネル */}
      {teamSubMode !== null && (
        <div style={{
          width: '100%',
          maxWidth: 380,
          background: 'rgba(20,35,55,0.95)',
          border: '1px solid rgba(224,123,42,0.35)',
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
        }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>
            {lang === 'ja' ? '🏀 チームをどうしますか？' : '🏀 Set up your team'}
          </p>

          {/* 作成 / 参加 タブ */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['create', 'join'] as const).map(m => (
              <button
                key={m}
                onClick={() => setTeamSubMode(m)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: teamSubMode === m ? '#E07B2A' : 'rgba(255,255,255,0.08)',
                  color: teamSubMode === m ? 'white' : 'rgba(255,255,255,0.55)',
                }}
              >
                {m === 'create' ? t('mode.createTeam') : t('mode.joinTeam')}
              </button>
            ))}
          </div>

          {teamSubMode === 'create' && (
            <div>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder={t('mode.teamNamePh')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'white',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCreateTeam}
                disabled={busy || !teamName.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: teamName.trim() ? '#E07B2A' : 'rgba(255,255,255,0.1)',
                  color: teamName.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: teamName.trim() ? 'pointer' : 'default',
                }}
              >
                {busy ? '…' : t('mode.createBtn')}
              </button>
            </div>
          )}

          {teamSubMode === 'join' && (
            <div>
              <input
                value={joinLink}
                onChange={e => setJoinLink(e.target.value)}
                placeholder={t('mode.joinLinkPh')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'white',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleJoinTeam}
                disabled={busy || !joinLink.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: joinLink.trim() ? '#E07B2A' : 'rgba(255,255,255,0.1)',
                  color: joinLink.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: joinLink.trim() ? 'pointer' : 'default',
                }}
              >
                {busy ? '…' : t('mode.joinBtn')}
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: '#FF6B6B', fontSize: '0.78rem', marginTop: 8, textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* スキップ */}
          <button
            onClick={handleTeamSkip}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {t('mode.skip')}
          </button>
        </div>
      )}
    </div>
  )
}
