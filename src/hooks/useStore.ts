import { useLocalStorage } from './useLocalStorage'
import type { PracticeLog, GameRecord, Goal, SkillRecord, UserProfile, Formation } from '../types'

const INITIAL_SKILL_RECORDS: SkillRecord[] = [
  { id: 'sk_drive',        level: 0, lastUpdated: '' },
  { id: 'sk_mid',          level: 0, lastUpdated: '' },
  { id: 'sk_three',        level: 0, lastUpdated: '' },
  { id: 'sk_ft',           level: 0, lastUpdated: '' },
  { id: 'sk_layup_strong', level: 0, lastUpdated: '' },
  { id: 'sk_layup_weak',   level: 0, lastUpdated: '' },
  { id: 'sk_pass',         level: 0, lastUpdated: '' },
  { id: 'sk_offball',      level: 0, lastUpdated: '' },
  { id: 'sk_1on1d',        level: 0, lastUpdated: '' },
  { id: 'sk_helpd',        level: 0, lastUpdated: '' },
  { id: 'sk_boxout',       level: 0, lastUpdated: '' },
  { id: 'sk_reb',          level: 0, lastUpdated: '' },
  { id: 'sk_footwork',     level: 0, lastUpdated: '' },
  { id: 'sk_speed',        level: 0, lastUpdated: '' },
  { id: 'sk_stamina',      level: 0, lastUpdated: '' },
  { id: 'sk_strength',     level: 0, lastUpdated: '' },
  { id: 'sk_jump',         level: 0, lastUpdated: '' },
  { id: 'sk_decision',     level: 0, lastUpdated: '' },
  { id: 'sk_vision',       level: 0, lastUpdated: '' },
  { id: 'sk_comm',         level: 0, lastUpdated: '' },
  { id: 'sk_clutch',       level: 0, lastUpdated: '' },
  { id: 'sk_mental',       level: 0, lastUpdated: '' },
]

export function useStore() {
  const [practiceLogs, setPracticeLogs] = useLocalStorage<PracticeLog[]>('practiceLogs', [])
  const [gameRecords, setGameRecords]   = useLocalStorage<GameRecord[]>('gameRecords', [])
  const [goals, setGoals]               = useLocalStorage<Goal[]>('goals', [])
  const [skillRecords, setSkillRecords] = useLocalStorage<SkillRecord[]>('skillRecords', INITIAL_SKILL_RECORDS)
  const [profile, setProfile]           = useLocalStorage<UserProfile | null>('userProfile', null)
  const [formations, setFormations]     = useLocalStorage<Formation[]>('formations', [])

  const addPracticeLog = (log: Omit<PracticeLog, 'id' | 'createdAt'>) => {
    const newLog: PracticeLog = { ...log, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setPracticeLogs(prev => [newLog, ...prev])
    return newLog
  }
  const updatePracticeLog = (id: string, updates: Partial<PracticeLog>) =>
    setPracticeLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  const deletePracticeLog = (id: string) =>
    setPracticeLogs(prev => prev.filter(l => l.id !== id))

  const addGameRecord = (record: Omit<GameRecord, 'id' | 'createdAt'>) => {
    const newRecord: GameRecord = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setGameRecords(prev => [newRecord, ...prev])
    return newRecord
  }
  const updateGameRecord = (id: string, updates: Partial<GameRecord>) =>
    setGameRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  const deleteGameRecord = (id: string) =>
    setGameRecords(prev => prev.filter(r => r.id !== id))

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = { ...goal, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setGoals(prev => [newGoal, ...prev])
    return newGoal
  }
  const updateGoal = (id: string, updates: Partial<Goal>) =>
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
  const deleteGoal = (id: string) =>
    setGoals(prev => prev.filter(g => g.id !== id))

  const updateSkillLevel = (id: string, level: number) =>
    setSkillRecords(prev =>
      prev.map(s => s.id === id ? { ...s, level, lastUpdated: new Date().toISOString() } : s)
    )

  const addFormation = (f: Omit<Formation, 'id' | 'createdAt'>) => {
    const nf: Formation = { ...f, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setFormations(prev => [nf, ...prev])
    return nf
  }
  const updateFormation = (id: string, updates: Partial<Formation>) =>
    setFormations(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  const deleteFormation = (id: string) =>
    setFormations(prev => prev.filter(f => f.id !== id))

  const getLatestNextChallenge = (): string =>
    practiceLogs.length > 0 ? practiceLogs[0].nextChallenge ?? '' : ''

  return {
    practiceLogs, gameRecords, goals, skillRecords, profile, formations,
    setProfile,
    addPracticeLog, updatePracticeLog, deletePracticeLog,
    addGameRecord, updateGameRecord, deleteGameRecord,
    addGoal, updateGoal, deleteGoal,
    updateSkillLevel,
    addFormation, updateFormation, deleteFormation,
    getLatestNextChallenge,
  }
}
