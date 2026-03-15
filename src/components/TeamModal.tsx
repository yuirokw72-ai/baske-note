import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTeams } from '../hooks/useTeams'
import type { TeamWithRole, TeamMember } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  team: TeamWithRole
  onClose: () => void
}

export function TeamModal({ team, onClose }: Props) {
  const { lang, t } = useLanguage()
  const { user } = useAuth()
  const { resetInviteToken, kickMember, leaveTeam } = useTeams(user?.id ?? null)

  const [members,      setMembers]      = useState<TeamMember[]>([])
  const [inviteUrl,    setInviteUrl]    = useState('')
  const [copied,       setCopied]       = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [busy,         setBusy]         = useState(false)

  // メンバー一覧はteamsフックのgetTeamMembersで取得
  const { getTeamMembers } = useTeams(user?.id ?? null)

  useEffect(() => {
    getTeamMembers(team.id).then(setMembers)
    setInviteUrl(`${window.location.origin}?team=${team.inviteToken}`)
  }, [team.id, team.inviteToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    setBusy(true)
    const newUrl = await resetInviteToken(team.id)
    setInviteUrl(newUrl)
    setBusy(false)
  }

  const handleKick = async (userId: string) => {
    await kickMember(team.id, userId)
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  const handleLeave = async () => {
    await leaveTeam(team.id)
    onClose()
  }

  const isCoach = team.myRole === 'coach'

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
          padding: '24px 20px 40px',
          width: '100%',
          maxWidth: 480,
          maxHeight: '82dvh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#A89F92' }}>
              {isCoach ? (lang === 'ja' ? '👑 コーチ' : '👑 Coach') : (lang === 'ja' ? '🏀 選手' : '🏀 Player')}
            </p>
            <h2 style={{ color: '#1E3A5F', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{team.name}</h2>
          </div>
          <button onClick={onClose} style={{ color: '#A89F92', fontSize: '1.3rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {/* 招待リンク（コーチのみ） */}
        {isCoach && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E07B2A', marginBottom: 8 }}>
              🔗 {t('team.inviteLink')}
            </p>
            <div style={{
              background: 'rgba(195,175,148,0.2)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: '0.72rem',
              color: '#7A6E5F',
              wordBreak: 'break-all',
              marginBottom: 8,
            }}>
              {inviteUrl}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                  background: copied ? '#2E7D52' : '#1E3A5F',
                  color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {copied ? (lang === 'ja' ? '✓ コピー済み' : '✓ Copied') : t('settings.inviteCopy')}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={busy}
                style={{
                  padding: '8px 12px', borderRadius: 10,
                  border: '1px solid rgba(220,53,69,0.3)',
                  background: 'transparent',
                  color: '#DC3545', fontSize: '0.75rem', cursor: 'pointer',
                }}
              >
                {t('team.regenerateToken')}
              </button>
            </div>
          </div>
        )}

        {/* メンバー一覧 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E3A5F', marginBottom: 10 }}>
            👥 {t('team.members')} ({members.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <div key={m.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(195,175,148,0.15)', borderRadius: 10, padding: '8px 12px',
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#A89F92', marginRight: 6 }}>
                    {m.role === 'coach' ? '👑' : '🏀'}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#1E1A14' }}>
                    {m.userId === user?.id
                      ? (lang === 'ja' ? 'あなた' : 'You')
                      : (lang === 'ja' ? `${m.role === 'coach' ? 'コーチ' : '選手'}` : m.role)
                    }
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#A89F92', marginLeft: 6 }}>
                    {m.role === 'coach' ? t('settings.teamCoach') : t('settings.teamPlayer')}
                  </span>
                </div>
                {isCoach && m.userId !== user?.id && m.role !== 'coach' && (
                  <button
                    onClick={() => handleKick(m.userId)}
                    style={{
                      padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(220,53,69,0.3)',
                      background: 'rgba(220,53,69,0.06)', color: '#DC3545',
                      fontSize: '0.72rem', cursor: 'pointer',
                    }}
                  >
                    {t('team.kickMember')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 退出ボタン */}
        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            style={{
              width: '100%', padding: '10px', borderRadius: 12,
              border: '1px solid rgba(220,53,69,0.25)',
              background: 'rgba(220,53,69,0.06)',
              color: '#DC3545', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('team.leave')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleLeave}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                background: '#DC3545', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {lang === 'ja' ? '退出する' : 'Leave'}
            </button>
            <button
              onClick={() => setConfirmLeave(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: 12,
                border: '1px solid rgba(195,175,148,0.4)',
                background: 'transparent', color: '#7A6E5F', fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              {lang === 'ja' ? 'キャンセル' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
