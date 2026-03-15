import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import type { Formation, PlayerPos, DiagramArrow, ArrowType, CourtType } from '../types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from '../contexts/LanguageContext'

// ===== Court dimensions =====
const CW = 300
const CH_HALF = 260
const CH_FULL = 520

// ===== Court colors =====
const COURT_BG   = '#D4A574'
const COURT_LINE = 'rgba(255,255,255,0.9)'
const PAINT_BG   = 'rgba(0,0,0,0.12)'

// ===== Arrow styles =====
const ARROW_STYLE: Record<ArrowType, { color: string; dash?: string }> = {
  pass:    { color: '#1E3A5F', dash: '8,4'       },
  cut:     { color: '#E07B2A', dash: undefined    },
  screen:  { color: '#2E7D52', dash: undefined    },
  dribble: { color: '#DC3545', dash: '4,3'        },
  handoff: { color: '#7B2FA0', dash: '10,3,2,3'  },
}

// ===== Step group colors (cycles 1→5) =====
const STEP_COLORS = ['#1E3A5F', '#2E7D52', '#E07B2A', '#7B2FA0', '#DC3545']
function stepColor(step: number): string {
  return STEP_COLORS[(step - 1) % STEP_COLORS.length]
}

// ===== Tool mode =====
type Tool = 'select' | ArrowType | 'delete'

// ===== Default positions per player =====
const DEFAULT_POS_HALF: Record<string, PlayerPos> = {
  o1: { id: 'o1', x: 0.500, y: 0.840, hasBall: true },
  o2: { id: 'o2', x: 0.800, y: 0.650 },
  o3: { id: 'o3', x: 0.200, y: 0.650 },
  o4: { id: 'o4', x: 0.860, y: 0.320 },
  o5: { id: 'o5', x: 0.140, y: 0.320 },
  d1: { id: 'd1', x: 0.500, y: 0.720 },
  d2: { id: 'd2', x: 0.730, y: 0.560 },
  d3: { id: 'd3', x: 0.270, y: 0.560 },
  d4: { id: 'd4', x: 0.790, y: 0.280 },
  d5: { id: 'd5', x: 0.210, y: 0.280 },
}
const DEFAULT_POS_FULL: Record<string, PlayerPos> = {
  o1: { id: 'o1', x: 0.500, y: 0.916, hasBall: true },
  o2: { id: 'o2', x: 0.800, y: 0.829 },
  o3: { id: 'o3', x: 0.200, y: 0.829 },
  o4: { id: 'o4', x: 0.880, y: 0.677 },
  o5: { id: 'o5', x: 0.120, y: 0.677 },
  d1: { id: 'd1', x: 0.500, y: 0.861 },
  d2: { id: 'd2', x: 0.730, y: 0.788 },
  d3: { id: 'd3', x: 0.270, y: 0.788 },
  d4: { id: 'd4', x: 0.790, y: 0.659 },
  d5: { id: 'd5', x: 0.210, y: 0.659 },
}

function getDefaultPos(pid: string, courtType: CourtType): PlayerPos {
  return courtType === 'half' ? DEFAULT_POS_HALF[pid] : DEFAULT_POS_FULL[pid]
}

// ===== SVG coord helpers =====
function toSVG(x: number, y: number, courtH: number): [number, number] {
  return [x * CW, y * courtH]
}
function fromSVG(svgX: number, svgY: number, courtH: number): [number, number] {
  return [svgX / CW, svgY / courtH]
}

// ===== Game state type =====
interface GameState {
  players: PlayerPos[]
  ballPos: { x: number; y: number } | null
}

// ===== Apply one arrow to a mutable game state =====
function applyArrow(
  current: PlayerPos[],
  ballPos: { x: number; y: number } | null,
  arrow: DiagramArrow
): { ballPos: { x: number; y: number } | null } {
  const pIdx = current.findIndex(p => Math.hypot(p.x - arrow.x1, p.y - arrow.y1) < 0.08)
  if (arrow.type === 'cut' || arrow.type === 'screen') {
    if (pIdx !== -1) current[pIdx] = { ...current[pIdx], x: arrow.x2, y: arrow.y2 }
  } else if (arrow.type === 'dribble') {
    if (pIdx !== -1) {
      current[pIdx] = { ...current[pIdx], x: arrow.x2, y: arrow.y2 }
      ballPos = { x: arrow.x2, y: arrow.y2 }
    }
  } else if (arrow.type === 'pass') {
    ballPos = { x: arrow.x2, y: arrow.y2 }
  } else if (arrow.type === 'handoff') {
    if (pIdx !== -1) {
      current[pIdx] = { ...current[pIdx], x: arrow.x2, y: arrow.y2 }
      ballPos = { x: arrow.x2, y: arrow.y2 }
    }
  }
  return { ballPos }
}

// ===== Compute live positions (editor: applies all arrows in order) =====
function computeLivePositions(initialPlayers: PlayerPos[], arrows: DiagramArrow[]): GameState {
  const current = initialPlayers.map(p => ({ ...p }))
  const ballHolder = current.find(p => p.hasBall) ?? current.find(p => p.id.startsWith('o'))
  let ballPos: { x: number; y: number } | null = ballHolder
    ? { x: ballHolder.x, y: ballHolder.y }
    : null

  for (const arrow of arrows) {
    const result = applyArrow(current, ballPos, arrow)
    ballPos = result.ballPos
  }
  return { players: current, ballPos }
}

// ===== Group arrows by step number for simultaneous animation =====
// Arrows with the same step number form a group (play simultaneously).
// Arrows without a step number each form their own single-arrow group.
// Groups are ordered by first appearance in the arrows array.
function groupArrowsByStep(arrows: DiagramArrow[]): DiagramArrow[][] {
  const result: DiagramArrow[][] = []
  const stepIndexMap = new Map<number, number>()

  for (const arrow of arrows) {
    if (arrow.step === undefined || arrow.step === null) {
      result.push([arrow])
    } else {
      if (stepIndexMap.has(arrow.step)) {
        result[stepIndexMap.get(arrow.step)!].push(arrow)
      } else {
        stepIndexMap.set(arrow.step, result.length)
        result.push([arrow])
      }
    }
  }
  return result
}

// ===== Compute animation states with step grouping =====
// states[i] = game state just BEFORE group[i] runs
// states[groups.length] = final state after all groups
function computeAnimStatesGrouped(
  initialPlayers: PlayerPos[],
  arrows: DiagramArrow[]
): { groups: DiagramArrow[][]; states: GameState[] } {
  const groups = groupArrowsByStep(arrows)
  const states: GameState[] = []
  const current = initialPlayers.map(p => ({ ...p }))
  const ballHolder = current.find(p => p.hasBall) ?? current.find(p => p.id.startsWith('o'))
  let ballPos: { x: number; y: number } | null = ballHolder
    ? { x: ballHolder.x, y: ballHolder.y }
    : null

  // Snapshot before first group
  states.push({ players: current.map(p => ({ ...p })), ballPos: ballPos ? { ...ballPos } : null })

  for (const group of groups) {
    // Apply all arrows in the group to advance to next state
    for (const arrow of group) {
      const result = applyArrow(current, ballPos, arrow)
      ballPos = result.ballPos
    }
    states.push({ players: current.map(p => ({ ...p })), ballPos: ballPos ? { ...ballPos } : null })
  }
  return { groups, states }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// ===== Quadratic bezier point at parameter t =====
function bezierPoint(
  t: number,
  x1: number, y1: number,
  cx: number | undefined, cy: number | undefined,
  x2: number, y2: number
): { x: number; y: number } {
  if (cx !== undefined && cy !== undefined) {
    const mt = 1 - t
    return {
      x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
      y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
    }
  }
  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }
}

// ===== SVG path string for rendering arrows =====
function bezierPathD(
  sx: number, sy: number,
  cpx: number, cpy: number,
  ex: number, ey: number,
  isCurved: boolean
): string {
  return isCurved
    ? `M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}`
    : `M${sx},${sy} L${ex},${ey}`
}

function bezierEndTangent(cpx: number, cpy: number, ex: number, ey: number): [number, number] {
  return [ex - cpx, ey - cpy]
}

// Wavy dribble path
function wavyPath(
  x1: number, y1: number,
  x2: number, y2: number,
  cpx?: number, cpy?: number
): string {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return `M${x1},${y1}L${x2},${y2}`
  const nx = -dy / len * 5, ny = dx / len * 5
  const steps = Math.max(3, Math.round(len / 18))
  let d = `M${x1},${y1}`
  for (let i = 0; i < steps; i++) {
    const t1 = (i + 0.5) / steps
    const t2 = (i + 1.0) / steps
    const sign = i % 2 === 0 ? 1 : -1
    let bx1: number, by1: number, bx2: number, by2: number
    if (cpx !== undefined && cpy !== undefined) {
      bx1 = (1-t1)*(1-t1)*x1 + 2*(1-t1)*t1*cpx + t1*t1*x2
      by1 = (1-t1)*(1-t1)*y1 + 2*(1-t1)*t1*cpy + t1*t1*y2
      bx2 = (1-t2)*(1-t2)*x1 + 2*(1-t2)*t2*cpx + t2*t2*x2
      by2 = (1-t2)*(1-t2)*y1 + 2*(1-t2)*t2*cpy + t2*t2*y2
    } else {
      bx1 = x1 + dx * t1; by1 = y1 + dy * t1
      bx2 = x1 + dx * t2; by2 = y1 + dy * t2
    }
    d += ` Q${bx1 + nx * sign},${by1 + ny * sign} ${bx2},${by2}`
  }
  return d
}

// Screen end bar
function screenBar(x1: number, y1: number, x2: number, y2: number, len = 10): string {
  const dx = x2 - x1, dy = y2 - y1
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d < 1) return ''
  const nx = -dy / d * len, ny = dx / d * len
  return `M${x2 - nx},${y2 - ny} L${x2 + nx},${y2 + ny}`
}

// ===== Half-Court SVG =====
function HalfCourt() {
  return (
    <g>
      <rect width={CW} height={CH_HALF} fill={COURT_BG} />
      <rect x={8} y={8} width={CW - 16} height={CH_HALF - 16} fill="none" stroke={COURT_LINE} strokeWidth={2} />
      <rect x={120} y={10} width={60} height={5} fill={COURT_LINE} rx={1} />
      <circle cx={150} cy={28} r={9} fill="none" stroke="#E07B2A" strokeWidth={2.5} />
      <path d="M130,28 A20,20 0 0 1 170,28" fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <rect x={106} y={8} width={88} height={109} fill={PAINT_BG} stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={106} y1={117} x2={194} y2={117} stroke={COURT_LINE} strokeWidth={1.5} />
      <path d="M117,117 A33,33 0 0 0 183,117" fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <path d="M117,117 A33,33 0 0 1 183,117" fill="none" stroke={COURT_LINE} strokeWidth={1.5} strokeDasharray="4,3" />
      <line x1={29} y1={8} x2={29} y2={73} stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={271} y1={8} x2={271} y2={73} stroke={COURT_LINE} strokeWidth={1.5} />
      <path d="M29,73 A131,131 0 0 0 271,73" fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={8} y1={CH_HALF - 8} x2={CW - 8} y2={CH_HALF - 8} stroke={COURT_LINE} strokeWidth={1.5} strokeDasharray="6,4" opacity={0.5} />
    </g>
  )
}

// ===== Full-Court SVG =====
function FullCourt() {
  const mid = CH_FULL / 2
  return (
    <g>
      <rect width={CW} height={CH_FULL} fill={COURT_BG} />
      <rect x={8} y={8} width={CW - 16} height={CH_FULL - 16} fill="none" stroke={COURT_LINE} strokeWidth={2} />
      <line x1={8} y1={mid} x2={CW - 8} y2={mid} stroke={COURT_LINE} strokeWidth={1.5} />
      <circle cx={150} cy={mid} r={33} fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <circle cx={150} cy={mid} r={4}  fill={COURT_LINE} />
      <rect x={120} y={10} width={60} height={5} fill={COURT_LINE} rx={1} />
      <circle cx={150} cy={28} r={9} fill="none" stroke="#E07B2A" strokeWidth={2.5} />
      <path d="M130,28 A20,20 0 0 1 170,28" fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <rect x={106} y={8} width={88} height={109} fill={PAINT_BG} stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={106} y1={117} x2={194} y2={117} stroke={COURT_LINE} strokeWidth={1.5} />
      <path d="M117,117 A33,33 0 0 0 183,117" fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <path d="M117,117 A33,33 0 0 1 183,117" fill="none" stroke={COURT_LINE} strokeWidth={1.5} strokeDasharray="4,3" />
      <line x1={29} y1={8} x2={29} y2={73} stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={271} y1={8} x2={271} y2={73} stroke={COURT_LINE} strokeWidth={1.5} />
      <path d="M29,73 A131,131 0 0 0 271,73" fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <rect x={120} y={CH_FULL - 15} width={60} height={5} fill={COURT_LINE} rx={1} />
      <circle cx={150} cy={CH_FULL - 28} r={9} fill="none" stroke="#E07B2A" strokeWidth={2.5} />
      <path d={`M130,${CH_FULL-28} A20,20 0 0 0 170,${CH_FULL-28}`} fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <rect x={106} y={CH_FULL - 117} width={88} height={109} fill={PAINT_BG} stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={106} y1={CH_FULL - 117} x2={194} y2={CH_FULL - 117} stroke={COURT_LINE} strokeWidth={1.5} />
      <path d={`M117,${CH_FULL-117} A33,33 0 0 1 183,${CH_FULL-117}`} fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
      <path d={`M117,${CH_FULL-117} A33,33 0 0 0 183,${CH_FULL-117}`} fill="none" stroke={COURT_LINE} strokeWidth={1.5} strokeDasharray="4,3" />
      <line x1={29} y1={CH_FULL - 8} x2={29} y2={CH_FULL - 73} stroke={COURT_LINE} strokeWidth={1.5} />
      <line x1={271} y1={CH_FULL - 8} x2={271} y2={CH_FULL - 73} stroke={COURT_LINE} strokeWidth={1.5} />
      <path d={`M29,${CH_FULL-73} A131,131 0 0 1 271,${CH_FULL-73}`} fill="none" stroke={COURT_LINE} strokeWidth={1.5} />
    </g>
  )
}

// ===== Arrow Component =====
function ArrowSVG({ arrow, courtH, onDelete, canDelete }: {
  arrow: DiagramArrow
  courtH: number
  onDelete?: () => void
  canDelete?: boolean
}) {
  const [sx, sy] = toSVG(arrow.x1, arrow.y1, courtH)
  const [ex, ey] = toSVG(arrow.x2, arrow.y2, courtH)
  const style = ARROW_STYLE[arrow.type]
  const markerId = `ah-${arrow.type}`
  const isCurved = arrow.cx !== undefined && arrow.cy !== undefined
  const [cpx, cpy] = isCurved ? toSVG(arrow.cx!, arrow.cy!, courtH) : [(sx + ex) / 2, (sy + ey) / 2]

  const offset = 14
  let ex2 = ex, ey2 = ey
  if (isCurved) {
    const [tdx, tdy] = bezierEndTangent(cpx, cpy, ex, ey)
    const tlen = Math.sqrt(tdx * tdx + tdy * tdy)
    if (tlen > 1) { ex2 = ex - tdx / tlen * offset; ey2 = ey - tdy / tlen * offset }
  } else {
    const dx = ex - sx, dy = ey - sy
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > 20) { ex2 = ex - dx / len * offset; ey2 = ey - dy / len * offset }
  }

  const commonProps = {
    stroke: style.color,
    strokeWidth: 2.2,
    strokeDasharray: style.dash,
    fill: 'none' as const,
    markerEnd: arrow.type !== 'screen' ? `url(#${markerId})` : undefined,
    style: { cursor: canDelete ? 'pointer' : 'default' },
    onClick: canDelete ? onDelete : undefined,
  }

  if (arrow.type === 'dribble') {
    const csx = isCurved ? cpx : undefined
    const csy = isCurved ? cpy : undefined
    return <path d={wavyPath(sx, sy, ex2, ey2, csx, csy)} {...commonProps} />
  }

  if (arrow.type === 'screen') {
    const pathD = bezierPathD(sx, sy, cpx, cpy, ex, ey, isCurved)
    return (
      <g style={{ cursor: canDelete ? 'pointer' : 'default' }} onClick={canDelete ? onDelete : undefined}>
        <path d={pathD} stroke={style.color} strokeWidth={2.5} fill="none" />
        <path d={screenBar(sx, sy, ex, ey)} stroke={style.color} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      </g>
    )
  }

  const pathD = bezierPathD(sx, sy, cpx, cpy, ex2, ey2, isCurved)
  return <path d={pathD} {...commonProps} />
}

// ===== Curve handle (shown in select mode) =====
function CurveHandle({ arrow, courtH }: { arrow: DiagramArrow; courtH: number }) {
  const [sx, sy] = toSVG(arrow.x1, arrow.y1, courtH)
  const [ex, ey] = toSVG(arrow.x2, arrow.y2, courtH)
  let hx: number, hy: number
  if (arrow.cx !== undefined && arrow.cy !== undefined) {
    const [cpx, cpy] = toSVG(arrow.cx, arrow.cy, courtH)
    hx = 0.25 * sx + 0.5 * cpx + 0.25 * ex
    hy = 0.25 * sy + 0.5 * cpy + 0.25 * ey
  } else {
    hx = (sx + ex) / 2
    hy = (sy + ey) / 2
  }
  const color = ARROW_STYLE[arrow.type].color
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={hx} cy={hy} r={8} fill="rgba(255,255,255,0.15)" />
      <circle cx={hx} cy={hy} r={5} fill={color} stroke="white" strokeWidth={1.5} opacity={0.9} />
    </g>
  )
}

// ===== Step Badge (shown in select mode, tap to cycle step group) =====
function StepBadge({ arrow, courtH, onCycleStep }: {
  arrow: DiagramArrow
  courtH: number
  onCycleStep: (arrowId: string) => void
}) {
  // Position at t=0.28 of the bezier path (before midpoint curve handle at t=0.5)
  const pt = bezierPoint(0.28, arrow.x1, arrow.y1, arrow.cx, arrow.cy, arrow.x2, arrow.y2)
  const [cx, cy] = toSVG(pt.x, pt.y, courtH)

  const step = arrow.step
  const hasStep = step !== undefined

  return (
    <g
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onCycleStep(arrow.id) }}
      style={{ cursor: 'pointer' }}
    >
      {hasStep ? (
        <>
          <circle cx={cx} cy={cy} r={10} fill={stepColor(step!)} stroke="white" strokeWidth={1.5} opacity={0.92} />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold"
            style={{ pointerEvents: 'none' }}>
            {step}
          </text>
        </>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={9} fill="rgba(50,40,30,0.35)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeDasharray="3,2" />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={9} fontWeight="bold"
            style={{ pointerEvents: 'none' }}>
            +
          </text>
        </>
      )}
    </g>
  )
}

// ===== Ball token =====
function BallMarker({ x, y, courtH }: { x: number; y: number; courtH: number }) {
  const [cx, cy] = toSVG(x, y, courtH)
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy} r={7.5} fill="#E8873A" stroke="#7A4010" strokeWidth={1.5} />
      <path d={`M${cx - 6.5},${cy} Q${cx},${cy - 5.5} ${cx + 6.5},${cy}`} fill="none" stroke="#7A4010" strokeWidth={0.9} />
      <path d={`M${cx - 6.5},${cy} Q${cx},${cy + 5.5} ${cx + 6.5},${cy}`} fill="none" stroke="#7A4010" strokeWidth={0.9} />
      <path d={`M${cx},${cy - 6.5} Q${cx + 4.5},${cy} ${cx},${cy + 6.5}`} fill="none" stroke="#7A4010" strokeWidth={0.9} />
    </g>
  )
}

// ===== Player marker =====
function PlayerMarker({ player, courtH, selected, onPointerDown }: {
  player: PlayerPos
  courtH: number
  selected?: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const [cx, cy] = toSVG(player.x, player.y, courtH)
  const isOffense = player.id.startsWith('o')
  const num = player.id[1]
  const r = 14

  return (
    <g onPointerDown={onPointerDown} style={{ cursor: 'grab', touchAction: 'none' }}>
      {selected && <circle cx={cx} cy={cy} r={r + 4} fill="rgba(255,255,0,0.35)" />}
      {isOffense ? (
        <>
          <circle cx={cx} cy={cy} r={r} fill="#E07B2A" stroke="white" strokeWidth={2} />
          <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">{num}</text>
        </>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={r} fill="white" stroke="#1E3A5F" strokeWidth={2} />
          <text x={cx - 4} y={cy - 2} textAnchor="middle" fill="#1E3A5F" fontSize={10} fontWeight="bold">✕</text>
          <text x={cx + 5} y={cy + 8} textAnchor="middle" fill="#1E3A5F" fontSize={9} fontWeight="bold">{num}</text>
        </>
      )}
    </g>
  )
}

// ===== SVG Defs (arrowheads) =====
function SVGDefs() {
  return (
    <defs>
      {(Object.entries(ARROW_STYLE) as [ArrowType, typeof ARROW_STYLE[ArrowType]][]).map(([type, s]) => (
        <marker key={type} id={`ah-${type}`} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={s.color} />
        </marker>
      ))}
    </defs>
  )
}

// ===== Main Component =====
interface Props {
  formation: Formation
  onChange?: (f: Formation) => void
  readonly?: boolean
}

export function FormationDiagram({ formation, onChange, readonly = false }: Props) {
  const courtH = formation.courtType === 'full' ? CH_FULL : CH_HALF
  const svgRef = useRef<SVGSVGElement>(null)
  const { t } = useLanguage()

  const [players, setPlayers] = useState<PlayerPos[]>(formation.players ?? [])
  const [arrows, setArrows]   = useState<DiagramArrow[]>(formation.arrows ?? [])

  // Live state: where players/ball ARE after all arrows applied (editor view)
  const liveState = useMemo(
    () => computeLivePositions(players, arrows),
    [players, arrows]
  )

  // Display state: shown in SVG (live during editing, animated during playback)
  const [displayPlayers, setDisplayPlayers] = useState<PlayerPos[]>(liveState.players)
  const [displayBallPos, setDisplayBallPos] = useState<{ x: number; y: number } | null>(liveState.ballPos)

  const [tool, setTool]           = useState<Tool>('select')
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  const historyRef = useRef<{ players: PlayerPos[]; arrows: DiagramArrow[] }[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [guideVisible, setGuideVisible] = useLocalStorage<boolean>('formation-guide-seen', true)

  type DragState =
    | { type: 'player'; id: string }
    | { type: 'arrow';  x1: number; y1: number }
    | { type: 'curve';  arrowId: string }
  const dragRef    = useRef<DragState | null>(null)
  const cursorRef  = useRef<{ x: number; y: number } | null>(null)
  const animRef    = useRef<{ raf: number } | null>(null)
  const arrowsLiveRef = useRef<DiagramArrow[]>(arrows)
  arrowsLiveRef.current = arrows

  const [, forceRender] = useState(0)
  const rerender = () => forceRender(n => n + 1)

  // Sync display to live state when not animating
  useEffect(() => {
    if (!isPlaying) {
      setDisplayPlayers(liveState.players)
      setDisplayBallPos(liveState.ballPos)
    }
  }, [liveState, isPlaying])

  // Cleanup on unmount
  useEffect(() => () => { animRef.current && cancelAnimationFrame(animRef.current.raf) }, [])

  // ===== Core save =====
  const save = useCallback((newPlayers: PlayerPos[], newArrows: DiagramArrow[]) => {
    setPlayers(newPlayers)
    setArrows(newArrows)
    onChange?.({ ...formation, players: newPlayers, arrows: newArrows })
  }, [formation, onChange])

  const saveWithHistory = useCallback((newPlayers: PlayerPos[], newArrows: DiagramArrow[]) => {
    historyRef.current = [...historyRef.current.slice(-19), { players, arrows }]
    setCanUndo(true)
    save(newPlayers, newArrows)
  }, [players, arrows, save])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (!prev) return
    setCanUndo(historyRef.current.length > 0)
    save(prev.players, prev.arrows)
  }, [save])

  // ===== Toggle player on/off =====
  const togglePlayer = (pid: string) => {
    const exists = players.some(p => p.id === pid)
    if (exists) {
      const removed = players.find(p => p.id === pid)!
      saveWithHistory(
        players.filter(p => p.id !== pid),
        arrows.filter(a =>
          !(Math.hypot(a.x1 - removed.x, a.y1 - removed.y) < 0.08) &&
          !(Math.hypot(a.x2 - removed.x, a.y2 - removed.y) < 0.08)
        )
      )
    } else {
      saveWithHistory([...players, getDefaultPos(pid, formation.courtType)], arrows)
    }
  }

  // ===== Cycle step number on an arrow (for simultaneous grouping) =====
  const cycleStep = useCallback((arrowId: string) => {
    const newArrows = arrowsLiveRef.current.map(a => {
      if (a.id !== arrowId) return a
      const current = a.step
      if (current === undefined) return { ...a, step: 1 }
      if (current >= 5) return { ...a, step: undefined }
      return { ...a, step: current + 1 }
    })
    saveWithHistory(players, newArrows)
  }, [players, saveWithHistory])

  // ===== Animation: grouped sequential (same step = simultaneous), bezier path following =====
  const playAnimation = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current.raf); animRef.current = null }
    if (arrows.length === 0) return

    const { groups, states } = computeAnimStatesGrouped(players, arrows)
    const segDur   = 700                         // ms per group
    const totalDur = groups.length * segDur
    const startTime = performance.now()

    setIsPlaying(true)

    const tick = (now: number) => {
      const elapsed = now - startTime
      const done = elapsed >= totalDur

      if (done) {
        const finalState = states[groups.length]
        setDisplayPlayers(finalState.players)
        setDisplayBallPos(finalState.ballPos)
        setIsPlaying(false)
        animRef.current = null
        return
      }

      // Which group is currently playing?
      const groupIdx = Math.min(Math.floor(elapsed / segDur), groups.length - 1)
      const t = easeInOut(Math.min((elapsed - groupIdx * segDur) / segDur, 1))
      const group = groups[groupIdx]
      const prevState = states[groupIdx]  // state just before this group

      // Animate all arrows in the group simultaneously from prevState
      const newPlayers = prevState.players.map(p => ({ ...p }))
      let newBallPos = prevState.ballPos ? { ...prevState.ballPos } : null

      for (const arrow of group) {
        const affectedPIdx = prevState.players.findIndex(
          p => Math.hypot(p.x - arrow.x1, p.y - arrow.y1) < 0.08
        )
        const movesPlayer = affectedPIdx !== -1 && (
          arrow.type === 'cut'     ||
          arrow.type === 'screen'  ||
          arrow.type === 'dribble' ||
          arrow.type === 'handoff'
        )

        if (movesPlayer) {
          const pt = bezierPoint(t, arrow.x1, arrow.y1, arrow.cx, arrow.cy, arrow.x2, arrow.y2)
          newPlayers[affectedPIdx] = { ...newPlayers[affectedPIdx], x: pt.x, y: pt.y }
        }

        if (arrow.type === 'dribble' || arrow.type === 'pass' || arrow.type === 'handoff') {
          const pt = bezierPoint(t, arrow.x1, arrow.y1, arrow.cx, arrow.cy, arrow.x2, arrow.y2)
          newBallPos = pt
        }
      }

      setDisplayPlayers(newPlayers)
      setDisplayBallPos(newBallPos)

      animRef.current = { raf: requestAnimationFrame(tick) }
    }
    animRef.current = { raf: requestAnimationFrame(tick) }
  }

  const resetAnimation = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current.raf); animRef.current = null }
    setIsPlaying(false)
    setDisplayPlayers(liveState.players)
    setDisplayBallPos(liveState.ballPos)
  }

  // ===== Pointer helpers =====
  const getSVGPos = (e: React.PointerEvent): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = CW / rect.width, scaleY = courtH / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
  }

  const findNearPlayer = (nx: number, ny: number, threshold = 0.08): PlayerPos | null => {
    let nearest: PlayerPos | null = null, minD = threshold
    for (const p of liveState.players) {
      const d = Math.hypot(p.x - nx, p.y - ny)
      if (d < minD) { nearest = p; minD = d }
    }
    return nearest
  }

  const getHandlePos = (arrow: DiagramArrow): { x: number; y: number } => {
    if (arrow.cx !== undefined && arrow.cy !== undefined) {
      return {
        x: 0.25 * arrow.x1 + 0.5 * arrow.cx + 0.25 * arrow.x2,
        y: 0.25 * arrow.y1 + 0.5 * arrow.cy + 0.25 * arrow.y2,
      }
    }
    return { x: (arrow.x1 + arrow.x2) / 2, y: (arrow.y1 + arrow.y2) / 2 }
  }

  const findNearCurveHandle = (nx: number, ny: number): DiagramArrow | null => {
    for (const arrow of arrows) {
      const h = getHandlePos(arrow)
      if (Math.hypot(h.x - nx, h.y - ny) < 0.07) return arrow
    }
    return null
  }

  // ===== Pointer events =====
  const onPointerDown = (e: React.PointerEvent) => {
    if (readonly || isPlaying) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const [svgX, svgY] = getSVGPos(e)
    const [nx, ny] = fromSVG(svgX, svgY, courtH)

    if (tool === 'select') {
      const nearArrow = findNearCurveHandle(nx, ny)
      if (nearArrow) {
        historyRef.current = [...historyRef.current.slice(-19), { players, arrows }]
        setCanUndo(true)
        dragRef.current = { type: 'curve', arrowId: nearArrow.id }
      }
      return
    }

    if (tool === 'delete') {
      const toDelete = arrows.find(a => {
        const h = getHandlePos(a)
        return Math.hypot(h.x - nx, h.y - ny) < 0.09
      })
      if (toDelete) saveWithHistory(players, arrows.filter(a => a.id !== toDelete.id))
      return
    }

    const near = findNearPlayer(nx, ny)
    if (near) {
      dragRef.current = { type: 'arrow', x1: near.x, y1: near.y }
      cursorRef.current = { x: nx, y: ny }
      rerender()
    }
  }

  const onPlayerPointerDown = (e: React.PointerEvent, playerId: string) => {
    if (readonly || isPlaying) return
    e.stopPropagation()
    if (tool !== 'select') {
      const livePlayer = liveState.players.find(p => p.id === playerId)
      if (!livePlayer) return
      dragRef.current = { type: 'arrow', x1: livePlayer.x, y1: livePlayer.y }
      cursorRef.current = { x: livePlayer.x, y: livePlayer.y }
      svgRef.current?.setPointerCapture(e.pointerId)
      rerender()
      return
    }
    historyRef.current = [...historyRef.current.slice(-19), { players, arrows }]
    setCanUndo(true)
    e.currentTarget.closest('svg')?.setPointerCapture(e.pointerId)
    dragRef.current = { type: 'player', id: playerId }
    setSelectedPlayer(playerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || readonly || isPlaying) return
    const [svgX, svgY] = getSVGPos(e)
    const [nx, ny] = fromSVG(svgX, svgY, courtH)
    const cx = Math.max(0.02, Math.min(0.98, nx))
    const cy = Math.max(0.02, Math.min(0.98, ny))

    if (dragRef.current.type === 'player') {
      const id = dragRef.current.id
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, x: cx, y: cy } : p))

    } else if (dragRef.current.type === 'curve') {
      const arrowId = dragRef.current.arrowId
      setArrows(prev => prev.map(a => {
        if (a.id !== arrowId) return a
        const ctrlX = 2 * cx - 0.5 * (a.x1 + a.x2)
        const ctrlY = 2 * cy - 0.5 * (a.y1 + a.y2)
        return { ...a, cx: ctrlX, cy: ctrlY }
      }))

    } else {
      cursorRef.current = { x: cx, y: cy }
      rerender()
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current || readonly || isPlaying) return

    if (dragRef.current.type === 'player') {
      onChange?.({ ...formation, players, arrows })

    } else if (dragRef.current.type === 'curve') {
      onChange?.({ ...formation, players, arrows: arrowsLiveRef.current })

    } else if (dragRef.current.type === 'arrow' && cursorRef.current) {
      const { x1, y1 } = dragRef.current
      const [svgX, svgY] = getSVGPos(e)
      const [nx, ny] = fromSVG(svgX, svgY, courtH)
      const near = findNearPlayer(nx, ny, 0.1)
      const x2 = near ? near.x : Math.max(0.02, Math.min(0.98, nx))
      const y2 = near ? near.y : Math.max(0.02, Math.min(0.98, ny))
      if (Math.hypot(x2 - x1, y2 - y1) > 0.04) {
        const newArrow: DiagramArrow = { id: crypto.randomUUID(), type: tool as ArrowType, x1, y1, x2, y2 }
        saveWithHistory(players, [...arrows, newArrow])
      }
    }

    dragRef.current = null
    cursorRef.current = null
    rerender()
  }

  // ===== Preview arrow while drawing =====
  const previewArrow = dragRef.current?.type === 'arrow' && cursorRef.current ? (() => {
    const { x1, y1 } = dragRef.current as { type: 'arrow'; x1: number; y1: number }
    const [sx, sy] = toSVG(x1, y1, courtH)
    const [ex, ey] = toSVG(cursorRef.current.x, cursorRef.current.y, courtH)
    const s = ARROW_STYLE[tool as ArrowType] ?? ARROW_STYLE.pass
    return <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={s.color} strokeWidth={2} strokeDasharray="6,3" opacity={0.6} />
  })() : null

  // ===== Tool definitions (translated) =====
  const TOOLS: { id: Tool; label: string; color?: string }[] = [
    { id: 'select',  label: t('fd.tool.select') },
    { id: 'pass',    label: t('fd.tool.pass'),    color: ARROW_STYLE.pass.color },
    { id: 'cut',     label: t('fd.tool.cut'),     color: ARROW_STYLE.cut.color },
    { id: 'screen',  label: t('fd.tool.screen'),  color: ARROW_STYLE.screen.color },
    { id: 'dribble', label: t('fd.tool.dribble'), color: ARROW_STYLE.dribble.color },
    { id: 'handoff', label: t('fd.tool.handoff'), color: ARROW_STYLE.handoff.color },
    { id: 'delete',  label: t('fd.tool.delete'),  color: '#DC3545' },
  ]

  const TOOL_HINTS: Record<Tool, string> = {
    select:  t('fd.hint.select'),
    pass:    t('fd.hint.pass'),
    cut:     t('fd.hint.cut'),
    screen:  t('fd.hint.screen'),
    dribble: t('fd.hint.dribble'),
    handoff: t('fd.hint.handoff'),
    delete:  t('fd.hint.delete'),
  }

  const hasMovement = arrows.length > 0

  return (
    <div className="space-y-3">
      {!readonly && (
        <>
          {/* ===== 使い方ガイド ===== */}
          {guideVisible && (
            <div className="rounded-xl p-3" style={{
              backgroundColor: 'rgba(224,123,42,0.07)',
              border: '1px solid rgba(224,123,42,0.25)',
            }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold mb-2" style={{ color: '#E07B2A' }}>{t('fd.guide.title')}</p>
                  <ol className="space-y-1">
                    {[
                      t('fd.guide.step1'),
                      t('fd.guide.step2'),
                      t('fd.guide.step3'),
                      t('fd.guide.step4'),
                      t('fd.guide.step5'),
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: '#E07B2A', minWidth: 14 }}>{i + 1}.</span>
                        <span className="text-xs leading-relaxed" style={{ color: '#7A6E5F' }}>{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <button onClick={() => setGuideVisible(false)}
                  className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: 'rgba(195,175,148,0.25)', color: '#A89F92' }}>
                  {t('fd.guide.close')}
                </button>
              </div>
            </div>
          )}

          {/* ===== 選手チップ ===== */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: '#A89F92' }}>
              {t('fd.players.title')}
              <span className="ml-1" style={{ color: '#C8BFB2' }}>{t('fd.players.hint')}</span>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { prefix: 'o', label: 'OF', activeColor: '#E07B2A', inactiveBg: 'rgba(224,123,42,0.12)', inactiveBorder: 'rgba(224,123,42,0.3)' },
                { prefix: 'd', label: 'DF', activeColor: '#1E3A5F', inactiveBg: 'rgba(30,58,95,0.1)',    inactiveBorder: 'rgba(30,58,95,0.2)' },
              ].map(({ prefix, label, activeColor, inactiveBg, inactiveBorder }) => (
                <div key={prefix} className="flex items-center gap-1">
                  <span className="text-xs font-bold mr-0.5" style={{ color: activeColor }}>{label}</span>
                  {[1, 2, 3, 4, 5].map(n => {
                    const pid = `${prefix}${n}`
                    const active = players.some(p => p.id === pid)
                    return (
                      <button key={pid} onClick={() => togglePlayer(pid)}
                        className="w-7 h-7 rounded-full text-xs font-bold transition-all"
                        style={{
                          backgroundColor: active ? activeColor : inactiveBg,
                          color: active ? 'white' : activeColor,
                          border: `1.5px solid ${active ? activeColor : inactiveBorder}`,
                        }}>
                        {n}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ===== ツールバー ===== */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5 items-center">
              {TOOLS.map(tl => (
                <button key={tl.id} onClick={() => setTool(tl.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    backgroundColor: tool === tl.id ? (tl.color ?? '#1E3A5F') : 'rgba(195,175,148,0.2)',
                    color: tool === tl.id ? 'white' : (tl.color ?? '#7A6E5F'),
                    border: `1.5px solid ${tool === tl.id ? (tl.color ?? '#1E3A5F') : 'transparent'}`,
                  }}>
                  {tl.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-0.5" style={{ minHeight: 18 }}>
              {tool !== 'select' && tool !== 'delete' && (
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ARROW_STYLE[tool as ArrowType]?.color }} />
              )}
              <p className="text-xs" style={{ color: tool === 'delete' ? '#DC3545' : '#A89F92' }}>
                {TOOL_HINTS[tool]}
              </p>
            </div>
            {/* Step hint — shown in select mode when arrows exist */}
            {tool === 'select' && arrows.length > 0 && (
              <p className="text-xs px-0.5" style={{ color: '#C8BFB2' }}>
                {t('fd.step.hint')}
              </p>
            )}
          </div>
        </>
      )}

      {/* ===== コートSVG ===== */}
      <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CW} ${courtH}`}
          style={{ display: 'block', width: '100%', touchAction: 'none', userSelect: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <SVGDefs />
          {formation.courtType === 'full' ? <FullCourt /> : <HalfCourt />}

          {/* Arrows */}
          {arrows.map(arrow => (
            <ArrowSVG
              key={arrow.id}
              arrow={arrow}
              courtH={courtH}
              canDelete={tool === 'delete' && !readonly}
              onDelete={() => saveWithHistory(players, arrows.filter(a => a.id !== arrow.id))}
            />
          ))}

          {/* Curve handles (select mode only, not playing) */}
          {!readonly && !isPlaying && tool === 'select' && arrows.map(arrow => (
            <CurveHandle key={`ch-${arrow.id}`} arrow={arrow} courtH={courtH} />
          ))}

          {/* Step badges (select mode only, not playing) */}
          {!readonly && !isPlaying && tool === 'select' && arrows.map(arrow => (
            <StepBadge
              key={`sb-${arrow.id}`}
              arrow={arrow}
              courtH={courtH}
              onCycleStep={cycleStep}
            />
          ))}

          {previewArrow}

          {/* Empty state hints */}
          {!readonly && players.length === 0 && (
            <text x={CW / 2} y={courtH / 2 + 5} textAnchor="middle"
              fill="rgba(255,255,255,0.55)" fontSize={12}
              style={{ pointerEvents: 'none' }}>
              {t('fd.empty.noPlayers')}
            </text>
          )}
          {!readonly && players.length > 0 && arrows.length === 0 && !isPlaying && tool !== 'select' && (
            <text x={CW / 2} y={courtH - 12} textAnchor="middle"
              fill="rgba(255,255,255,0.45)" fontSize={10}
              style={{ pointerEvents: 'none' }}>
              {t('fd.empty.noArrows')}
            </text>
          )}

          {/* Players */}
          {displayPlayers.map(player => (
            <PlayerMarker
              key={player.id}
              player={player}
              courtH={courtH}
              selected={selectedPlayer === player.id && tool === 'select' && !isPlaying}
              onPointerDown={e => onPlayerPointerDown(e, player.id)}
            />
          ))}

          {/* Ball token */}
          {displayBallPos && (
            <BallMarker x={displayBallPos.x} y={displayBallPos.y} courtH={courtH} />
          )}
        </svg>
      </div>

      {/* ===== コントロール ===== */}
      <div className="flex flex-wrap items-center gap-2">
        {!readonly && canUndo && !isPlaying && (
          <button onClick={undo}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: 'rgba(195,175,148,0.2)', color: '#7A6E5F' }}>
            {t('fd.ctrl.undo')}
          </button>
        )}

        {(hasMovement || isPlaying) && (
          <button onClick={isPlaying ? resetAnimation : playAnimation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: isPlaying ? '#DC3545' : '#E07B2A', color: 'white' }}>
            {isPlaying
              ? <><RotateCcw size={14} /> {t('fd.ctrl.reset')}</>
              : <><Play size={14} /> {t('fd.ctrl.play')}</>
            }
          </button>
        )}

        {!readonly && !isPlaying && arrows.length > 0 && (
          <button onClick={() => saveWithHistory(players, [])}
            className="px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
            style={{ color: '#DC3545', border: '1px solid rgba(220,53,69,0.25)', backgroundColor: 'rgba(220,53,69,0.04)' }}>
            {t('fd.ctrl.clearArrows')}
          </button>
        )}
      </div>
    </div>
  )
}
