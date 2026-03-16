import { useState } from 'react'
import { Home, Calendar, BookOpen, Trophy, Target, BarChart2, Clipboard, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { SpinningCursor } from '../components/SpinningCursor'
import { Dashboard } from './Dashboard'
import { PracticeNote } from './PracticeNote'
import { GameRecordPage } from './GameRecord'
import { GoalsPage } from './Goals'
import { SkillCheck } from './SkillCheck'
import { FormationsPage } from './FormationsPage'
import { CalendarPage } from './Calendar'
import type { PracticeLog, GameRecord, Goal, SkillRecord, Formation } from '../types'

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

function getSampleSkills(): SkillRecord[] {
  const levels: [string, number][] = [
    ['sk_drive', 4], ['sk_mid', 3], ['sk_three', 4], ['sk_ft', 3],
    ['sk_layup_strong', 4], ['sk_layup_weak', 2], ['sk_pass', 3], ['sk_offball', 3],
    ['sk_1on1d', 2], ['sk_helpd', 2], ['sk_boxout', 3], ['sk_reb', 3],
    ['sk_footwork', 3], ['sk_speed', 4], ['sk_stamina', 2], ['sk_strength', 3], ['sk_jump', 3],
    ['sk_decision', 3], ['sk_vision', 3], ['sk_comm', 2], ['sk_clutch', 3], ['sk_mental', 3],
  ]
  return levels.map(([id, level]) => ({ id, level, lastUpdated: NOW }))
}

function getSampleFormations(lang: string): Formation[] {
  return [
    {
      id: 'sf1',
      name: lang === 'en' ? 'Pick & Roll Pattern A' : 'ピック&ロール Aパターン',
      courtType: 'half',
      category: 'offense',
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
      ],
      createdAt: NOW,
    },
    {
      id: 'sf2',
      name: lang === 'en' ? '2-3 Zone Defense' : '2-3ゾーンDF',
      courtType: 'half',
      category: 'defense',
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
      ],
      createdAt: NOW,
    },
  ]
}

type Page = 'home' | 'calendar' | 'practice' | 'game' | 'goals' | 'skills' | 'formations'
type ViewMode = 'player' | 'coach'

interface Props {
  onSignIn: () => void
}

// ===== コーチビュー（6ページ対応） =====
type CoachPage = 'home' | 'calendar' | 'practice' | 'game' | 'goals' | 'formations'

function CoachPreview({ lang, onSignUp }: { lang: string; onSignUp: () => void }) {
  const [coachPage, setCoachPage] = useState<CoachPage>('home')

  const ja = lang === 'ja'

  // モックデータ
  const athletes = ja
    ? [
        { name: '田中 翼', color: '#E07B2A', sessions: 3, pending: true },
        { name: '鈴木 陸', color: '#1E3A5F', sessions: 2, pending: false },
        { name: '山田 蒼', color: '#2E7D32', sessions: 1, pending: true },
      ]
    : [
        { name: 'T. Tanaka', color: '#E07B2A', sessions: 3, pending: true },
        { name: 'R. Suzuki', color: '#1E3A5F', sessions: 2, pending: false },
        { name: 'A. Yamada', color: '#2E7D32', sessions: 1, pending: true },
      ]

  const practices = ja
    ? [
        { athlete: '田中 翼', color: '#E07B2A', date: '3/15', type: 'チーム練習', duration: 120, goal: '3ポイントシュートのフォームを安定させる', rating: 4, pending: true },
        { athlete: '鈴木 陸', color: '#1E3A5F', date: '3/14', type: '自主練',    duration: 90,  goal: '左手のボールハンドリングを改善する',   rating: 5, pending: false },
        { athlete: '山田 蒼', color: '#2E7D32', date: '3/11', type: 'チーム練習', duration: 150, goal: 'ピック&ロールの連携を高める',            rating: 3, pending: true },
        { athlete: '田中 翼', color: '#E07B2A', date: '3/10', type: '自主練',    duration: 60,  goal: 'フリースローの安定化',                   rating: 4, pending: false },
      ]
    : [
        { athlete: 'T. Tanaka', color: '#E07B2A', date: '3/15', type: 'Team',  duration: 120, goal: 'Stabilize 3-point form',       rating: 4, pending: true },
        { athlete: 'R. Suzuki', color: '#1E3A5F', date: '3/14', type: 'Solo',  duration: 90,  goal: 'Left-hand ball handling',      rating: 5, pending: false },
        { athlete: 'A. Yamada', color: '#2E7D32', date: '3/11', type: 'Team',  duration: 150, goal: 'Pick-and-roll coordination',   rating: 3, pending: true },
        { athlete: 'T. Tanaka', color: '#E07B2A', date: '3/10', type: 'Solo',  duration: 60,  goal: 'Consistent free throws',       rating: 4, pending: false },
      ]

  const games = ja
    ? [
        { athlete: '田中 翼', color: '#E07B2A', date: '3/10', opponent: '○○高校',    result: 'win',  pts: 18, ast: 4, reb: 7, rating: 4, pending: true },
        { athlete: '鈴木 陸', color: '#1E3A5F', date: '3/3',  opponent: '△△クラブ', result: 'lose', pts: 12, ast: 3, reb: 5, rating: 3, pending: false },
        { athlete: '山田 蒼', color: '#2E7D32', date: '2/25', opponent: '□□中学',   result: 'win',  pts: 8,  ast: 6, reb: 4, rating: 4, pending: true },
      ]
    : [
        { athlete: 'T. Tanaka', color: '#E07B2A', date: '3/10', opponent: 'Riverside',  result: 'win',  pts: 18, ast: 4, reb: 7, rating: 4, pending: true },
        { athlete: 'R. Suzuki', color: '#1E3A5F', date: '3/3',  opponent: 'Westside',   result: 'lose', pts: 12, ast: 3, reb: 5, rating: 3, pending: false },
        { athlete: 'A. Yamada', color: '#2E7D32', date: '2/25', opponent: 'Northgate',  result: 'win',  pts: 8,  ast: 6, reb: 4, rating: 4, pending: true },
      ]

  const teamGoals = ja
    ? [
        { title: '全員3ポイント成功率30%以上',        progress: 55, deadline: '4月末' },
        { title: 'チーム平均得点70点超え',             progress: 70, deadline: '3月末' },
      ]
    : [
        { title: 'Team 3PT% above 30%',               progress: 55, deadline: 'End of April' },
        { title: 'Team average score over 70pts',      progress: 70, deadline: 'End of March' },
      ]

  const formations = ja
    ? [
        { name: 'ピック&ロール Aパターン', category: 'オフェンス', updated: '3/14', players: 5 },
        { name: '2-3ゾーンDF',             category: 'ディフェンス', updated: '3/10', players: 5 },
        { name: 'ファストブレーク',        category: 'オフェンス', updated: '3/5',  players: 5 },
      ]
    : [
        { name: 'Pick & Roll Pattern A', category: 'Offense',  updated: '3/14', players: 5 },
        { name: '2-3 Zone Defense',      category: 'Defense',  updated: '3/10', players: 5 },
        { name: 'Fast Break',            category: 'Offense',  updated: '3/5',  players: 5 },
      ]

  // カレンダーデータ（3月の活動日）
  const today = new Date()
  const calData: Record<number, { name: string; color: string }[]> = {
    11: [athletes[0], athletes[2]], 12: [athletes[1]],
    13: [athletes[0]], 14: [athletes[1], athletes[2]],
    15: [athletes[0], athletes[1]], 16: [],
  }

  // ===== 共通スタイル =====
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    backgroundColor: 'white', borderRadius: 14, padding: '14px 16px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    border: '1px solid rgba(195,175,148,0.3)',
    ...extra,
  })
  const fbBadge = (pending: boolean) => pending ? (
    <span style={{ fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      backgroundColor: 'rgba(224,123,42,0.12)', color: '#E07B2A' }}>
      {ja ? 'FB待ち' : 'Pending'}
    </span>
  ) : (
    <span style={{ fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32' }}>
      {ja ? '済み' : 'Done'}
    </span>
  )

  // ===== 各ページ =====
  const renderPage = () => {
    switch (coachPage) {

      // ─── ホーム ───
      case 'home': return (
        <div>
          <div style={{ backgroundColor: '#1E3A5F', borderRadius: 16, padding: '16px 18px', marginBottom: 16, color: 'white' }}>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
              {ja ? 'コーチダッシュボード' : 'Coach Dashboard'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: "'Klee One', cursive" }}>
                  {ja ? 'チームA' : 'Team A'}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  👥 {ja ? `選手 ${athletes.length}名` : `${athletes.length} Athletes`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                  {ja ? 'FB待ち' : 'Awaiting FB'}
                </p>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#E07B2A', lineHeight: 1.2 }}>
                  {athletes.filter(a => a.pending).length}
                </p>
              </div>
            </div>
          </div>
          {/* 選手サマリー */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E3A5F', marginBottom: 10 }}>
            {ja ? '📋 選手サマリー' : '📋 Athlete Summary'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {athletes.map((a, i) => (
              <div key={i} style={{ ...card(), display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={onSignUp}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: a.color }}>
                    {a.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E1A14' }}>{a.name}</p>
                    <p style={{ fontSize: '0.7rem', color: '#A89F92' }}>{ja ? `今週 ${a.sessions}回練習` : `${a.sessions} sessions this week`}</p>
                  </div>
                </div>
                {fbBadge(a.pending)}
              </div>
            ))}
          </div>
          <div style={{ ...card({ backgroundColor: '#1E3A5F', marginTop: 16, cursor: 'pointer' }), textAlign: 'center' }} onClick={onSignUp}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>
              {ja ? '🏆 コーチとして登録する →' : '🏆 Join as a Coach →'}
            </p>
          </div>
        </div>
      )

      // ─── カレンダー ───
      case 'calendar': return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', fontFamily: "'Klee One', cursive" }}>
              {ja ? '3月 2025' : 'March 2025'}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {athletes.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: a.color }} />
                  <span style={{ fontSize: '0.65rem', color: '#7A6E5F' }}>{a.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 週グリッド */}
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {(ja ? ['日','月','火','水','木','金','土'] : ['Su','Mo','Tu','We','Th','Fr','Sa']).map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.62rem', color: '#A89F92', fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {/* 3月1日は土曜 → 6マス空ける */}
              {Array.from({ length: 6 }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1
                const dots = calData[day] ?? []
                const isToday = day === today.getDate() && today.getMonth() === 2
                return (
                  <div key={day} style={{ textAlign: 'center', padding: '4px 0' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', margin: '0 auto 2px',
                      backgroundColor: isToday ? '#1E3A5F' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.7rem', color: isToday ? 'white' : '#1E1A14', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', minHeight: 8 }}>
                      {dots.map((a, j) => (
                        <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: a.color }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* 今日の活動 */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E3A5F', marginBottom: 8 }}>
            {ja ? '📅 最近の活動' : '📅 Recent Activity'}
          </p>
          {practices.slice(0, 3).map((p, i) => (
            <div key={i} style={{ ...card({ marginBottom: 8 }), display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onSignUp}>
              <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, backgroundColor: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E1A14' }}>{p.athlete}</span>
                  <span style={{ fontSize: '0.7rem', color: '#A89F92' }}>{p.date}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#7A6E5F' }}>{p.type} · {p.duration}min</p>
              </div>
            </div>
          ))}
        </div>
      )

      // ─── 練習 ───
      case 'practice': return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', fontFamily: "'Klee One', cursive" }}>
              {ja ? '📓 チームの練習記録' : '📓 Team Practice Records'}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {practices.map((p, i) => (
              <div key={i} style={{ ...card({ borderLeft: `4px solid ${p.color}`, cursor: 'pointer' }), }} onClick={onSignUp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E1A14' }}>{p.athlete}</span>
                    <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#A89F92' }}>{p.date} · {p.type} {p.duration}min</span>
                  </div>
                  {fbBadge(p.pending)}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#5A5248', marginBottom: 8 }}>🎯 {p.goal}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <div key={j} style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: j < p.rating ? '#E07B2A' : '#E8E0D0' }} />
                  ))}
                </div>
                {p.pending && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: '#F5F0E8', border: '1px dashed rgba(224,123,42,0.3)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#A89F92' }}>💬 {ja ? 'フィードバックを追加…' : 'Add feedback…'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )

      // ─── 試合 ───
      case 'game': return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', fontFamily: "'Klee One', cursive" }}>
              {ja ? '🏀 チームの試合記録' : '🏀 Team Game Records'}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {games.map((g, i) => (
              <div key={i} style={{ ...card({ borderLeft: `4px solid ${g.result === 'win' ? '#2E7D32' : '#DC3545'}`, cursor: 'pointer' }) }} onClick={onSignUp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E1A14' }}>{g.athlete}</span>
                    <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#A89F92' }}>{g.date} vs {g.opponent}</span>
                  </div>
                  {fbBadge(g.pending)}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#5A5248' }}>
                  <span>🏆 {g.pts}pts</span>
                  <span>🤝 {g.ast}ast</span>
                  <span>💪 {g.reb}reb</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: g.result === 'win' ? '#2E7D32' : '#DC3545' }}>
                    {ja ? (g.result === 'win' ? '勝利' : '敗北') : (g.result === 'win' ? 'WIN' : 'LOSE')}
                  </span>
                </div>
                {g.pending && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, backgroundColor: '#F5F0E8', border: '1px dashed rgba(224,123,42,0.3)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#A89F92' }}>💬 {ja ? '試合へのフィードバックを追加…' : 'Add game feedback…'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )

      // ─── 目標 ───
      case 'goals': return (
        <div>
          {/* チーム目標 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', fontFamily: "'Klee One', cursive" }}>
              🎯 {ja ? 'チーム目標' : 'Team Goals'}
            </h2>
            <button onClick={onSignUp} style={{ backgroundColor: '#E07B2A', color: 'white', border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
              + {ja ? '追加' : 'Add'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {teamGoals.map((g, i) => (
              <div key={i} style={{ ...card({ cursor: 'pointer' }) }} onClick={onSignUp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E1A14', flex: 1, marginRight: 8 }}>{g.title}</p>
                  <span style={{ fontSize: '0.7rem', color: '#A89F92', flexShrink: 0 }}>📅 {g.deadline}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, backgroundColor: '#E8E0D0', borderRadius: 3 }}>
                    <div style={{ width: `${g.progress}%`, height: '100%', backgroundColor: '#E07B2A', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E07B2A', flexShrink: 0 }}>{g.progress}%</span>
                </div>
              </div>
            ))}
          </div>
          {/* 個人目標 */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E3A5F', marginBottom: 10 }}>
            {ja ? '👤 個人目標（閲覧のみ）' : '👤 Individual Goals (read-only)'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { athlete: athletes[0], title: ja ? '3ポイント成功率35%以上' : '3PT% above 35%', progress: 60 },
              { athlete: athletes[1], title: ja ? '左手レイアップをゲームで使う' : 'Left-hand layup in game', progress: 100 },
              { athlete: athletes[2], title: ja ? 'スタミナ強化・40分フル出場' : 'Stamina for full 40min', progress: 40 },
            ].map((item, i) => (
              <div key={i} style={{ ...card({ cursor: 'pointer' }) }} onClick={onSignUp}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.athlete.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: '#A89F92' }}>{item.athlete.name}</span>
                  <span style={{ fontSize: '0.78rem', color: '#1E1A14', fontWeight: 600, flex: 1 }}>{item.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, backgroundColor: '#E8E0D0', borderRadius: 3 }}>
                    <div style={{ width: `${item.progress}%`, height: '100%', backgroundColor: item.athlete.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#A89F92' }}>{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

      // ─── 作戦 ───
      case 'formations': return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A5F', fontFamily: "'Klee One', cursive" }}>
              📋 {ja ? 'チーム作戦' : 'Team Plays'}
            </h2>
            <button onClick={onSignUp} style={{ backgroundColor: '#1E3A5F', color: 'white', border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
              + {ja ? '作戦追加' : 'New Play'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formations.map((f, i) => (
              <div key={i} style={{ ...card({ cursor: 'pointer' }) }} onClick={onSignUp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* ミニコートアイコン */}
                    <div style={{ width: 44, height: 28, borderRadius: 6, backgroundColor: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem' }}>📋</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E1A14' }}>{f.name}</p>
                      <p style={{ fontSize: '0.7rem', color: '#A89F92' }}>
                        {f.category} · {ja ? `選手${f.players}名` : `${f.players} players`} · {ja ? `更新 ${f.updated}` : `Updated ${f.updated}`}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#A89F92' }}>›</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '16px', backgroundColor: '#F5F0E8', borderRadius: 14, border: '1px dashed rgba(30,58,95,0.2)' }}>
            <p style={{ fontSize: '0.78rem', color: '#5A5248', lineHeight: 1.6 }}>
              {ja
                ? '🔒 登録するとコーチが作戦を作成・管理でき、チームの選手全員に共有されます。'
                : '🔒 Sign up to create and manage plays that are shared with all team members.'}
            </p>
            <button onClick={onSignUp} style={{ marginTop: 10, width: '100%', backgroundColor: '#1E3A5F', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
              {ja ? '登録して作戦を作る →' : 'Sign up to create plays →'}
            </button>
          </div>
        </div>
      )
    }
  }

  // ===== コーチナビ =====
  const COACH_NAV: { id: CoachPage; emoji: string; label: { ja: string; en: string } }[] = [
    { id: 'home',       emoji: '🏠', label: { ja: 'ホーム',       en: 'Home'     } },
    { id: 'calendar',   emoji: '📅', label: { ja: 'カレンダー',   en: 'Calendar' } },
    { id: 'practice',   emoji: '📓', label: { ja: '練習',         en: 'Practice' } },
    { id: 'game',       emoji: '🏀', label: { ja: '試合',         en: 'Game'     } },
    { id: 'goals',      emoji: '🎯', label: { ja: '目標',         en: 'Goals'    } },
    { id: 'formations', emoji: '📋', label: { ja: '作戦',         en: 'Plays'    } },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 88px)' }}>
      {/* コンテンツ */}
      <div key={coachPage} style={{ flex: 1, paddingBottom: 72 }} className="page-enter">
        {renderPage()}
      </div>

      {/* コーチ専用ボトムナビ */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0F2340',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex' }}>
          {COACH_NAV.map(({ id, emoji, label }) => {
            const active = coachPage === id
            return (
              <button key={id} onClick={() => setCoachPage(id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '6px 0 4px', gap: 1, border: 'none', background: 'transparent',
                  color: active ? '#E07B2A' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', position: 'relative',
                }}>
                {active && (
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, borderRadius: '0 0 3px 3px', background: '#E07B2A' }} />
                )}
                <span style={{ fontSize: '1rem' }}>{emoji}</span>
                <span style={{ fontSize: '0.52rem', fontWeight: active ? 700 : 400 }}>{label[lang as 'ja' | 'en'] ?? label.ja}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function GuestPreview({ onSignIn }: Props) {
  const { lang, setLang, t } = useLanguage()
  const [page, setPage] = useState<Page>('home')
  const [viewMode, setViewMode] = useState<ViewMode>('player')
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  const sampleLogs = getSampleLogs(lang)
  const sampleGames = getSampleGames(lang)
  const sampleGoals = getSampleGoals(lang)
  const sampleSkills = getSampleSkills()
  const sampleFormations = getSampleFormations(lang)

  const signUp = () => setShowSignUpModal(true)

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
    const guestTeams = { myTeams: [], loading: false, refresh: async () => {}, createTeam: async () => { throw 0 }, joinTeam: async () => ({ ok: false as const }), leaveTeam: async () => {}, getTeamMembers: async () => [], resetInviteToken: async () => '', kickMember: async () => {}, shareRecord: async () => {}, unshareRecord: async () => {}, getSharedRecords: async () => [] }
    const guestCoachRel = { myCoaches: [], myAthletes: [], loading: false, createInvite: async () => '', acceptInvite: async () => ({ ok: false as const }), revokeCoach: async () => {}, refresh: async () => {} }

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
          coachRelationships={guestCoachRel}
          teams={guestTeams}
        />
      )
    }

    if (page === 'calendar') {
      return (
        <CalendarPage
          practiceLogs={sampleLogs}
          gameRecords={sampleGames}
          onNavigate={(p) => {
            if (p === 'practice' || p === 'game') setPage(p as Page)
          }}
        />
      )
    }

    if (page === 'practice') {
      return (
        <PracticeNote
          logs={sampleLogs}
          latestNextChallenge={sampleLogs[0].nextChallenge}
          onAdd={() => { signUp(); return Promise.resolve({} as PracticeLog) }}
          onUpdate={() => signUp()}
          onDelete={() => signUp()}
          onAddFormation={() => signUp()}
          teams={guestTeams}
        />
      )
    }

    if (page === 'game') {
      return (
        <GameRecordPage
          records={sampleGames}
          onAdd={() => { signUp(); return Promise.resolve({} as GameRecord) }}
          onUpdate={() => signUp()}
          onDelete={() => signUp()}
          teams={guestTeams}
        />
      )
    }

    if (page === 'goals') {
      return (
        <GoalsPage
          goals={sampleGoals}
          onAdd={() => signUp()}
          onUpdate={() => signUp()}
          onDelete={() => signUp()}
        />
      )
    }

    if (page === 'skills') {
      return (
        <SkillCheck
          skillRecords={sampleSkills}
          onUpdate={() => signUp()}
        />
      )
    }

    if (page === 'formations') {
      return (
        <FormationsPage
          formations={sampleFormations}
          onAdd={() => {
            signUp()
            return { id: '__signup__', name: '', courtType: 'half' as const, category: 'offense' as const, players: [], arrows: [], createdAt: '' }
          }}
          onUpdate={() => signUp()}
          onDelete={() => signUp()}
          teams={guestTeams}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E0D0' }}>
      <SpinningCursor />

      {/* サインアップバナー（上部固定） */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: '#1E3A5F',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', margin: 0,
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {lang === 'ja' ? '👋 無料で使えます！サインアップで全機能を開放' : '👋 Free to use! Sign up to unlock all features'}
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            style={{
              padding: '3px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
              backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {lang === 'ja' ? 'EN' : 'JA'}
          </button>
          <button
            onClick={onSignIn}
            style={{
              padding: '6px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
              backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {lang === 'ja' ? 'ログイン' : 'Log In'}
          </button>
          <button
            onClick={() => setShowSignUpModal(true)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
              backgroundColor: '#E07B2A', color: 'white',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(224,123,42,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            {lang === 'ja' ? '登録' : 'Sign Up'}
          </button>
        </div>
      </div>

      {/* 選手 / コーチ タブ */}
      <div style={{
        position: 'fixed', top: '48px', left: 0, right: 0, zIndex: 49,
        backgroundColor: '#16305A',
        padding: '6px 16px',
        display: 'flex', gap: 6,
      }}>
        {(['player', 'coach'] as ViewMode[]).map(mode => {
          const active = viewMode === mode
          const label = mode === 'player'
            ? (lang === 'ja' ? '🏃 選手モード' : '🏃 Player')
            : (lang === 'ja' ? '📋 コーチモード' : '📋 Coach')
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 10,
                fontSize: '0.75rem', fontWeight: 700,
                backgroundColor: active ? '#E07B2A' : 'rgba(255,255,255,0.1)',
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* メインコンテンツ（バナー + タブ分の余白） */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: '88px',
          paddingBottom: viewMode === 'coach' ? '16px' : '80px',
        }}
      >
        <div key={`${page}-${viewMode}`} className="max-w-md mx-auto px-4 pt-4 page-enter">
          {viewMode === 'coach'
            ? <CoachPreview lang={lang} onSignUp={() => setShowSignUpModal(true)} />
            : renderContent()
          }
        </div>
      </main>

      {/* ボトムナビ - 選手モード時のみ表示 */}
      {viewMode === 'player' && (
        <nav
          className="fixed bottom-0 left-0 right-0"
          style={{
            backgroundColor: '#1E3A5F',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.25)',
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
                  style={{ color: active ? '#E07B2A' : 'rgba(255,255,255,0.65)' }}
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
      )}

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
              position: 'relative',
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
