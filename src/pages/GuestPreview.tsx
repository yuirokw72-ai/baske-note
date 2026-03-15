import { useState } from 'react'
import { Home, Calendar, BookOpen, Trophy, Target, BarChart2, Clipboard, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { SpinningCursor } from '../components/SpinningCursor'
import { Dashboard } from './Dashboard'
import type { PracticeLog, GameRecord, Goal } from '../types'

// ===== サンプルデータ =====
const today = new Date()
const d = (offset: number) => {
  const dt = new Date(today)
  dt.setDate(today.getDate() - offset)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

const NOW = new Date().toISOString()

function getSampleLogs(lang: string): PracticeLog[] {
  if (lang === 'en') return [
    {
      id: 's1', date: d(1), practiceType: 'team', duration: 120,
      todayGoal: 'Stabilize 3-point shooting form',
      condition: 4, motivation: 5,
      menus: ['Shooting drills', 'Free throws', '5-on-5'],
      didWell: 'Improved accuracy on catch-and-shoot',
      struggled: '3-pointers off the dribble still inconsistent',
      goalAchievement: 'partial',
      achievementReason: 'Standing shots are solid but moving shots need work',
      todayLearning: 'A higher release point improves accuracy',
      nextChallenge: 'Practice 50 moving shots every day',
      selfRating: 4, formations: [], createdAt: NOW,
    },
    {
      id: 's2', date: d(3), practiceType: 'solo', duration: 90,
      todayGoal: 'Improve left-hand ball handling',
      condition: 3, motivation: 4,
      menus: ['Ball handling', 'Dribble drills', 'Layups'],
      didWell: 'Crossover speed improved',
      struggled: 'Sustained left-hand dribbling is tough',
      goalAchievement: 'achieved',
      achievementReason: 'Focused 1 hour of solid handling drills',
      todayLearning: 'Consistency matters — small daily gains add up',
      nextChallenge: 'Use a left-hand reverse layup in a game',
      selfRating: 5, formations: [], createdAt: NOW,
    },
    {
      id: 's3', date: d(7), practiceType: 'team', duration: 150,
      todayGoal: 'Improve team pick-and-roll coordination',
      condition: 5, motivation: 5,
      menus: ['Formations', '3-on-3', '5-on-5'],
      didWell: 'Great chemistry with the PG',
      struggled: 'Rotation timing was off',
      goalAchievement: 'partial',
      achievementReason: 'First half was great, second half footwork got sloppy when tired',
      todayLearning: 'Stick to the basics, especially when fatigued',
      nextChallenge: 'Add stamina training 3 times a week',
      selfRating: 3, formations: [], createdAt: NOW,
    },
  ]
  return [
    {
      id: 's1', date: d(1), practiceType: 'team', duration: 120,
      todayGoal: '3ポイントシュートのフォームを安定させる',
      condition: 4, motivation: 5,
      menus: ['シュート練習', 'フリースロー', '5on5'],
      didWell: 'キャッチ&シュートの精度が上がった',
      struggled: 'ドリブルからの3ポイントはまだ不安定',
      goalAchievement: 'partial',
      achievementReason: 'スタンディングは安定したが動きながらはまだ',
      todayLearning: 'リリースポイントを高くすると精度が上がる',
      nextChallenge: '動きながらのシュートを毎日50本練習する',
      selfRating: 4, formations: [], createdAt: NOW,
    },
    {
      id: 's2', date: d(3), practiceType: 'solo', duration: 90,
      todayGoal: '左手のボールハンドリングを改善する',
      condition: 3, motivation: 4,
      menus: ['ハンドリング', 'ドリブル練習', 'レイアップ'],
      didWell: 'クロスオーバーのスピードが上がった',
      struggled: '左手だけの長時間ドリブルがきつい',
      goalAchievement: 'achieved',
      achievementReason: '集中して1時間ひたすらハンドリング練習をした',
      todayLearning: '継続が大事。毎日少しずつが積み重なる',
      nextChallenge: '左手逆レイアップをゲームで1回使う',
      selfRating: 5, formations: [], createdAt: NOW,
    },
    {
      id: 's3', date: d(7), practiceType: 'team', duration: 150,
      todayGoal: 'チームのピック&ロールの連携を高める',
      condition: 5, motivation: 5,
      menus: ['フォーメーション', '3on3', '5on5'],
      didWell: 'PGとのコンビが息が合ってきた',
      struggled: 'ローテーションのタイミングがずれる',
      goalAchievement: 'partial',
      achievementReason: '前半は良かったが後半疲れてフットワークが雑になった',
      todayLearning: '疲れた時こそ基本を大切に',
      nextChallenge: 'スタミナトレーニングを週3回追加する',
      selfRating: 3, formations: [], createdAt: NOW,
    },
  ]
}

function getSampleGames(lang: string): GameRecord[] {
  if (lang === 'en') return [
    {
      id: 'g1', date: d(5), opponent: 'Riverside High', venue: 'City Gym',
      result: 'win', myScore: 68, opponentScore: 54,
      points: 18, rebounds: 7, assists: 4, steals: 2, turnovers: 1, blocks: 1,
      fgMade: 7, fgAttempts: 14, minutesPlayed: 32,
      goodPlays: '3 pick-and-roll scores. Active on the boards',
      badPlays: 'Turnovers concentrated in the first half',
      teamAnalysis: 'Fast break was effective. Need to polish set offense',
      nextGameFocus: 'Attack the left side aggressively',
      mentalReflection: 'Nervous early, but settled after the first score',
      selfRating: 4, quarterNotes: [], createdAt: NOW,
    },
    {
      id: 'g2', date: d(12), opponent: 'Westside Club', venue: 'Annex Gym',
      result: 'lose', myScore: 55, opponentScore: 62,
      points: 12, rebounds: 5, assists: 3, steals: 1, turnovers: 3, blocks: 0,
      fgMade: 5, fgAttempts: 13, minutesPlayed: 28,
      goodPlays: 'Maintained defensive intensity',
      badPlays: 'Kept giving up offensive rebounds. Panicked in Q3',
      teamAnalysis: 'Need better strategy against zone defense',
      nextGameFocus: 'Practice zone offense more',
      mentalReflection: 'Learned how to reset mentally when losing',
      selfRating: 3, quarterNotes: [], createdAt: NOW,
    },
  ]
  return [
    {
      id: 'g1', date: d(5), opponent: '○○高校', venue: '市民体育館',
      result: 'win', myScore: 68, opponentScore: 54,
      points: 18, rebounds: 7, assists: 4, steals: 2, turnovers: 1, blocks: 1,
      fgMade: 7, fgAttempts: 14, minutesPlayed: 32,
      goodPlays: 'ピック&ロールからの得点が3本決まった。リバウンドも積極的に取れた',
      badPlays: 'ターンオーバーが前半に集中した',
      teamAnalysis: '速攻は効果的だった。セットオフェンスの精度を上げたい',
      nextGameFocus: '左側のドライブを積極的に仕掛ける',
      mentalReflection: '序盤は緊張したが、最初の得点で落ち着けた',
      selfRating: 4, quarterNotes: [], createdAt: NOW,
    },
    {
      id: 'g2', date: d(12), opponent: '△△クラブ', venue: '第二体育館',
      result: 'lose', myScore: 55, opponentScore: 62,
      points: 12, rebounds: 5, assists: 3, steals: 1, turnovers: 3, blocks: 0,
      fgMade: 5, fgAttempts: 13, minutesPlayed: 28,
      goodPlays: 'ディフェンスの強度は高く保てた',
      badPlays: 'オフェンスリバウンドを取られ続けた。3Qに精神的に焦ってしまった',
      teamAnalysis: 'ゾーンディフェンスへの攻め方が課題',
      nextGameFocus: 'ゾーン攻略の練習を積む',
      mentalReflection: '負けている時の立て直し方を学んだ',
      selfRating: 3, quarterNotes: [], createdAt: NOW,
    },
  ]
}

function getSampleGoals(lang: string): Goal[] {
  if (lang === 'en') return [
    { id: 'goal1', type: 'short', category: 'skill', title: '3-point shooting rate above 35%', detail: 'Focus on catch-and-shoot practice', deadline: d(-30), progress: 60, isCompleted: false, createdAt: NOW },
    { id: 'goal2', type: 'long', category: 'physical', title: 'Build stamina for full 40 min games', detail: 'Run 3x/week + core training', deadline: d(-90), progress: 40, isCompleted: false, createdAt: NOW },
    { id: 'goal3', type: 'short', category: 'skill', title: 'Use left-hand layup in a game', detail: 'Practice 50 reps daily', deadline: d(-7), progress: 100, isCompleted: true, createdAt: NOW },
  ]
  return [
    { id: 'goal1', type: 'short', category: 'skill', title: '3ポイント成功率35%以上', detail: 'キャッチ&シュートを中心に練習', deadline: d(-30), progress: 60, isCompleted: false, createdAt: NOW },
    { id: 'goal2', type: 'long', category: 'physical', title: 'スタミナ強化 - 40分フル出場', detail: '週3回のランニングと体幹トレを継続', deadline: d(-90), progress: 40, isCompleted: false, createdAt: NOW },
    { id: 'goal3', type: 'short', category: 'skill', title: '左手レイアップをゲームで使う', detail: '自主練で毎日50本練習', deadline: d(-7), progress: 100, isCompleted: true, createdAt: NOW },
  ]
}

type Page = 'home' | 'calendar' | 'practice' | 'game' | 'goals' | 'skills' | 'formations'

interface Props {
  onSignIn: () => void
}

export function GuestPreview({ onSignIn }: Props) {
  const { lang, setLang, t } = useLanguage()
  const [page, setPage] = useState<Page>('home')
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  const sampleLogs = getSampleLogs(lang)
  const sampleGames = getSampleGames(lang)
  const sampleGoals = getSampleGoals(lang)

  const NAV_IDS: { id: Page; key: string; Icon: React.ElementType }[] = [
    { id: 'home',       key: 'nav.home',       Icon: Home },
    { id: 'calendar',   key: 'nav.calendar',   Icon: Calendar },
    { id: 'practice',   key: 'nav.practice',   Icon: BookOpen },
    { id: 'game',       key: 'nav.game',       Icon: Trophy },
    { id: 'goals',      key: 'nav.goals',      Icon: Target },
    { id: 'skills',     key: 'nav.skills',     Icon: BarChart2 },
    { id: 'formations', key: 'nav.formations', Icon: Clipboard },
  ]

  const renderContent = () => {
    if (page === 'home') {
      return (
        <Dashboard
          practiceLogs={sampleLogs}
          gameRecords={sampleGames}
          goals={sampleGoals}
          latestNextChallenge={sampleLogs[0].nextChallenge}
          onNavigate={(p) => {
            if (p === 'practice' || p === 'game' || p === 'goals' || p === 'skills' || p === 'formations') {
              setPage(p as Page)
            }
          }}
        />
      )
    }

    // 他のページは「サインアップで使える」プレビュー画面
    const pageInfo: Record<string, { icon: string; ja: string; en: string; desc_ja: string; desc_en: string }> = {
      practice: { icon: '📓', ja: '練習ノート', en: 'Practice Log', desc_ja: '毎回の練習を記録して成長を可視化', desc_en: 'Log every practice and track your growth' },
      game:     { icon: '🏆', ja: '試合記録',   en: 'Game Records', desc_ja: '試合のスタッツと振り返りを保存', desc_en: 'Save game stats and reflections' },
      goals:    { icon: '🎯', ja: '目標管理',   en: 'Goals',         desc_ja: '短期・長期目標を設定して進捗管理', desc_en: 'Set and track short & long-term goals' },
      skills:   { icon: '📊', ja: 'スキルチェック', en: 'Skill Check',  desc_ja: '22項目のスキルを自己評価して成長グラフ表示', desc_en: 'Rate 22 skills and see your growth graph' },
      formations: { icon: '🗂️', ja: '作戦ボード', en: 'Play Board',  desc_ja: 'フォーメーションを描いてチームで共有', desc_en: 'Draw plays and share with your team' },
      calendar: { icon: '📅', ja: 'カレンダー', en: 'Calendar',      desc_ja: '練習・試合をカレンダーで一覧表示', desc_en: 'View practice and games on a calendar' },
    }
    const info = pageInfo[page]

    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{info.icon}</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1E3A5F', marginBottom: 8, fontFamily: "'Klee One', cursive" }}>
          {lang === 'ja' ? info.ja : info.en}
        </h2>
        <p style={{ color: '#7A6E5F', fontSize: '0.9rem', marginBottom: 32, lineHeight: 1.7 }}>
          {lang === 'ja' ? info.desc_ja : info.desc_en}
        </p>
        <button
          onClick={() => setShowSignUpModal(true)}
          style={{
            backgroundColor: '#1E3A5F', color: 'white',
            padding: '14px 32px', borderRadius: 14,
            fontWeight: 700, fontSize: '0.95rem',
            boxShadow: '0 4px 16px rgba(30,58,95,0.25)',
            border: 'none', cursor: 'pointer',
          }}
        >
          {lang === 'ja' ? 'Googleでサインアップして使い始める' : 'Sign up with Google to get started'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E0D0' }}>
      <SpinningCursor />

      {/* サインアップバナー（上部固定） */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#1E3A5F',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', margin: 0 }}>
          {lang === 'ja' ? '👋 無料で使えます！サインアップで全機能を開放' : '👋 Free to use! Sign up to unlock all features'}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            style={{
              padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
              backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
            }}
          >
            {lang === 'ja' ? 'EN' : 'JA'}
          </button>
          <button
            onClick={() => setShowSignUpModal(true)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
              backgroundColor: '#E07B2A', color: 'white',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(224,123,42,0.4)',
            }}
          >
            {lang === 'ja' ? 'サインアップ' : 'Sign Up'}
          </button>
        </div>
      </div>

      {/* メインコンテンツ（バナー分の余白を追加） */}
      <main className="flex-1 overflow-y-auto pb-20" style={{ paddingTop: '48px' }}>
        <div key={page} className="max-w-md mx-auto px-4 pt-4 page-enter">
          {renderContent()}
        </div>
      </main>

      {/* ボトムナビ */}
      <nav
        className="fixed bottom-0 left-0 right-0"
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
                <span style={{ fontSize: '0.57rem', fontWeight: active ? 700 : 400 }}>
                  {t(key)}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* サインアップモーダル */}
      {showSignUpModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowSignUpModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px 24px 0 0',
              padding: '32px 24px 40px',
              width: '100%', maxWidth: 480,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSignUpModal(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer', color: '#A89F92',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏀</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1E1A14', marginBottom: 8, fontFamily: "'Klee One', cursive" }}>
                {lang === 'ja' ? 'Googleで無料サインアップ' : 'Sign up free with Google'}
              </h2>
              <p style={{ color: '#7A6E5F', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>
                {lang === 'ja'
                  ? '練習・試合・目標をクラウドに保存して\nどのデバイスからでもアクセスできます'
                  : 'Save your practice, games & goals to the cloud\nand access from any device'}
              </p>
            </div>

            <button
              onClick={onSignIn}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 24px', borderRadius: 14,
                backgroundColor: '#1E3A5F', color: 'white',
                fontSize: '0.95rem', fontWeight: 700,
                boxShadow: '0 4px 16px rgba(30,58,95,0.3)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {lang === 'ja' ? 'Googleでサインアップ' : 'Sign up with Google'}
            </button>

            <p style={{ textAlign: 'center', color: '#C8BFB2', fontSize: '0.7rem', marginTop: 16 }}>
              {lang === 'ja' ? '完全無料・クレジットカード不要' : 'Completely free · No credit card needed'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

