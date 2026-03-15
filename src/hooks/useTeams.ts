import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Team, TeamMember, TeamWithRole } from '../types'

function rowToTeam(r: Record<string, unknown>): Team {
  return {
    id:          r.id as string,
    name:        r.name as string,
    createdBy:   r.created_by as string,
    inviteToken: r.invite_token as string,
    createdAt:   r.created_at as string,
  }
}

function rowToMember(r: Record<string, unknown>): TeamMember {
  return {
    id:       r.id as string,
    teamId:   r.team_id as string,
    userId:   r.user_id as string,
    role:     r.role as TeamMember['role'],
    joinedAt: r.joined_at as string,
  }
}

export function useTeams(userId: string | null) {
  const [myTeams, setMyTeams] = useState<TeamWithRole[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    // 参加中チームのIDとroleを取得
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', userId)

    if (!memberships || memberships.length === 0) {
      setMyTeams([])
      setLoading(false)
      return
    }

    const teamIds = memberships.map(m => m.team_id as string)

    // チーム情報を取得
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .order('created_at', { ascending: false })

    if (!teams) { setMyTeams([]); setLoading(false); return }

    // メンバー数を取得
    const { data: allMembers } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)

    const memberCountMap: Record<string, number> = {}
    if (allMembers) {
      for (const m of allMembers) {
        const tid = m.team_id as string
        memberCountMap[tid] = (memberCountMap[tid] ?? 0) + 1
      }
    }

    const roleMap: Record<string, 'coach' | 'player'> = {}
    for (const m of memberships) {
      roleMap[m.team_id as string] = m.role as 'coach' | 'player'
    }

    setMyTeams(teams.map(t => ({
      ...rowToTeam(t as Record<string, unknown>),
      myRole:      roleMap[t.id as string] ?? 'player',
      memberCount: memberCountMap[t.id as string] ?? 0,
    })))
    setLoading(false)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  // チームを作成（自分がcoach）
  const createTeam = useCallback(async (name: string): Promise<Team> => {
    if (!userId) throw new Error('Not logged in')

    const inviteToken = crypto.randomUUID()
    const { data: team, error } = await supabase
      .from('teams')
      .insert({ name, created_by: userId, invite_token: inviteToken })
      .select()
      .single()
    if (error || !team) throw error ?? new Error('Failed to create team')

    // 自分をcoachとして追加
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role:    'coach',
    })

    await refresh()
    return rowToTeam(team as Record<string, unknown>)
  }, [userId, refresh])

  // 招待トークンでチームに参加
  const joinTeam = useCallback(async (
    inviteToken: string,
  ): Promise<{ ok: boolean; error?: string; teamName?: string }> => {
    if (!userId) return { ok: false, error: 'Not logged in' }

    const { data: team } = await supabase
      .from('teams')
      .select('id, name')
      .eq('invite_token', inviteToken)
      .maybeSingle()

    if (!team) return { ok: false, error: 'invite.expired' }

    // 既にメンバーでないか確認
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) { await refresh(); return { ok: true, teamName: team.name as string } }

    const { error } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role:    'player',
    })
    if (error) return { ok: false, error: error.message }

    await refresh()
    return { ok: true, teamName: team.name as string }
  }, [userId, refresh])

  // チームから退出
  const leaveTeam = useCallback(async (teamId: string): Promise<void> => {
    if (!userId) return
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)
    await refresh()
  }, [userId, refresh])

  // チームメンバー一覧取得
  const getTeamMembers = useCallback(async (teamId: string): Promise<TeamMember[]> => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true })
    return (data ?? []).map(r => rowToMember(r as Record<string, unknown>))
  }, [])

  // 招待トークンを再生成
  const resetInviteToken = useCallback(async (teamId: string): Promise<string> => {
    const newToken = crypto.randomUUID()
    await supabase
      .from('teams')
      .update({ invite_token: newToken })
      .eq('id', teamId)
    await refresh()
    return `${window.location.origin}?team=${newToken}`
  }, [refresh])

  // メンバーを除名（コーチ専用）
  const kickMember = useCallback(async (teamId: string, targetUserId: string): Promise<void> => {
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', targetUserId)
    await refresh()
  }, [refresh])

  // 記録をチームに共有
  const shareRecord = useCallback(async (
    recordId: string,
    recordType: 'practice' | 'game',
    teamId: string,
  ): Promise<void> => {
    if (!userId) return
    await supabase.from('team_shared_records').upsert({
      record_id:   recordId,
      record_type: recordType,
      team_id:     teamId,
      player_id:   userId,
    })
  }, [userId])

  // チームへの共有を解除
  const unshareRecord = useCallback(async (
    recordId: string,
    recordType: 'practice' | 'game',
    teamId: string,
  ): Promise<void> => {
    await supabase
      .from('team_shared_records')
      .delete()
      .eq('record_id', recordId)
      .eq('record_type', recordType)
      .eq('team_id', teamId)
  }, [])

  // チームに共有されたrecord_idの一覧
  const getSharedRecords = useCallback(async (
    teamId: string,
    recordType: 'practice' | 'game',
  ): Promise<string[]> => {
    const { data } = await supabase
      .from('team_shared_records')
      .select('record_id')
      .eq('team_id', teamId)
      .eq('record_type', recordType)
    return (data ?? []).map(r => r.record_id as string)
  }, [])

  return {
    myTeams, loading, refresh,
    createTeam, joinTeam, leaveTeam,
    getTeamMembers, resetInviteToken, kickMember,
    shareRecord, unshareRecord, getSharedRecords,
  }
}
