import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { PracticeLog, GameRecord, CoachFeedback } from '../types'

// コーチが担当選手の記録を取得・フィードバック更新するフック
export function useCoachStore() {
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([])
  const [gameRecords,  setGameRecords]  = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 担当選手の記録を取得（RLSにより担当コーチのみ可）
  const fetchAthleteRecords = useCallback(async (athleteUserId: string) => {
    setLoading(true)
    const [plRes, grRes] = await Promise.all([
      supabase
        .from('practice_logs')
        .select('id, data, created_at')
        .eq('user_id', athleteUserId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('game_records')
        .select('id, data, created_at')
        .eq('user_id', athleteUserId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setPracticeLogs(
      (plRes.data ?? []).map(r => ({ ...(r.data as PracticeLog), id: r.id as string }))
    )
    setGameRecords(
      (grRes.data ?? []).map(r => ({ ...(r.data as GameRecord), id: r.id as string }))
    )
    setLoading(false)
  }, [])

  // コーチFBを安全に更新（coachFeedbackフィールドだけ差し替え）
  const updateCoachFeedback = useCallback(async (
    table: 'practice_logs' | 'game_records',
    recordId: string,
    athleteUserId: string,
    feedback: CoachFeedback,
  ): Promise<void> => {
    // 1. 現在のデータを取得（RLSで担当コーチのみ可）
    const { data: row, error } = await supabase
      .from(table)
      .select('data')
      .eq('id', recordId)
      .eq('user_id', athleteUserId)
      .single()

    if (error || !row) throw error ?? new Error('Record not found')

    // 2. coachFeedbackだけ差し替え（他フィールドは絶対に触らない）
    const updated = {
      ...(row.data as Record<string, unknown>),
      coachFeedback: { ...feedback, readAt: undefined },
    }

    // 3. 書き戻し
    const { error: updateError } = await supabase
      .from(table)
      .update({ data: updated })
      .eq('id', recordId)
      .eq('user_id', athleteUserId)

    if (updateError) throw updateError

    // ローカル状態更新
    if (table === 'practice_logs') {
      setPracticeLogs(prev => prev.map(l =>
        l.id === recordId ? { ...l, coachFeedback: feedback } : l
      ))
    } else {
      setGameRecords(prev => prev.map(g =>
        g.id === recordId ? { ...g, coachFeedback: feedback } : g
      ))
    }
  }, [])

  return { practiceLogs, gameRecords, loading, fetchAthleteRecords, updateCoachFeedback }
}
