import { useState, useEffect } from 'react'
import { ChevronRight, BookOpen, Trophy } from 'lucide-react'
import type { PracticeLog, GameRecord, Goal, PracticeType } from '../types'
import { useLanguage } from '../contexts/LanguageContext'
import { getProfile } from '../lib/profile'
import { AthleteModal } from '../components/AthleteModal'
import type { useCoachRelationships } from '../hooks/useCoachRelationships'
import type { useTeams } from '../hooks/useTeams'
import { supabase } from '../lib/supabase'

interface Props {
  practiceLogs: PracticeLog[]
  gameRecords: GameRecord[]
  goals: Goal[]
  latestNextChallenge: string
  onNavigate: (page: string) => void
  coachRelationships: ReturnType<typeof useCoachRelationships>
  teams: ReturnType<typeof useTeams>
}

function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function Dashboard({ practiceLogs, gameRecords, goals, latestNextChallenge, onNavigate, coachRelationships, teams }: Props) {
  const { t, lang } = useLanguage()
  const { motto } = getProfile()
  const [athleteModal, setAthleteModal] = useState<{ userId: string; name: string } | null>(null)
  // 選手名キャッシュ: userId → display_name
  const [athleteNames, setAthleteNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const ids = coachRelationships.myAthletes.map(cr => cr.playerId)
    if (ids.length === 0) return
    supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        data.forEach(r => { map[r.user_id] = r.display_name })
        setAthleteNames(map)
      })
  }, [coachRelationships.myAthletes])

  const recent      = practiceLogs[0]
  const recentGame  = gameRecords[0]
  const activeGoals = goals.filter(g => !g.isCompleted)
  const wins        = gameRecords.filter(g => g.result === 'win').length
  const streak = (() => {
    let s = 0; const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (practiceLogs.some(l => l.date === ds)) s++; else break
    }
    return s
  })()

  const hasAthletes  = coachRelationships.myAthletes.length > 0
  const isTeamCoach  = teams.myTeams.some(t => t.myRole === 'coach')
  const hasCoachFB   = practiceLogs.some(l => l.coachFeedback && !l.coachFeedback.readAt) ||
                       gameRecords.some(g => g.coachFeedback && !g.coachFeedback.readAt)

  return (
    <div className="space-y-4">
      {athleteModal && (
        <AthleteModal
          athleteUserId={athleteModal.userId}
          athleteName={athleteModal.name}
          onClose={() => setAthleteModal(null)}
        />
      )}

      {/* ヘッダーバナー */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ backgroundColor: '#1E3A5F' }}>
        {/* diagonal pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)',
        }} />

        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{t('dash.tagline')}</p>
        <h1 className="text-2xl font-bold font-klee text-white mb-3">{t('dash.appTitle')}</h1>

        {/* 座右の銘（読み取り専用 — 設定から変更） */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: '10px' }}>
          <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {lang === 'ja' ? '✒️ 座右の銘' : '✒️ Motto'}
          </p>
          {motto ? (
            <p style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.9rem',
              fontFamily: "'Klee One', cursive",
              fontStyle: 'italic',
              lineHeight: 1.75,
              margin: 0,
            }}>
              {motto}
            </p>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              {lang === 'ja' ? '設定から座右の銘を追加できます' : 'Add your motto in Settings'}
            </p>
          )}
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('dash.stat.practice'), value: practiceLogs.length, color: '#E07B2A', sub: t('dash.streak').replace('{n}', String(streak)) },
          { label: t('dash.stat.games'),   value: gameRecords.length,  color: '#1E3A5F', sub: t('dash.wins').replace('{n}', String(wins)) },
          { label: t('dash.stat.goals'),   value: goals.filter(g=>g.isCompleted).length, color: '#2E7D52', sub: t('dash.remaining').replace('{n}', String(activeGoals.length)) },
        ].map(s => (
          <div key={s.label} className="nb-card-plain text-center">
            <p className="text-2xl font-bold font-klee" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#1E1A14' }}>{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#A89F92' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 前回の課題 */}
      {latestNextChallenge && (
        <div className="nb-card-plain" style={{ borderLeft: '3px solid #E07B2A', paddingLeft: '16px' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#E07B2A' }}>{t('dash.challenge')}</p>
          <p className="text-sm" style={{ color: '#1E1A14' }}>{latestNextChallenge}</p>
        </div>
      )}

      {/* 直近の練習 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('dash.recentPractice')}</h2>
          <button onClick={() => onNavigate('practice')} className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#E07B2A' }}>
            {t('dash.seeAll')} <ChevronRight size={14} />
          </button>
        </div>
        {recent ? (
          <div className="nb-card" onClick={() => onNavigate('practice')} style={{ cursor: 'pointer' }}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs" style={{ color: '#A89F92' }}>{fmtDate(recent.date)} · {recent.duration}{t('dash.minUnit')}</p>
                  {recent.practiceType && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{
                        backgroundColor: recent.practiceType === 'team' ? 'rgba(30,58,95,0.1)' : 'rgba(224,123,42,0.1)',
                        color: (recent.practiceType as PracticeType) === 'team' ? '#1E3A5F' : '#E07B2A',
                      }}>
                      {t(`pn.type.${recent.practiceType}`)}
                    </span>
                  )}
                </div>
                <p className="font-semibold truncate" style={{ color: '#1E1A14' }}>{recent.todayGoal}</p>
              </div>
              <span className="ml-2 text-base font-bold" style={{
                color: recent.goalAchievement === 'achieved' ? '#2E7D52' : recent.goalAchievement === 'partial' ? '#E07B2A' : '#DC3545'
              }}>
                {recent.goalAchievement === 'achieved' ? '○' : recent.goalAchievement === 'partial' ? '△' : '×'}
              </span>
            </div>
            {recent.todayLearning && (
              <p className="text-sm mt-2 pt-2" style={{ color: '#7A6E5F', borderTop: '1px solid rgba(195,175,148,0.35)' }}>
                💡 {recent.todayLearning}
              </p>
            )}
          </div>
        ) : (
          <div className="nb-card text-center py-8" style={{ cursor: 'pointer' }} onClick={() => onNavigate('practice')}>
            <BookOpen size={28} style={{ color: '#C8BFB2', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: '#A89F92' }}>{t('dash.noNote')}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: '#E07B2A' }}>{t('dash.addNote')}</p>
          </div>
        )}
      </section>

      {/* 直近の試合 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('dash.recentGame')}</h2>
          <button onClick={() => onNavigate('game')} className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#E07B2A' }}>
            {t('dash.seeAll')} <ChevronRight size={14} />
          </button>
        </div>
        {recentGame ? (
          <div className="nb-card" onClick={() => onNavigate('game')} style={{ cursor: 'pointer' }}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs mb-1" style={{ color: '#A89F92' }}>{fmtDate(recentGame.date)} vs {recentGame.opponent}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-klee" style={{ color: '#1E1A14' }}>{recentGame.myScore}</span>
                  <span style={{ color: '#C8BFB2' }}>—</span>
                  <span className="text-2xl font-bold font-klee" style={{ color: '#1E1A14' }}>{recentGame.opponentScore}</span>
                </div>
              </div>
              <span className="text-sm font-bold px-3 py-1.5 rounded-xl"
                    style={{
                      backgroundColor: recentGame.result === 'win' ? 'rgba(46,125,82,0.1)' : recentGame.result === 'lose' ? 'rgba(220,53,69,0.08)' : 'rgba(195,175,148,0.2)',
                      color: recentGame.result === 'win' ? '#2E7D52' : recentGame.result === 'lose' ? '#DC3545' : '#7A6E5F',
                    }}>
                {recentGame.result === 'win' ? t('dash.win') : recentGame.result === 'lose' ? t('dash.lose') : t('dash.draw')}
              </span>
            </div>
            <div className="flex gap-3 mt-3 pt-2 text-center" style={{ borderTop: '1px solid rgba(195,175,148,0.4)' }}>
              {([[t('dash.stat.pts'), recentGame.points], ['RB', recentGame.rebounds], ['AS', recentGame.assists], ['ST', recentGame.steals]] as [string, number][]).map(([l,v]) => (
                <div key={l} className="flex-1">
                  <p className="text-lg font-bold font-klee" style={{ color: '#1E1A14' }}>{v}</p>
                  <p className="text-xs" style={{ color: '#A89F92' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="nb-card text-center py-8" style={{ cursor: 'pointer' }} onClick={() => onNavigate('game')}>
            <Trophy size={28} style={{ color: '#C8BFB2', margin: '0 auto 8px' }} />
            <p className="text-sm" style={{ color: '#A89F92' }}>{t('dash.noGame')}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: '#E07B2A' }}>{t('dash.addGame')}</p>
          </div>
        )}
      </section>

      {/* 目標 */}
      {activeGoals.length > 0 && (
        <section className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold font-klee" style={{ color: '#1E3A5F' }}>{t('dash.activeGoals')}</h2>
            <button onClick={() => onNavigate('goals')} className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#E07B2A' }}>
              {t('dash.seeAll')} <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {activeGoals.slice(0, 2).map(g => (
              <div key={g.id} className="nb-card" onClick={() => onNavigate('goals')} style={{ cursor: 'pointer' }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1E1A14' }}>{g.title}</p>
                  <span className="text-xs ml-2 font-bold" style={{ color: '#E07B2A' }}>{g.progress}%</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgba(195,175,148,0.3)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${g.progress}%`, background: 'linear-gradient(90deg, #E07B2A, #C4520D)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* コーチからのFB通知 */}
      {hasCoachFB && (
        <div
          className="nb-card"
          style={{ borderLeft: '3px solid #1E3A5F', cursor: 'pointer' }}
          onClick={() => onNavigate('practice')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E3A5F' }}>
              🏀 {lang === 'ja' ? 'コーチからのFBがあります' : 'You have new coach feedback'}
            </p>
            <span style={{ fontSize: '0.78rem', color: '#E07B2A', fontWeight: 600 }}>
              {lang === 'ja' ? '確認する →' : 'Review →'}
            </span>
          </div>
        </div>
      )}

      {/* 担当選手・チームコーチセクション */}
      {(hasAthletes || isTeamCoach) && (
        <section className="pb-2">
          <h2 className="font-bold font-klee mb-2" style={{ color: '#1E3A5F' }}>
            {lang === 'ja' ? '担当選手・チーム' : 'My Athletes & Teams'}
          </h2>

          {/* 個人担当選手 */}
          {hasAthletes && (
            <div className="nb-card mb-2">
              <p style={{ fontSize: '0.72rem', color: '#A89F92', marginBottom: 8, fontWeight: 600 }}>
                {lang === 'ja' ? '👤 個人担当' : '👤 Personal Athletes'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {coachRelationships.myAthletes.map(cr => {
                  const displayName = athleteNames[cr.playerId] ||
                    (lang === 'ja' ? `選手 (${cr.playerId.slice(0, 6)})` : `Athlete (${cr.playerId.slice(0, 6)})`)
                  return (
                    <button
                      key={cr.id}
                      onClick={() => setAthleteModal({ userId: cr.playerId, name: displayName })}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 10px', borderRadius: 10,
                        background: 'rgba(195,175,148,0.15)', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#1E1A14', fontWeight: 500 }}>
                        👤 {displayName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#E07B2A' }}>→</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* チームコーチ */}
          {isTeamCoach && (
            <div className="nb-card">
              <p style={{ fontSize: '0.72rem', color: '#A89F92', marginBottom: 8, fontWeight: 600 }}>
                {lang === 'ja' ? '🏀 チームコーチ' : '🏀 Team Coach'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teams.myTeams.filter(t => t.myRole === 'coach').map(team => (
                  <button
                    key={team.id}
                    onClick={() => onNavigate('formations')}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 10,
                      background: 'rgba(195,175,148,0.15)', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: '#1E1A14', fontWeight: 500 }}>
                      👑 {team.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#E07B2A' }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
