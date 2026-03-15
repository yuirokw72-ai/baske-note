// ===== コーチFB（共通） =====
export interface CoachFeedback {
  goodPoints: string
  improvements: string
  nextInstruction: string
  coachName: string
  date: string
}

// ===== 練習ノート =====
export type GoalAchievement = 'achieved' | 'partial' | 'not_achieved'

export interface FormationNote {
  name: string
  courtType?: CourtType
  category?: FormationCategory
  players?: PlayerPos[]
  arrows?: DiagramArrow[]
  wentWell: string
  challenge: string
}

export type PracticeType = 'team' | 'solo'

export interface PracticeLog {
  id: string
  date: string
  practiceType?: PracticeType

  // 練習前
  todayGoal: string
  condition: number
  motivation: number

  // 練習内容
  duration: number
  menus: string[]
  didWell: string
  struggled: string
  formations?: FormationNote[]

  // 振り返り
  goalAchievement: GoalAchievement
  achievementReason: string
  todayLearning: string
  nextChallenge: string
  selfRating: number

  // コーチFB
  coachFeedback?: CoachFeedback

  createdAt: string
}

// ===== 試合記録 =====
export type GameResult = 'win' | 'lose' | 'draw'

export interface QuarterNote {
  quarter: 1 | 2 | 3 | 4
  note: string
}

export interface GameRecord {
  id: string
  date: string
  opponent: string
  venue: string
  result: GameResult
  myScore: number
  opponentScore: number

  // 個人スタッツ
  points: number
  rebounds: number
  assists: number
  steals: number
  turnovers: number
  blocks: number
  fgMade: number
  fgAttempts: number
  minutesPlayed: number

  // 振り返り
  quarterNotes: QuarterNote[]
  goodPlays: string
  badPlays: string
  teamAnalysis: string
  nextGameFocus: string
  mentalReflection: string
  selfRating: number

  // コーチFB
  coachFeedback?: CoachFeedback

  createdAt: string
}

// ===== 目標管理 =====
export type GoalType = 'short' | 'long'
export type GoalCategory = 'skill' | 'physical' | 'mental' | 'team' | 'other'

export interface Goal {
  id: string
  title: string
  detail: string
  type: GoalType
  category: GoalCategory
  deadline: string
  progress: number
  isCompleted: boolean
  createdAt: string
}

// ===== 技術チェック（スコアのみ保存） =====
export type SkillCategory = 'offense' | 'defense' | 'physical' | 'iq'

export interface SkillRecord {
  id: string
  level: number       // 0=未評価, 1-5
  lastUpdated: string
}

// ===== フォーメーション図 =====
export type ArrowType = 'pass' | 'cut' | 'screen' | 'dribble' | 'handoff'
export type CourtType = 'half' | 'full'
export type FormationCategory = 'offense' | 'defense'

export interface PlayerPos {
  id: string   // 'o1'-'o5' (offense), 'd1'-'d5' (defense)
  x: number    // 0-1 normalized
  y: number    // 0-1 normalized
  hasBall?: boolean
}

export interface DiagramArrow {
  id: string
  type: ArrowType
  x1: number; y1: number
  x2: number; y2: number
  cx?: number; cy?: number   // 二次ベジェ曲線の制御点（省略時は直線）
  step?: number              // 同時再生グループ番号（同じ番号 = 同時に動く）
}

export interface Formation {
  id: string
  name: string
  courtType: CourtType
  category: FormationCategory
  players: PlayerPos[]
  arrows: DiagramArrow[]
  createdAt: string
}

// ===== ユーザープロフィール =====
export type AgeGroup = 'elementary' | 'junior' | 'high' | 'adult'
export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | '未設定'

export interface UserProfile {
  name: string
  team: string
  position: Position
  ageGroup: AgeGroup
  createdAt: string
}
