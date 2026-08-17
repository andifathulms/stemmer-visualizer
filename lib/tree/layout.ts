import type { Pohon, PohonNode } from './pohon'

/**
 * Pure geometry for `PohonPelusuran`. No algorithm knowledge lives here —
 * only where to put a node once `pohon.ts` has already decided which nodes
 * exist and which of them the search actually walked.
 *
 * Positions are unit grid coordinates (`depth` along one axis, an integer
 * `slot` along the other), not pixels — the component scales and, on narrow
 * viewports, transposes them. DESIGN-REWORK.md §7: "a left-to-right tree on a
 * phone is the hard case, and the answer is probably to rotate it top-down
 * rather than to shrink it," which is exactly an axis swap on numbers this
 * module already produces.
 */

/**
 * Above this many nodes, drawing everything stops being a tree and starts
 * being a wall. `enumerate`'s own cap (`CandidateTree.maxNodes`, default 500)
 * exists to bound computation; this one exists to bound what a person can
 * look at. Never applied silently — see `selectForDrawing`.
 */
export const DRAW_NODE_CAP = 60

export interface DrawNode extends Omit<PohonNode, 'children'> {
  readonly children: readonly DrawNode[]
  /** Children that exist in the full tree but were cut from this drawing. */
  readonly hiddenSiblingCount: number
}

export interface Selection {
  readonly root: DrawNode
  readonly shown: number
  readonly total: number
  readonly truncated: boolean
}

function countNodes(node: PohonNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

/**
 * Full tree under the cap: draw it as-is. Over the cap: keep every node the
 * search actually visited (`onPath`), plus its immediate siblings — one level
 * of "what else was there" at each point of the walk — and report how many
 * children were cut at each pruned node, so the drawing states its own gaps
 * instead of quietly looking complete. The full set stays reachable in
 * `CandidateTree`'s list form, unaffected by this — DESIGN-REWORK.md §2.6.
 */
export function selectForDrawing(pohon: Pohon, cap: number = DRAW_NODE_CAP): Selection {
  const total = countNodes(pohon.root)

  function prune(node: PohonNode, keepAllChildren: boolean): DrawNode {
    const keep = keepAllChildren || node.children.some((child) => child.onPath)
    const kept = keep ? node.children : node.children.filter((child) => child.onPath)
    return {
      ...node,
      children: kept.map((child) => prune(child, false)),
      hiddenSiblingCount: node.children.length - kept.length,
    }
  }

  if (total <= cap) {
    function full(node: PohonNode): DrawNode {
      return { ...node, children: node.children.map(full), hiddenSiblingCount: 0 }
    }
    return { root: full(pohon.root), shown: total, total, truncated: false }
  }

  const root = prune(pohon.root, true)
  return { root, shown: countNodes(root), total, truncated: true }
}

export interface Placed {
  readonly node: DrawNode
  readonly depth: number
  /** Sequential slot along the cross axis — leaves get one each, in order;
   *  an internal node sits at the mean of its children's slots. */
  readonly slot: number
}

export interface Layout {
  readonly placed: readonly Placed[];
  readonly maxDepth: number
  /** Highest slot value used — the cross-axis extent. */
  readonly maxSlot: number
}

/** Classic tidy-tree-lite: leaves get sequential slots in traversal order;
 *  a parent centres over its children. No overlap avoidance beyond that is
 *  needed — depth is capped at `enumerate`'s `maxDepth` (default 5) and
 *  `selectForDrawing` already bounds the node count. */
export function layoutPohon(root: DrawNode): Layout {
  const placed: Placed[] = []
  let nextSlot = 0

  function place(node: DrawNode, depth: number): number {
    if (node.children.length === 0) {
      const slot = nextSlot
      nextSlot += 1
      placed.push({ node, depth, slot })
      return slot
    }
    const childSlots = node.children.map((child) => place(child, depth + 1))
    const slot = childSlots.reduce((a, b) => a + b, 0) / childSlots.length
    placed.push({ node, depth, slot })
    return slot
  }

  place(root, 0)

  return {
    placed,
    maxDepth: placed.reduce((max, p) => Math.max(max, p.depth), 0),
    maxSlot: Math.max(0, nextSlot - 1),
  }
}
