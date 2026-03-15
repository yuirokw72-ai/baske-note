import { useState } from 'react'
import { Home, Calendar, BookOpen, Trophy, Target, BarChart2, Clipboard, Settings } from 'lucide-react'
import { useSupabaseStore } from './hooks/useSupabaseStore'
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

function AppInner() {
  const [page, setPage] = useState<Page>('home')
  const [onboardingDone, setOnboardingDone] = useState(() => getProfile().onboardingDone)
  const { user, loading: authLoading } = useAuth()
  const store = useSupabaseStore(user?.id ?? '')
  const { lang, setLang, t } = useLanguage()

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

  // ===== 未ログイン =====
  if (!user) {
    return (
      <LanguageProvider>
        <LoginPage />
      </LanguageProvider>
    )
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
      case 'home':       return <Dashboard      practiceLogs={store.practiceLogs} gameRecords={store.gameRecords} goals={store.goals} latestNextChallenge={store.getLatestNextChallenge()} onNavigate={nav} />
      case 'calendar':   return <CalendarPage   practiceLogs={store.practiceLogs} gameRecords={store.gameRecords} onNavigate={nav} />
      case 'practice':   return <PracticeNote   logs={store.practiceLogs} latestNextChallenge={store.getLatestNextChallenge()} onAdd={store.addPracticeLog} onUpdate={store.updatePracticeLog} onDelete={store.deletePracticeLog} onAddFormation={store.addFormation} />
      case 'game':       return <GameRecordPage records={store.gameRecords} onAdd={store.addGameRecord} onUpdate={store.updateGameRecord} onDelete={store.deleteGameRecord} />
      case 'goals':      return <GoalsPage      goals={store.goals} onAdd={store.addGoal} onUpdate={store.updateGoal} onDelete={store.deleteGoal} />
      case 'skills':     return <SkillCheck     skillRecords={store.skillRecords} onUpdate={store.updateSkillLevel} />
      case 'formations': return <FormationsPage formations={store.formations} onAdd={store.addFormation} onUpdate={store.updateFormation} onDelete={store.deleteFormation} />
      case 'settings':   return <SettingsPage   onBack={() => setPage('home')} />
    }
  }

  const showNav = page !== 'settings'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E0D0' }}>
      <SpinningCursor />

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

      <main className="flex-1 overflow-y-auto pb-20 nb-bg">
        {/* key={page} causes remount on tab switch → triggers .page-enter animation */}
        <div key={page} className="max-w-md mx-auto px-4 pt-6 page-enter">
          {content()}
        </div>
      </main>

      {/* Bottom Navigation — 設定画面では非表示 */}
      {showNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 safe-area-bottom"
          style={{
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTop: '1px solid rgba(195,175,148,0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 -1px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div className="max-w-md mx-auto flex">
            {NAV_IDS.map(({ id, key, Icon }) => {
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
