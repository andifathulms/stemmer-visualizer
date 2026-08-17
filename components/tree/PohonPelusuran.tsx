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

const COL_WIDTH = 168
const ROW_HEIGHT = 40
const PAD = 24
const EDGE_LABEL_WIDTH = 96
const EDGE_LABEL_HEIGHT = 16

interface Point {
  readonly x: number
  readonly y: number
}

function toPoint(depth: number, slot: number): Point {
  return { x: PAD + depth * COL_WIDTH, y: PAD + slot * ROW_HEIGHT }
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
  const boxWidth = String(node.kata).length * 8 + 8

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
        <text
          x={point.x + String(node.kata).length * 8 + 10}
          y={point.y}
          className="font-ui text-[10px] fill-pencil"
        >
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
  to,
  node,
  mode,
  isResultPath,
  copy,
  locale,
}: {
  from: Point
  to: Point
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

  const mid: Point = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const reason = abandonReasonLabel(node, copy)

  return (
    <g>
      <path
        d={`M ${from.x + 4} ${from.y - 4} C ${from.x + COL_WIDTH / 2} ${from.y - 4}, ${
          to.x - COL_WIDTH / 2
        } ${to.y - 4}, ${to.x - 8} ${to.y - 4}`}
        fill="none"
        className={strokeClass}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        style={{ opacity }}
      />
      {node.ruleId && (node.onPath || mode === 'setara') && (
        <foreignObject
          x={mid.x - EDGE_LABEL_WIDTH / 2}
          y={mid.y - EDGE_LABEL_HEIGHT - 6}
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

function walk(
  node: DrawNode,
  depth: number,
  slotOf: Map<string, number>,
  resultNodeId: string | null,
  activeNodeId: string | null | undefined,
  mode: 'jalur' | 'setara',
  copy: Copy,
  locale: Locale,
  onHoverNode: ((nodeId: string) => void) | undefined,
  out: JSX.Element[],
): void {
  const slot = slotOf.get(node.id)
  if (slot === undefined) return
  const point = toPoint(depth, slot)

  for (const child of node.children) {
    const childSlot = slotOf.get(child.id)
    if (childSlot === undefined) continue
    const childPoint = toPoint(depth + 1, childSlot)
    out.push(
      <Edge
        key={`edge-${child.id}`}
        from={point}
        to={childPoint}
        node={child}
        mode={mode}
        isResultPath={child.id === resultNodeId}
        copy={copy}
        locale={locale}
      />,
    )
    walk(child, depth + 1, slotOf, resultNodeId, activeNodeId, mode, copy, locale, onHoverNode, out)
  }

  out.push(
    <NodeLabel
      key={`node-${node.id}`}
      node={node}
      point={point}
      isResult={node.id === resultNodeId}
      isActive={node.id === activeNodeId}
      locale={locale}
      onHover={onHoverNode}
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

  const slotOf = useMemo(() => {
    const map = new Map<string, number>()
    for (const placed of layout.placed) map.set(placed.node.id, placed.slot)
    return map
  }, [layout])

  const width = PAD * 2 + (layout.maxDepth + 1) * COL_WIDTH
  const height = PAD * 2 + (layout.maxSlot + 1) * ROW_HEIGHT

  const elements: JSX.Element[] = []
  walk(
    selection.root,
    0,
    slotOf,
    pohon.resultNodeId,
    activeNodeId,
    mode,
    copy,
    locale,
    onHoverNode,
    elements,
  )

  const dictionaryValidLeaves = layout.placed.filter(
    (p) => p.node.dictionaryValid && p.node.children.length === 0,
  )
  const braceLeaves = dictionaryValidLeaves.map((p) => ({ point: toPoint(p.depth, p.slot) }))

  return (
    <div className="overflow-x-auto">
      <svg
        aria-hidden="true"
        role="presentation"
        width={width}
        height={Math.max(height, PAD * 2 + ROW_HEIGHT)}
        viewBox={`0 0 ${width} ${Math.max(height, PAD * 2 + ROW_HEIGHT)}`}
        className="min-w-full"
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
