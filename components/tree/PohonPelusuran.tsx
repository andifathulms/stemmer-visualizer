'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import type { StemTrace } from '@/lib/engine/trace'
import type { CandidateTree } from '@/lib/engine/enumerate'
import { buildPohon, type PohonNode } from '@/lib/tree/pohon'
import { selectForDrawing, layoutPohon, type DrawNode } from '@/lib/tree/layout'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * `PohonPelusuran` — one drawn search tree, shared by `/kupas` and
 * `/kandidat` — DESIGN-REWORK.md §2. The path (`/kupas`) and the full
 * enumeration (`/kandidat`) are the same object; `mode` only changes how
 * off-path branches weigh against it, per §2.2.
 *
 * Left-to-right, root at the left, exactly PRD §5.1/§5.2's shape. Path
 * membership is line weight (§2.4) — `teacher` red stays reserved for the
 * final root and for genuine ambiguity (invariant 14), never for "this is
 * the path".
 *
 * Deliberate scope note: nodes are `font-word` text, in the same pen/pencil
 * tone convention `Kata` uses for its morphemes, but they are not `<Kata>`
 * itself — `Kata` is sized and laid out for one hero word, not a multi-node
 * diagram. And this component is still left-to-right only: DESIGN-REWORK.md
 * §7 says to check it at 375px after wiring it into `/kupas` and expects a
 * top-down rotation on narrow viewports, which has not been built or checked
 * in a real browser yet. Both are flagged, not silently decided.
 *
 * `aria-hidden`: the tree is a second, visual rendering of exactly what
 * `StepList` already states in linear, accessible form. It is not the
 * screen-reader route — DESIGN-REWORK.md §2.3.
 */

/**
 * A parent node sits at the *mean* slot of its children (`layoutPohon`), so
 * for the common case of exactly two children it lands exactly halfway
 * between them — which puts every edge's own vertical midpoint only a
 * quarter of a row away from the parent, not half. A label centred there
 * needs roughly ±9px of clearance from the parent's own text on one side and
 * the child's on the other, plus its own ~16px height: about 46px of clear
 * room. 96 gives that with margin in the tightest (two-children) case; a
 * smaller row height put the label on top of the word above it, which is
 * exactly the bug this constant exists to not have.
 */
const ROW_HEIGHT = 96
const PAD = 44
const EDGE_LABEL_WIDTH = 110
const EDGE_LABEL_HEIGHT = 16
/** Rough monospace advance for `font-word text-sm` (Geist Mono, 14px). Used
 *  only to size the layout with enough room, never to place text pixel-
 *  perfectly — SVG measures its own text at paint time regardless. */
const CHAR_WIDTH = 8.4
const MIN_COL_WIDTH = 160

function wordPx(word: string): number {
  return word.length * CHAR_WIDTH
}

interface Point {
  readonly x: number
  readonly y: number
}

function toPoint(depth: number, slot: number, colWidth: number): Point {
  return { x: PAD + depth * colWidth, y: PAD + slot * ROW_HEIGHT }
}

/**
 * A fixed column width overlapped an edge's rule-id label with its own
 * parent's word for anything longer than about six characters — the
 * midpoint of a 168px column sits inside "meninggal"'s own text. The column
 * width is sized from the tree's own content instead: wide enough that even
 * the longest word in the drawing, sitting at a column's left edge, clears
 * the label centred at the column's midpoint with room either side.
 */
function columnWidth(root: DrawNode): number {
  let longestChars = 0
  function walkWidth(node: DrawNode): void {
    longestChars = Math.max(longestChars, node.kata.length)
    node.children.forEach(walkWidth)
  }
  walkWidth(root)
  return Math.max(MIN_COL_WIDTH, longestChars * CHAR_WIDTH * 2 + EDGE_LABEL_WIDTH + 40)
}

function abandonReasonLabel(node: PohonNode, copy: Copy): string | null {
  if (!node.abandonReason) return null
  if (node.abandonReason.kind === 'kamus') return copy.lookupMiss
  return node.abandonReason.keterangan
}

function NodeLabel({
  node,
  point,
  isResult,
  isActive,
  locale,
  onHover,
}: {
  node: DrawNode
  point: Point
  isResult: boolean
  isActive: boolean
  locale: Locale
  onHover?: (nodeId: string) => void
}) {
  const isLeaf = node.children.length === 0
  const fill = isResult
    ? 'fill-teacher'
    : node.abandoned
      ? 'fill-pencilMark'
      : node.onPath
        ? 'fill-pen'
        : 'fill-pencil'
  const boxWidth = wordPx(node.kata) + 8

  return (
    <g onMouseEnter={onHover ? () => onHover(node.id) : undefined}>
      {/* The step player's current position on the path — StepList and the
          tree cross-highlight each other (DESIGN-REWORK.md §2.3). A ring
          rather than a fill, so it never competes with the dictionary-hit
          highlight or with teacher red. */}
      {isActive && (
        <rect
          x={point.x - 6}
          y={point.y - 14}
          width={boxWidth + 4}
          height={22}
          rx={4}
          fill="none"
          className="stroke-pen"
          strokeWidth={1.5}
        />
      )}
      {node.dictionaryValid && (
        <rect
          x={point.x - 4}
          y={point.y - 12}
          width={boxWidth}
          height={18}
          rx={3}
          className="fill-highlight/40"
        />
      )}
      <text
        x={point.x}
        y={point.y}
        className={`font-word text-sm ${fill} ${node.abandoned ? 'line-through' : ''}`}
      >
        {node.kata}
      </text>
      {node.restored !== null && (
        <text x={point.x} y={point.y - 14} className="font-ui text-[10px] fill-pencil">
          +{node.restored}
        </text>
      )}
      {node.hiddenSiblingCount > 0 && (
        <text x={point.x + wordPx(node.kata) + 10} y={point.y} className="font-ui text-[10px] fill-pencil">
          +{node.hiddenSiblingCount}
        </text>
      )}
      {isLeaf && node.abandonReason && (
        <text x={point.x} y={point.y + 14} className="font-ui text-[10px] fill-pencilMark">
          {locale === 'en' && node.abandonReason.kind === 'kamus' ? 'not in dictionary' : null}
        </text>
      )}
    </g>
  )
}

function Edge({
  from,
  fromWord,
  to,
  colWidth,
  node,
  mode,
  isResultPath,
  copy,
  locale,
}: {
  from: Point
  /** The parent's own word — the curve has to start after it, not through
   *  it. `from` is the *left* edge of that text (SVG's default text-anchor),
   *  so starting a fixed few pixels from `from.x` cut straight across any
   *  word longer than a couple of characters. */
  fromWord: string
  to: Point
  colWidth: number
  node: DrawNode
  mode: 'jalur' | 'setara'
  isResultPath: boolean
  copy: Copy
  locale: Locale
}) {
  const onPathWeight = node.onPath && !node.abandoned
  const strokeClass = isResultPath
    ? 'stroke-teacher'
    : node.abandoned
      ? 'stroke-pencilMark'
      : node.onPath
        ? 'stroke-pen'
        : 'stroke-pencilMark'
  const strokeWidth = onPathWeight ? (isResultPath ? 3 : 2.5) : mode === 'setara' ? 1.25 : 1
  const opacity = node.onPath ? 1 : mode === 'jalur' ? 0.35 : 0.7
  const dash = node.abandoned ? '3 3' : undefined

  const startX = from.x + wordPx(fromWord) + 8
  const mid: Point = { x: (startX + to.x) / 2, y: (from.y + to.y) / 2 }
  const reason = abandonReasonLabel(node, copy)

  return (
    <g>
      <path
        d={`M ${startX} ${from.y - 4} C ${from.x + colWidth / 2} ${from.y - 4}, ${
          to.x - colWidth / 2
        } ${to.y - 4}, ${to.x - 8} ${to.y - 4}`}
        fill="none"
        className={strokeClass}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        style={{ opacity }}
      />
      {node.ruleId && (node.onPath || mode === 'setara') && (
        // Centred on the edge's own midpoint, not offset toward either end —
        // an offset in a fixed direction is toward the parent for one child
        // and away from it for another (whichever side of the parent's mean
        // slot they fall on), so it collides with one of them depending on
        // shape. ROW_HEIGHT is sized so the centred position clears both.
        <foreignObject
          x={mid.x - EDGE_LABEL_WIDTH / 2}
          y={mid.y - EDGE_LABEL_HEIGHT / 2}
          width={EDGE_LABEL_WIDTH}
          height={EDGE_LABEL_HEIGHT}
        >
          <Link
            className="block truncate text-center font-word text-[10px] text-pencil underline decoration-ruleLine hover:text-pen"
            href={`/${locale}/aturan/#${node.ruleId}`}
            title={reason ?? undefined}
          >
            {node.ruleId}
            {reason && node.abandoned ? ` — ${reason}` : ''}
          </Link>
        </foreignObject>
      )}
    </g>
  )
}

interface WalkContext {
  readonly slotOf: Map<string, number>
  readonly colWidth: number
  readonly resultNodeId: string | null
  readonly activeNodeId: string | null | undefined
  readonly mode: 'jalur' | 'setara'
  readonly copy: Copy
  readonly locale: Locale
  readonly onHoverNode: ((nodeId: string) => void) | undefined
}

function walk(node: DrawNode, depth: number, ctx: WalkContext, out: JSX.Element[]): void {
  const slot = ctx.slotOf.get(node.id)
  if (slot === undefined) return
  const point = toPoint(depth, slot, ctx.colWidth)

  for (const child of node.children) {
    const childSlot = ctx.slotOf.get(child.id)
    if (childSlot === undefined) continue
    const childPoint = toPoint(depth + 1, childSlot, ctx.colWidth)
    out.push(
      <Edge
        key={`edge-${child.id}`}
        from={point}
        fromWord={node.kata}
        to={childPoint}
        colWidth={ctx.colWidth}
        node={child}
        mode={ctx.mode}
        isResultPath={child.id === ctx.resultNodeId}
        copy={ctx.copy}
        locale={ctx.locale}
      />,
    )
    walk(child, depth + 1, ctx, out)
  }

  out.push(
    <NodeLabel
      key={`node-${node.id}`}
      node={node}
      point={point}
      isResult={node.id === ctx.resultNodeId}
      isActive={node.id === ctx.activeNodeId}
      locale={ctx.locale}
      onHover={ctx.onHoverNode}
    />,
  )
}

/** A brace over the dictionary-valid leaves, when there is more than one —
 *  DESIGN-REWORK.md §2.5: "when more than one leaf hits the dictionary,
 *  brace them together and label the group." */
function AmbiguityBrace({
  leaves,
  reason,
  copy,
}: {
  leaves: readonly { point: Point }[]
  reason: string
  copy: Copy
}) {
  if (leaves.length < 2) return null
  const xs = leaves.map((l) => l.point.x)
  const ys = leaves.map((l) => l.point.y)
  const x = Math.max(...xs) + 60
  const yTop = Math.min(...ys) - 10
  const yBottom = Math.max(...ys) + 6

  return (
    <g>
      <path
        d={`M ${x - 8} ${yTop} L ${x} ${yTop} L ${x} ${yBottom} L ${x - 8} ${yBottom}`}
        fill="none"
        className="stroke-teacher"
        strokeWidth={1.5}
      />
      <foreignObject x={x + 6} y={(yTop + yBottom) / 2 - 20} width={220} height={40}>
        <p className="font-ui text-xs leading-snug text-teacher">
          {copy.pohon.ambiguityLabel}. {reason}
        </p>
      </foreignObject>
    </g>
  )
}

export function PohonPelusuran({
  trace,
  tree,
  mode,
  copy,
  locale,
  activeNodeId,
  onHoverNode,
}: {
  trace: StemTrace
  tree: CandidateTree
  mode: 'jalur' | 'setara'
  copy: Copy
  locale: Locale
  /** The node the step player is currently standing on, if this tree is
   *  wired to one — DESIGN-REWORK.md §2.2: "the step player scrubs along
   *  the path, and the existing peeling animation plays on the node it is
   *  currently at." Omit on `/kandidat`, which has no player. */
  activeNodeId?: string | null
  /** Hovering a tree node scrubs the step player to match — the reverse of
   *  `activeNodeId`, per §2.3's "and the reverse." */
  onHoverNode?: (nodeId: string) => void
}) {
  const pohon = useMemo(() => buildPohon(trace, tree), [trace, tree])
  const selection = useMemo(() => selectForDrawing(pohon), [pohon])
  const layout = useMemo(() => layoutPohon(selection.root), [selection])
  const colWidth = useMemo(() => columnWidth(selection.root), [selection])

  const slotOf = useMemo(() => {
    const map = new Map<string, number>()
    for (const placed of layout.placed) map.set(placed.node.id, placed.slot)
    return map
  }, [layout])

  const width = PAD * 2 + (layout.maxDepth + 1) * colWidth
  const height = PAD * 2 + (layout.maxSlot + 1) * ROW_HEIGHT

  const elements: JSX.Element[] = []
  walk(
    selection.root,
    0,
    {
      slotOf,
      colWidth,
      resultNodeId: pohon.resultNodeId,
      activeNodeId,
      mode,
      copy,
      locale,
      onHoverNode,
    },
    elements,
  )

  const dictionaryValidLeaves = layout.placed.filter(
    (p) => p.node.dictionaryValid && p.node.children.length === 0,
  )
  const braceLeaves = dictionaryValidLeaves.map((p) => ({ point: toPoint(p.depth, p.slot, colWidth) }))

  return (
    // No forced min-width here: a small tree stays small and left-aligned
    // rather than being stretched to fill a wide panel, which used to
    // magnify the whole drawing (text included) well past its intended size.
    // overflow-x-auto still handles the case where the tree is wider than
    // the panel.
    <div className="overflow-x-auto">
      <svg
        aria-hidden="true"
        role="presentation"
        width={width}
        height={Math.max(height, PAD * 2 + ROW_HEIGHT)}
        viewBox={`0 0 ${width} ${Math.max(height, PAD * 2 + ROW_HEIGHT)}`}
      >
        <title>{copy.pohon.title}</title>
        {elements}
        {trace.ambiguity && (
          <AmbiguityBrace leaves={braceLeaves} reason={trace.ambiguity.reason} copy={copy} />
        )}
      </svg>
      {selection.truncated && (
        <p className="mt-2 font-ui text-xs text-pencil">
          {copy.pohon.capped
            .replace('{n}', String(selection.shown))
            .replace('{total}', String(selection.total))}
        </p>
      )}
    </div>
  )
}
