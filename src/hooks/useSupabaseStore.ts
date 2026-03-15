import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { PracticeLog, GameRecord, Goal, SkillRecord, Formation } from '../types'

// ===== Initial skill records (same as useStore) =====
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

interface StoreState {
  loading: boolean
  practiceLogs: PracticeLog[]
  gameRecords: GameRecord[]
  goals: Goal[]
  skillRecords: SkillRecord[]
  formations: Formation[]
}

export function useSupabaseStore(userId: string) {
  const [state, setState] = useState<StoreState>({
    loading: true,
    practiceLogs:  [],
    gameRecords:   [],
    goals:         [],
    skillRecords:  INITIAL_SKILL_RECORDS,
    formations:    [],
  })

  // ===== Initial data load =====
  useEffect(() => {
    if (!userId) return

    const load = async () => {
      const [
        { data: pl },
        { data: gr },
        { data: g },
        { data: sr },
        { data: f },
      ] = await Promise.all([
        supabase.from('practice_logs').select('data').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('game_records').select('data').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('goals').select('data').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('skill_records').select('data').eq('user_id', userId).maybeSingle(),
        supabase.from('formations').select('data').eq('user_id', userId).order('created_at', { ascending: false }),
      ])

      setState({
        loading:      false,
        practiceLogs: (pl ?? []).map((r: { data: PracticeLog }) => r.data),
        gameRecords:  (gr ?? []).map((r: { data: GameRecord }) => r.data),
        goals:        (g  ?? []).map((r: { data: Goal }) => r.data),
        skillRecords: sr?.data ?? INITIAL_SKILL_RECORDS,
        formations:   (f  ?? []).map((r: { data: Formation }) => r.data),
      })
    }

    load()
  }, [userId])

  // ===== Practice Logs =====
  const addPracticeLog = useCallback(async (log: Omit<PracticeLog, 'id' | 'createdAt'>) => {
    const newLog: PracticeLog = { ...log, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, practiceLogs: [newLog, ...prev.practiceLogs] }))
    await supabase.from('practice_logs').insert({ id: newLog.id, user_id: userId, data: newLog, created_at: newLog.createdAt })
    return newLog
  }, [userId])

  const updatePracticeLog = useCallback(async (id: string, updates: Partial<PracticeLog>) => {
    setState(prev => {
      const updated = prev.practiceLogs.map(l => l.id === id ? { ...l, ...updates } : l)
      const log = updated.find(l => l.id === id)
      if (log) supabase.from('practice_logs').update({ data: log }).eq('id', id).eq('user_id', userId)
      return { ...prev, practiceLogs: updated }
    })
  }, [userId])

  const deletePracticeLog = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, practiceLogs: prev.practiceLogs.filter(l => l.id !== id) }))
    await supabase.from('practice_logs').delete().eq('id', id).eq('user_id', userId)
  }, [userId])

  // ===== Game Records =====
  const addGameRecord = useCallback(async (record: Omit<GameRecord, 'id' | 'createdAt'>) => {
    const newRecord: GameRecord = { ...record, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, gameRecords: [newRecord, ...prev.gameRecords] }))
    await supabase.from('game_records').insert({ id: newRecord.id, user_id: userId, data: newRecord, created_at: newRecord.createdAt })
    return newRecord
  }, [userId])

  const updateGameRecord = useCallback(async (id: string, updates: Partial<GameRecord>) => {
    setState(prev => {
      const updated = prev.gameRecords.map(r => r.id === id ? { ...r, ...updates } : r)
      const record = updated.find(r => r.id === id)
      if (record) supabase.from('game_records').update({ data: record }).eq('id', id).eq('user_id', userId)
      return { ...prev, gameRecords: updated }
    })
  }, [userId])

  const deleteGameRecord = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, gameRecords: prev.gameRecords.filter(r => r.id !== id) }))
    await supabase.from('game_records').delete().eq('id', id).eq('user_id', userId)
  }, [userId])

  // ===== Goals =====
  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = { ...goal, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, goals: [newGoal, ...prev.goals] }))
    await supabase.from('goals').insert({ id: newGoal.id, user_id: userId, data: newGoal, created_at: newGoal.createdAt })
    return newGoal
  }, [userId])

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    setState(prev => {
      const updated = prev.goals.map(g => g.id === id ? { ...g, ...updates } : g)
      const goal = updated.find(g => g.id === id)
      if (goal) supabase.from('goals').update({ data: goal }).eq('id', id).eq('user_id', userId)
      return { ...prev, goals: updated }
    })
  }, [userId])

  const deleteGoal = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))
    await supabase.from('goals').delete().eq('id', id).eq('user_id', userId)
  }, [userId])

  // ===== Skill Records =====
  const updateSkillLevel = useCallback(async (id: string, level: number) => {
    setState(prev => {
      const updated = prev.skillRecords.map(s =>
        s.id === id ? { ...s, level, lastUpdated: new Date().toISOString() } : s
      )
      supabase.from('skill_records').upsert({
        user_id: userId, data: updated, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      return { ...prev, skillRecords: updated }
    })
  }, [userId])

  // ===== Formations =====
  const addFormation = useCallback((f: Omit<Formation, 'id' | 'createdAt'>): Formation => {
    const nf: Formation = { ...f, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setState(prev => ({ ...prev, formations: [nf, ...prev.formations] }))
    // fire-and-forget to Supabase
    supabase.from('formations').insert({ id: nf.id, user_id: userId, data: nf, created_at: nf.createdAt })
    return nf
  }, [userId])

  const updateFormation = useCallback(async (id: string, updates: Partial<Formation>) => {
    setState(prev => {
      const updated = prev.formations.map(f => f.id === id ? { ...f, ...updates } : f)
      const formation = updated.find(f => f.id === id)
      if (formation) supabase.from('formations').update({ data: formation }).eq('id', id).eq('user_id', userId)
      return { ...prev, formations: updated }
    })
  }, [userId])

  const deleteFormation = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, formations: prev.formations.filter(f => f.id !== id) }))
    await supabase.from('formations').delete().eq('id', id).eq('user_id', userId)
  }, [userId])

  // ===== Helper =====
  const getLatestNextChallenge = useCallback((): string =>
    state.practiceLogs.length > 0 ? state.practiceLogs[0].nextChallenge ?? '' : ''
  , [state.practiceLogs])

  return {
    loading: state.loading,
    practiceLogs:  state.practiceLogs,
    gameRecords:   state.gameRecords,
    goals:         state.goals,
    skillRecords:  state.skillRecords,
    profile:       null,   // profile stays in localStorage via lib/profile.ts
    formations:    state.formations,
    setProfile:    () => {},
    addPracticeLog, updatePracticeLog, deletePracticeLog,
    addGameRecord, updateGameRecord, deleteGameRecord,
    addGoal, updateGoal, deleteGoal,
    updateSkillLevel,
    addFormation, updateFormation, deleteFormation,
    getLatestNextChallenge,
  }
}
