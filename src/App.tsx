import { useState, useEffect } from 'react'
import { Home, Calendar, BookOpen, Trophy, Target, BarChart2, Clipboard, Settings } from 'lucide-react'
import { useSupabaseStore } from './hooks/useSupabaseStore'
import { useCoachRelationships } from './hooks/useCoachRelationships'
import { useTeams } from './hooks/useTeams'
import { SpinningCursor } from './components/SpinningCursor'
import { Dashboard }      from './pages/Dashboard'
import { CalendarPage }   from './pages/Calendar'
import { PracticeNote }   from './pages/PracticeNote'
import { GameRecordPage } from './pages/GameRecord'
import { GoalsPage }      from './pages/Goals'
import { SkillCheck }     from './pages/SkillCheck'
import { FormationsPage } from './pages/FormationsPage'
import { SettingsPage }   from './pages/Settings'
import { Onboarding }     from './pages/Onboarding'
import { LoginPage }      from './pages/Login'
import { GuestPreview }  from './pages/GuestPreview'
import { ModeSelect }     from './pages/ModeSelect'
import { OnboardingCards, hasSeenFeatureTour } from './components/OnboardingCards'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { AuthProvider, useAuth }         from './contexts/AuthContext'
import { getProfile } from './lib/profile'

type Page = 'home' | 'calendar' | 'practice' | 'game' | 'goals' | 'skills' | 'formations' | 'settings'

const NAV_IDS: { id: Page; key: string; Icon: React.ElementType }[] = [
  { id: 'home',       key: 'nav.home',       Icon: Home },
  { id: 'calendar',   key: 'nav.calendar',   Icon: Calendar },
  { id: 'practice',   key: 'nav.practice',   Icon: BookOpen },
  { id: 'game',       key: 'nav.game',       Icon: Trophy },
  { id: 'goals',      key: 'nav.goals',      Icon: Target },
  { id: 'skills',     key: 'nav.skills',     Icon: BarChart2 },
  { id: 'formations', key: 'nav.formations', Icon: Clipboard },
]

// 招待トークンをURLパラメータから取得してlocalStorageに保存
function captureInviteTokens() {
  const p = new URLSearchParams(window.location.search)
  const inviteToken = p.get('invite')
  const teamToken   = p.get('team')
  if (inviteToken) localStorage.setItem('bskt-pending-coach-invite', inviteToken)
  if (teamToken)   localStorage.setItem('bskt-pending-team-join', teamToken)
  if (inviteToken || teamToken)
    window.history.replaceState({}, '', window.location.pathname)
}
// mount直後に実行（OAuth redirect前も後も）
captureInviteTokens()

function AppInner() {
  const [page, setPage] = useState<Page>('home')
  const [onboardingDone, setOnboardingDone] = useState(() => getProfile().onboardingDone)
  const [modeDone,       setModeDone]       = useState(() => !!getProfile().mode)
  const [featureTourDone, setFeatureTourDone] = useState(() => hasSeenFeatureTour())
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const store = useSupabaseStore(user?.id ?? '')
  const { lang, setLang, t } = useLanguage()

  // コーチ・チームフック（ログイン済みのみ）
  const coachRel = useCoachRelationships(user?.id ?? null)
  const teams    = useTeams(user?.id ?? null)

  // pendingトークン処理（user確定後）
  const [pendingCoachToken, setPendingCoachToken] = useState<string | null>(null)
  const [pendingTeamToken,  setPendingTeamToken]  = useState<string | null>(null)
  const [coachInviteName,   setCoachInviteName]   = useState('')
  const [inviteBusy,        setInviteBusy]        = useState(false)
  const [inviteMsg,         setInviteMsg]          = useState('')

  useEffect(() => {
    if (!user) return
    const coachToken = localStorage.getItem('bskt-pending-coach-invite')
    const teamToken  = localStorage.getItem('bskt-pending-team-join')
    if (coachToken) {
      localStorage.removeItem('bskt-pending-coach-invite')
      setPendingCoachToken(coachToken)
    }
    if (teamToken) {
      localStorage.removeItem('bskt-pending-team-join')
      setPendingTeamToken(teamToken)
    }
  }, [user])

  const handleAcceptCoach = async () => {
    if (!pendingCoachToken || !coachInviteName.trim()) return
    setInviteBusy(true)
    const result = await coachRel.acceptInvite(pendingCoachToken, coachInviteName.trim())
    if (result.ok) {
      setInviteMsg(lang === 'ja' ? '登録が完了しました！' : "You're now registered as their coach!")
      setTimeout(() => { setPendingCoachToken(null); setInviteMsg('') }, 2500)
    } else {
      const key = result.error ?? ''
      setInviteMsg(
        key === 'invite.selfError'  ? (lang === 'ja' ? '自分は招待できません' : 'You cannot coach yourself') :
        key === 'invite.expired'    ? (lang === 'ja' ? 'リンクの有効期限が切れています' : 'This invite link has expired') :
        (lang === 'ja' ? 'エラーが発生しました' : 'An error occurred')
      )
    }
    setInviteBusy(false)
  }

  const handleJoinTeam = async () => {
    if (!pendingTeamToken) return
    setInviteBusy(true)
    const result = await teams.joinTeam(pendingTeamToken)
    if (result.ok) {
      setInviteMsg(lang === 'ja' ? `${result.teamName ?? 'チーム'} に参加しました！` : `Joined ${result.teamName ?? 'the team'}!`)
      setTimeout(() => { setPendingTeamToken(null); setInviteMsg('') }, 2500)
    } else {
      setInviteMsg(lang === 'ja' ? '招待リンクが無効です' : 'Invalid invite link')
    }
    setInviteBusy(false)
  }

  // コーチとして担当選手がいる場合 → スキルチェックは不要
  const isCoach = coachRel.myAthletes.length > 0
  const visibleNav = isCoach
    ? NAV_IDS.filter(n => n.id !== 'skills')
    : NAV_IDS

  const nav = (p: string) => setPage(p as Page)

  // ===== 認証ロード中 =====
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh', backgroundColor: '#1E3A5F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SpinningCursor />
        <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>🏀</div>
      </div>
    )
  }

  // ===== 未ログイン → ゲストプレビュー =====
  if (!user) {
    return <GuestPreview onSignIn={signInWithGoogle} />
  }

  // ===== オンボーディング未完了 =====
  if (!onboardingDone) {
    return (
      <>
        <SpinningCursor />
        <Onboarding onComplete={() => setOnboardingDone(true)} />
      </>
    )
  }

  // ===== モード未選択 =====
  if (!modeDone) {
    return (
      <>
        <SpinningCursor />
        <ModeSelect onComplete={() => setModeDone(true)} />
      </>
    )
  }

  // ===== 機能紹介カード（初回ログイン時のみ） =====
  if (!featureTourDone) {
    return <OnboardingCards lang={lang} onDone={() => setFeatureTourDone(true)} />
  }

  // ===== データ読み込み中 =====
  if (store.loading) {
    return (
      <div style={{
        minHeight: '100dvh', backgroundColor: '#E8E0D0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SpinningCursor />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏀</div>
          <p style={{ color: '#A89F92', fontSize: '0.85rem' }}>
            {lang === 'ja' ? '読み込み中…' : 'Loading…'}
          </p>
        </div>
      </div>
    )
  }

  const content = () => {
    switch (page) {
      case 'home':       return <Dashboard      practiceLogs={store.practiceLogs} gameRecords={store.gameRecords} goals={store.goals} latestNextChallenge={store.getLatestNextChallenge()} onNavigate={nav} coachRelationships={coachRel} teams={teams} />
      case 'calendar':   return <CalendarPage   practiceLogs={store.practiceLogs} gameRecords={store.gameRecords} onNavigate={nav} />
      case 'practice':   return <PracticeNote   logs={store.practiceLogs} latestNextChallenge={store.getLatestNextChallenge()} onAdd={store.addPracticeLog} onUpdate={store.updatePracticeLog} onDelete={store.deletePracticeLog} onAddFormation={store.addFormation} teams={teams} />
      case 'game':       return <GameRecordPage records={store.gameRecords} onAdd={store.addGameRecord} onUpdate={store.updateGameRecord} onDelete={store.deleteGameRecord} teams={teams} />
      case 'goals':      return <GoalsPage      goals={store.goals} onAdd={store.addGoal} onUpdate={store.updateGoal} onDelete={store.deleteGoal} />
      case 'skills':     return <SkillCheck     skillRecords={store.skillRecords} onUpdate={store.updateSkillLevel} />
      case 'formations': return <FormationsPage formations={store.formations} onAdd={store.addFormation} onUpdate={store.updateFormation} onDelete={store.deleteFormation} teams={teams} />
      case 'settings':   return <SettingsPage   onBack={() => setPage('home')} coachRel={coachRel} teams={teams} />
    }
  }

  // コーチなのにスキルページにいる場合はホームへ
  if (isCoach && page === 'skills') setPage('home')

  const showNav = page !== 'settings'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#E8E0D0' }}>
      <SpinningCursor />

      {/* 招待承認モーダル: コーチ招待 */}
      {pendingCoachToken && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#1E3A5F', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              🤝 {lang === 'ja' ? 'コーチ招待' : 'Coach Invite'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: 16 }}>
              {lang === 'ja' ? 'あなたの名前（コーチ名）を入力してください' : 'Enter your name (shown to the athlete)'}
            </p>
            {inviteMsg ? (
              <p style={{ color: '#4CAF50', textAlign: 'center', fontSize: '0.9rem', padding: '12px 0' }}>
                {inviteMsg}
              </p>
            ) : (
              <>
                <input
                  value={coachInviteName}
                  onChange={e => setCoachInviteName(e.target.value)}
                  placeholder={lang === 'ja' ? '山田コーチ' : 'Coach Smith'}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)', color: 'white',
                    fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: 12, outline: 'none',
                  }}
                />
                <button
                  onClick={handleAcceptCoach}
                  disabled={inviteBusy || !coachInviteName.trim()}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                    background: coachInviteName.trim() ? '#E07B2A' : 'rgba(255,255,255,0.1)',
                    color: coachInviteName.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                    fontWeight: 700, fontSize: '0.9rem', cursor: coachInviteName.trim() ? 'pointer' : 'default',
                  }}
                >
                  {inviteBusy ? '…' : (lang === 'ja' ? 'コーチとして参加する' : 'Join as Coach')}
                </button>
                <button
                  onClick={() => setPendingCoachToken(null)}
                  style={{
                    width: '100%', marginTop: 8, padding: '8px', background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', cursor: 'pointer',
                  }}
                >
                  {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 招待承認モーダル: チーム参加 */}
      {pendingTeamToken && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#1E3A5F', borderRadius: 20, padding: 24,
            width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              🏀 {lang === 'ja' ? 'チーム参加' : 'Join Team'}
            </p>
            {inviteMsg ? (
              <p style={{ color: '#4CAF50', textAlign: 'center', fontSize: '0.9rem', padding: '12px 0' }}>
                {inviteMsg}
              </p>
            ) : (
              <>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: 16 }}>
                  {lang === 'ja' ? 'このチームに参加しますか？' : 'Would you like to join this team?'}
                </p>
                <button
                  onClick={handleJoinTeam}
                  disabled={inviteBusy}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                    background: '#E07B2A', color: 'white',
                    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginBottom: 8,
                  }}
                >
                  {inviteBusy ? '…' : (lang === 'ja' ? '参加する' : 'Join')}
                </button>
                <button
                  onClick={() => setPendingTeamToken(null)}
                  style={{
                    width: '100%', padding: '8px', background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', cursor: 'pointer',
                  }}
                >
                  {lang === 'ja' ? 'キャンセル' : 'Cancel'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 設定アイコン + 言語切り替え */}
      <div className="fixed top-3 right-3 z-40 flex items-center gap-1.5">
        <button
          onClick={() => setPage(page === 'settings' ? 'home' : 'settings')}
          className="p-1.5 rounded-full"
          style={{
            backgroundColor: page === 'settings' ? '#1E3A5F' : 'rgba(195,175,148,0.35)',
            color: page === 'settings' ? 'white' : '#7A6E5F',
            border: '1px solid rgba(195,175,148,0.6)',
          }}
        >
          <Settings size={14} />
        </button>
        <button
          onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: 'rgba(195,175,148,0.35)',
            color: '#7A6E5F',
            border: '1px solid rgba(195,175,148,0.6)',
          }}
        >
          {lang === 'ja' ? 'EN' : 'JA'}
        </button>
      </div>

      <main className="flex-1 overflow-y-auto nb-bg">
        {/* key={page} causes remount on tab switch → triggers .page-enter animation */}
        <div key={page} className="max-w-md mx-auto px-4 pt-6 page-enter">
          {content()}
        </div>
      </main>

      {/* Bottom Navigation — 設定画面では非表示 */}
      {showNav && (
        <nav
          className="safe-area-bottom"
          style={{
            flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTop: '1px solid rgba(195,175,148,0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 -1px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div className="max-w-md mx-auto flex">
            {visibleNav.map(({ id, key, Icon }) => {
              const active = page === id
              return (
                <button
                  key={id}
                  onClick={() => setPage(id)}
                  className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors relative"
                  style={{ color: active ? '#E07B2A' : '#A89F92' }}
                >
                  {active && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2"
                      style={{
                        width: 24, height: 2.5,
                        borderRadius: '0 0 3px 3px',
                        background: 'linear-gradient(90deg, #E07B2A, #C4520D)',
                        boxShadow: '0 0 6px rgba(224,123,42,0.5)',
                      }}
                    />
                  )}
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span
                    style={{
                      fontSize: '0.57rem',
                      fontWeight: active ? 700 : 400,
                      fontFamily: active ? "'Klee One', cursive" : 'inherit',
                    }}
                  >
                    {t(key)}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </LanguageProvider>
  )
}
