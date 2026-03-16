import { useState, useEffect } from 'react'
import { getProfile, saveProfile } from '../lib/profile'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { TeamModal } from '../components/TeamModal'
import type { TeamWithRole } from '../types'
import type { useCoachRelationships } from '../hooks/useCoachRelationships'
import type { useTeams } from '../hooks/useTeams'
import { supabase } from '../lib/supabase'

interface Props {
  onBack: () => void
  coachRel: ReturnType<typeof useCoachRelationships>
  teams:    ReturnType<typeof useTeams>
}

export function SettingsPage({ onBack, coachRel, teams }: Props) {
  const { lang, setLang } = useLanguage()
  const { user, signOut, deleteAccount } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [motto, setMotto] = useState(() => getProfile().motto)
  const [saved, setSaved] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [displayNameSaved, setDisplayNameSaved] = useState(false)

  // Supabase から display_name を読み込む
  useEffect(() => {
    if (!user) return
    supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name)
      })
  }, [user])

  // コーチ招待
  const [inviteUrl,  setInviteUrl]  = useState('')
  const [inviteCopied, setInviteCopied] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  // チーム
  const [activeTeamModal, setActiveTeamModal] = useState<TeamWithRole | null>(null)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showJoinTeam,   setShowJoinTeam]   = useState(false)
  const [newTeamName,    setNewTeamName]    = useState('')
  const [joinLink,       setJoinLink]       = useState('')
  const [teamBusy,       setTeamBusy]       = useState(false)
  const [teamError,      setTeamError]      = useState('')

  const handleSave = () => {
    saveProfile({ motto })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveDisplayName = async () => {
    if (!user) return
    await supabase.from('user_profiles').upsert({
      user_id: user.id,
      display_name: displayName.trim(),
      updated_at: new Date().toISOString(),
    })
    setDisplayNameSaved(true)
    setTimeout(() => setDisplayNameSaved(false), 2000)
  }

  const handleInviteCoach = async () => {
    try {
      const url = await coachRel.createInvite()
      setInviteUrl(url)
      setShowInvite(true)
    } catch { /* ignore */ }
  }

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setTeamBusy(true)
    setTeamError('')
    try {
      await teams.createTeam(newTeamName.trim())
      setNewTeamName('')
      setShowCreateTeam(false)
    } catch {
      setTeamError(lang === 'ja' ? '作成に失敗しました' : 'Failed to create team')
    } finally {
      setTeamBusy(false)
    }
  }

  const handleJoinTeam = async () => {
    setTeamBusy(true)
    setTeamError('')
    try {
      const token = joinLink.includes('?team=')
        ? joinLink.split('?team=')[1].split('&')[0]
        : joinLink.trim()
      const result = await teams.joinTeam(token)
      if (!result.ok) {
        setTeamError(lang === 'ja' ? '招待リンクが無効です' : 'Invalid invite link')
      } else {
        setJoinLink('')
        setShowJoinTeam(false)
      }
    } catch {
      setTeamError(lang === 'ja' ? '参加に失敗しました' : 'Failed to join team')
    } finally {
      setTeamBusy(false)
    }
  }

  // 日数計算
  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div>
      {activeTeamModal && (
        <TeamModal team={activeTeamModal} onClose={() => setActiveTeamModal(null)} />
      )}

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-xl" style={{ color: '#7A6E5F' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>
          {lang === 'ja' ? '設定' : 'Settings'}
        </h1>
      </div>

      <div className="space-y-4">
        {/* 座右の銘 */}
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-1" style={{ color: '#E07B2A' }}>
            {lang === 'ja' ? '✒️ 座右の銘・好きな言葉' : '✒️ My Motto'}
          </p>
          <p className="text-xs mb-3" style={{ color: '#A89F92' }}>
            {lang === 'ja' ? 'ホーム画面のヘッダーに表示されます' : 'Displayed in the home screen header'}
          </p>
          <textarea
            value={motto}
            onChange={e => setMotto(e.target.value)}
            className="nb-textarea"
            rows={3}
            placeholder={lang === 'ja' ? '例）一球入魂、Never give up…' : 'e.g. Hard work beats talent…'}
          />
        </div>

        <button
          onClick={handleSave}
          className="btn-primary"
          style={saved ? { background: 'linear-gradient(135deg, #2E7D52, #1F5C3A)' } : undefined}
        >
          {saved
            ? (lang === 'ja' ? '✓ 保存しました' : '✓ Saved!')
            : (lang === 'ja' ? '保存する' : 'Save')}
        </button>

        {/* マイコーチ */}
        {user && (
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
              🤝 {lang === 'ja' ? 'マイコーチ' : 'My Coach'}
            </p>

            {coachRel.loading ? (
              <p className="text-xs" style={{ color: '#A89F92' }}>…</p>
            ) : coachRel.myCoaches.length === 0 ? (
              <p className="text-xs mb-3" style={{ color: '#A89F92' }}>
                {lang === 'ja' ? 'コーチはまだいません' : 'No coaches yet'}
              </p>
            ) : (
              <div className="space-y-2 mb-3">
                {coachRel.myCoaches.map(cr => (
                  <div key={cr.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(195,175,148,0.15)', borderRadius: 10, padding: '8px 12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', color: '#1E1A14', fontWeight: 600 }}>
                        {cr.coachName ?? (lang === 'ja' ? '名前未設定' : 'No name')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: cr.status === 'accepted' ? '#2E7D52' : '#E07B2A', marginLeft: 8 }}>
                        {cr.status === 'accepted'
                          ? (lang === 'ja' ? '✓ 承認済み' : '✓ Accepted')
                          : `${lang === 'ja' ? '招待中' : 'Pending'} (${lang === 'ja' ? `あと${daysLeft(cr.expiresAt)}日` : `${daysLeft(cr.expiresAt)}d left`})`
                        }
                      </span>
                    </div>
                    <button
                      onClick={() => coachRel.revokeCoach(cr.id)}
                      style={{
                        padding: '3px 10px', borderRadius: 8,
                        border: '1px solid rgba(220,53,69,0.25)',
                        background: 'rgba(220,53,69,0.06)',
                        color: '#DC3545', fontSize: '0.72rem', cursor: 'pointer',
                      }}
                    >
                      {lang === 'ja' ? '取り消す' : 'Revoke'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showInvite ? (
              <button
                onClick={handleInviteCoach}
                style={{
                  width: '100%', padding: '9px', borderRadius: 10, border: 'none',
                  background: '#1E3A5F', color: 'white',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                + {lang === 'ja' ? 'コーチを招待する' : 'Invite a Coach'}
              </button>
            ) : (
              <div>
                <p className="text-xs mb-1" style={{ color: '#7A6E5F' }}>
                  {lang === 'ja' ? '招待リンク（7日間有効）' : 'Invite link (valid 7 days)'}
                </p>
                <div style={{
                  background: 'rgba(195,175,148,0.2)', borderRadius: 10,
                  padding: '8px 12px', fontSize: '0.7rem', color: '#7A6E5F',
                  wordBreak: 'break-all', marginBottom: 8,
                }}>
                  {inviteUrl}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleCopyInvite}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                      background: inviteCopied ? '#2E7D52' : '#1E3A5F',
                      color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {inviteCopied ? (lang === 'ja' ? '✓ コピー済み' : '✓ Copied') : (lang === 'ja' ? 'コピー' : 'Copy')}
                  </button>
                  <button
                    onClick={() => setShowInvite(false)}
                    style={{
                      padding: '8px 12px', borderRadius: 10,
                      border: '1px solid rgba(195,175,148,0.4)',
                      background: 'transparent', color: '#7A6E5F', fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  >
                    {lang === 'ja' ? '閉じる' : 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* チーム管理 */}
        {user && (
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
              🏀 {lang === 'ja' ? 'チーム' : 'Teams'}
            </p>

            {teams.loading ? (
              <p className="text-xs" style={{ color: '#A89F92' }}>…</p>
            ) : teams.myTeams.length === 0 ? (
              <p className="text-xs mb-3" style={{ color: '#A89F92' }}>
                {lang === 'ja' ? 'チームはまだありません' : 'No teams yet'}
              </p>
            ) : (
              <div className="space-y-2 mb-3">
                {teams.myTeams.map(team => (
                  <div key={team.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(195,175,148,0.15)', borderRadius: 10, padding: '8px 12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', marginRight: 6 }}>
                        {team.myRole === 'coach' ? '👑' : '🏀'}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#1E1A14', fontWeight: 600 }}>{team.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#A89F92', marginLeft: 6 }}>
                        ({lang === 'ja'
                          ? (team.myRole === 'coach' ? 'コーチ' : '選手')
                          : (team.myRole === 'coach' ? 'Coach' : 'Player')
                        })
                      </span>
                    </div>
                    {team.myRole === 'coach' && (
                      <button
                        onClick={() => setActiveTeamModal(team)}
                        style={{
                          padding: '4px 10px', borderRadius: 8,
                          border: '1px solid rgba(30,58,95,0.25)',
                          background: 'rgba(30,58,95,0.06)',
                          color: '#1E3A5F', fontSize: '0.72rem', cursor: 'pointer',
                        }}
                      >
                        {lang === 'ja' ? '管理' : 'Manage'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* チーム作成 */}
            {!showCreateTeam && !showJoinTeam ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowCreateTeam(true)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                    background: '#1E3A5F', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + {lang === 'ja' ? 'チームを作成' : 'Create Team'}
                </button>
                <button
                  onClick={() => setShowJoinTeam(true)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 10,
                    border: '1px solid rgba(30,58,95,0.3)',
                    background: 'transparent', color: '#1E3A5F', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {lang === 'ja' ? '招待で参加' : 'Join by Link'}
                </button>
              </div>
            ) : showCreateTeam ? (
              <div>
                <input
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder={lang === 'ja' ? 'チーム名を入力' : 'Team name'}
                  className="nb-textarea"
                  style={{ marginBottom: 8 }}
                />
                {teamError && <p style={{ color: '#DC3545', fontSize: '0.75rem', marginBottom: 6 }}>{teamError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleCreateTeam}
                    disabled={teamBusy || !newTeamName.trim()}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                      background: newTeamName.trim() ? '#1E3A5F' : 'rgba(195,175,148,0.2)',
                      color: newTeamName.trim() ? 'white' : '#A89F92',
                      fontSize: '0.8rem', fontWeight: 600, cursor: newTeamName.trim() ? 'pointer' : 'default',
                    }}
                  >
                    {teamBusy ? '…' : (lang === 'ja' ? '作成する' : 'Create')}
                  </button>
                  <button onClick={() => { setShowCreateTeam(false); setTeamError('') }} style={{
                    padding: '8px 12px', borderRadius: 10,
                    border: '1px solid rgba(195,175,148,0.4)',
                    background: 'transparent', color: '#7A6E5F', fontSize: '0.78rem', cursor: 'pointer',
                  }}>
                    {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  value={joinLink}
                  onChange={e => setJoinLink(e.target.value)}
                  placeholder={lang === 'ja' ? '招待リンクを貼り付け' : 'Paste invite link'}
                  className="nb-textarea"
                  style={{ marginBottom: 8 }}
                />
                {teamError && <p style={{ color: '#DC3545', fontSize: '0.75rem', marginBottom: 6 }}>{teamError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleJoinTeam}
                    disabled={teamBusy || !joinLink.trim()}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                      background: joinLink.trim() ? '#1E3A5F' : 'rgba(195,175,148,0.2)',
                      color: joinLink.trim() ? 'white' : '#A89F92',
                      fontSize: '0.8rem', fontWeight: 600, cursor: joinLink.trim() ? 'pointer' : 'default',
                    }}
                  >
                    {teamBusy ? '…' : (lang === 'ja' ? '参加する' : 'Join')}
                  </button>
                  <button onClick={() => { setShowJoinTeam(false); setTeamError('') }} style={{
                    padding: '8px 12px', borderRadius: 10,
                    border: '1px solid rgba(195,175,148,0.4)',
                    background: 'transparent', color: '#7A6E5F', fontSize: '0.78rem', cursor: 'pointer',
                  }}>
                    {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 言語設定 */}
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
            {lang === 'ja' ? '🌐 言語 / Language' : '🌐 Language'}
          </p>
          <div className="flex gap-2">
            {(['ja', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: lang === l ? '#1E3A5F' : 'rgba(195,175,148,0.2)',
                  color: lang === l ? 'white' : '#7A6E5F',
                  border: lang === l ? 'none' : '1px solid rgba(195,175,148,0.4)',
                }}
              >
                {l === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}
              </button>
            ))}
          </div>
        </div>

        {/* 表示名 */}
        {user && (
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-1" style={{ color: '#E07B2A' }}>
              {lang === 'ja' ? '👤 あなたの名前（コーチに表示）' : '👤 Your Display Name'}
            </p>
            <p className="text-xs mb-3" style={{ color: '#A89F92' }}>
              {lang === 'ja' ? 'コーチ画面に表示される名前です' : 'Shown to your coach on their dashboard'}
            </p>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={lang === 'ja' ? '例）田中 太郎' : 'e.g. John Smith'}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1px solid rgba(195,175,148,0.4)',
                background: 'rgba(195,175,148,0.08)', color: '#1E1A14',
                fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                marginBottom: 10,
              }}
            />
            <button
              onClick={handleSaveDisplayName}
              className="btn-primary"
              style={displayNameSaved ? { background: 'linear-gradient(135deg, #2E7D52, #1F5C3A)' } : undefined}
            >
              {displayNameSaved
                ? (lang === 'ja' ? '✓ 保存しました' : '✓ Saved!')
                : (lang === 'ja' ? '名前を保存する' : 'Save Name')}
            </button>
          </div>
        )}

        {/* アカウント */}
        {user && (
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
              {lang === 'ja' ? '👤 アカウント' : '👤 Account'}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#7A6E5F' }}>{lang === 'ja' ? 'メール' : 'Email'}</span>
                <span className="text-xs font-semibold truncate ml-4" style={{ color: '#1E1A14', maxWidth: '55%' }}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: 'rgba(220,53,69,0.08)',
                color: '#DC3545',
                border: '1px solid rgba(220,53,69,0.25)',
              }}
            >
              {lang === 'ja' ? 'ログアウト' : 'Sign Out'}
            </button>
            <button
              onClick={() => { setDeleteConfirmText(''); setShowDeleteConfirm(true) }}
              className="w-full mt-2 py-2 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: 'transparent',
                color: 'rgba(220,53,69,0.5)',
                border: '1px solid rgba(220,53,69,0.15)',
              }}
            >
              {lang === 'ja' ? 'アカウントを削除する' : 'Delete Account'}
            </button>
          </div>
        )}

        {/* アカウント削除確認モーダル */}
        {showDeleteConfirm && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              style={{
                backgroundColor: 'white', borderRadius: '20px',
                padding: '24px', width: '100%', maxWidth: '340px',
              }}
              onClick={e => e.stopPropagation()}
            >
              <p style={{ fontSize: '1.25rem', marginBottom: '8px', textAlign: 'center' }}>⚠️</p>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E1A14', textAlign: 'center', marginBottom: '8px' }}>
                {lang === 'ja' ? 'アカウントを削除しますか？' : 'Delete your account?'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#7A6E5F', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 }}>
                {lang === 'ja'
                  ? '全ての記録・データが完全に削除されます。この操作は取り消せません。'
                  : 'All records and data will be permanently deleted. This cannot be undone.'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#1E1A14', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'ja' ? '確認のため「削除する」と入力してください:' : 'Type "delete" to confirm:'}
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={lang === 'ja' ? '削除する' : 'delete'}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px',
                  border: '1px solid rgba(220,53,69,0.3)', fontSize: '0.85rem',
                  marginBottom: '16px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                disabled={deleting || (lang === 'ja' ? deleteConfirmText !== '削除する' : deleteConfirmText !== 'delete')}
                onClick={async () => {
                  setDeleting(true)
                  try { await deleteAccount() } finally { setDeleting(false) }
                }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  backgroundColor: (lang === 'ja' ? deleteConfirmText === '削除する' : deleteConfirmText === 'delete') && !deleting
                    ? '#DC3545' : 'rgba(220,53,69,0.25)',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem', border: 'none',
                  transition: 'background-color 0.2s',
                  cursor: (lang === 'ja' ? deleteConfirmText === '削除する' : deleteConfirmText === 'delete') && !deleting ? 'pointer' : 'default',
                }}
              >
                {deleting
                  ? (lang === 'ja' ? '削除中...' : 'Deleting...')
                  : (lang === 'ja' ? 'アカウントを削除する' : 'Delete Account')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  width: '100%', padding: '10px', marginTop: '8px', borderRadius: '12px',
                  backgroundColor: 'transparent', color: '#7A6E5F', fontSize: '0.85rem', border: 'none',
                }}
              >
                {lang === 'ja' ? 'キャンセル' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* アプリ情報 */}
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
            {lang === 'ja' ? 'ℹ️ アプリ情報' : 'ℹ️ App Info'}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#7A6E5F' }}>{lang === 'ja' ? 'バージョン' : 'Version'}</span>
              <span className="text-xs font-semibold" style={{ color: '#1E1A14' }}>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#7A6E5F' }}>{lang === 'ja' ? 'データ保存' : 'Storage'}</span>
              <span className="text-xs font-semibold" style={{ color: '#1E1A14' }}>
                {lang === 'ja' ? 'クラウド（Supabase）' : 'Cloud (Supabase)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
