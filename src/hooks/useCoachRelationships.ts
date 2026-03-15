import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CoachRelationship } from '../types'

function rowToRelationship(r: Record<string, unknown>): CoachRelationship {
  return {
    id:          r.id as string,
    playerId:    r.player_id as string,
    coachId:     r.coach_id as string | null,
    token:       r.token as string,
    status:      r.status as CoachRelationship['status'],
    coachName:   r.coach_name as string | null,
    createdAt:   r.created_at as string,
    expiresAt:   r.expires_at as string,
    acceptedAt:  r.accepted_at as string | null,
  }
}

export function useCoachRelationships(userId: string | null) {
  const [myCoaches,   setMyCoaches]   = useState<CoachRelationship[]>([])
  const [myAthletes,  setMyAthletes]  = useState<CoachRelationship[]>([])
  const [loading,     setLoading]     = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const [coachRes, athleteRes] = await Promise.all([
      // 自分が選手として持つコーチ一覧
      supabase
        .from('coach_relationships')
        .select('*')
        .eq('player_id', userId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false }),
      // 自分がコーチとして担当している選手一覧
      supabase
        .from('coach_relationships')
        .select('*')
        .eq('coach_id', userId)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false }),
    ])

    if (coachRes.data)   setMyCoaches(coachRes.data.map(rowToRelationship))
    if (athleteRes.data) setMyAthletes(athleteRes.data.map(rowToRelationship))
    setLoading(false)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  // 招待リンク（URL）を生成して返す
  const createInvite = useCallback(async (): Promise<string> => {
    if (!userId) throw new Error('Not logged in')

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('coach_relationships').insert({
      player_id:  userId,
      token,
      status:    'pending',
      expires_at: expiresAt,
    })
    if (error) throw error

    await refresh()
    return `${window.location.origin}?invite=${token}`
  }, [userId, refresh])

  // トークンを使ってコーチとして承認
  const acceptInvite = useCallback(async (
    token: string,
    coachName: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!userId) return { ok: false, error: 'Not logged in' }

    // 自己招待ガード
    const { data: row } = await supabase
      .from('coach_relationships')
      .select('player_id, status, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (!row) return { ok: false, error: 'invite.expired' }
    if (row.player_id === userId) return { ok: false, error: 'invite.selfError' }
    if (row.status !== 'pending') return { ok: false, error: 'invite.expired' }
    if (new Date(row.expires_at) < new Date()) return { ok: false, error: 'invite.expired' }

    const { error } = await supabase
      .from('coach_relationships')
      .update({
        coach_id:    userId,
        coach_name:  coachName,
        status:      'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (error) return { ok: false, error: error.message }
    await refresh()
    return { ok: true }
  }, [userId, refresh])

  // コーチ関係を取り消す
  const revokeCoach = useCallback(async (relationshipId: string): Promise<void> => {
    await supabase
      .from('coach_relationships')
      .update({ status: 'revoked' })
      .eq('id', relationshipId)
    await refresh()
  }, [refresh])

  return { myCoaches, myAthletes, loading, createInvite, acceptInvite, revokeCoach, refresh }
}
