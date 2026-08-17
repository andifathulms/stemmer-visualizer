import type { CandidateNode, CandidateTree } from '@/lib/engine/enumerate'
import type { StemTrace } from '@/lib/engine/trace'

/**
 * `PohonPelusuran` — the drawn search tree. DESIGN-REWORK.md §0/§2: `interpret`
 * and `enumerate` are two traversals of the same tree (CLAUDE.md invariant 5),
 * and this module is the join between their two already-computed outputs.
 *
 * It adds no stemming semantics of its own. `StemTrace.steps` and
 * `CandidateTree`'s nodes already carry the same identifying fields — a rule
 * id, a reading index, the word before and after — because `StepList` already
 * cross-references a step to its rule in `/aturan` by exactly those fields.
 * This is that same cross-reference, run the other direction: given the two
 * finished, pure structures, which nodes of the full search space did
 * `interpret` actually visit, and which of those did it back out of.
 *
 * The matching is purely structural — no knowledge of which phase of the
 * algorithm produced a step. A `RemovalStep` always records the word it
 * started from (`dari`); a candidate node's parent always has that as its
 * `kata`. Walking the trace with a stack, popping until the top of the stack
 * matches a step's starting word, reconstructs exactly the path `interpret`
 * walked — including the branches it entered and abandoned — without
 * re-encoding interpret.ts's own control flow here. That would be the thing
 * invariant 5 forbids: a second, divergent copy of the algorithm's shape.
 */

export type AbandonReason =
  | { readonly kind: 'kamus' }
  | { readonly kind: 'kombinasi-terlarang'; readonly keterangan: string }

export interface PohonNode extends Omit<CandidateNode, 'children'> {
  /** `interpret` visited this node — tried it, whether or not it kept it. */
  readonly onPath: boolean
  /** Set on a `buang` node precedence tried and then backed out of. */
  readonly abandoned: boolean
  /** Why, when `abandoned` — the lookup that missed, or the table that stopped it. */
  readonly abandonReason: AbandonReason | null
  readonly children: readonly PohonNode[]
}

export interface Pohon {
  readonly root: PohonNode
  /** The node `interpret` actually settled on. Null only if nothing in the
   *  tree corresponds to `trace.result`, which should not happen — soundness
   *  (invariant 6) says the result is always somewhere in here. */
  readonly resultNodeId: string | null
  readonly nodeCount: number
  readonly capped: boolean
  readonly maxNodes: number
}

/** Writable during construction only; `buildPohon` returns it as `Pohon`,
 *  which is readonly like every other engine-adjacent output in this app. */
type Draft = { -readonly [K in keyof PohonNode]: K extends 'children' ? Draft[] : PohonNode[K] }

function toMutable(node: CandidateNode): Draft {
  return {
    ...node,
    onPath: false,
    abandoned: false,
    abandonReason: null,
    children: node.children.map(toMutable),
  }
}

function findChild(node: Draft, ruleId: string, readingIndex: number, kata: string): Draft | undefined {
  return node.children.find(
    (child) => child.ruleId === ruleId && child.readingIndex === readingIndex && child.kata === kata,
  )
}

/**
 * Mutates nodes in place (they are freshly cloned by `toMutable` per call, so
 * this never touches the `CandidateTree` the caller passed in) while walking
 * `trace.steps` once, in order.
 */
export function buildPohon(trace: StemTrace, tree: CandidateTree): Pohon {
  const root = toMutable(tree.root)
  root.onPath = true

  // The search's current position, as a stack so a `buang` step that starts
  // from an earlier word than the top of stack pops back to it first — that
  // pop is the reconstructed backtrack.
  const stack: Draft[] = [root]

  function popTo(kata: string): Draft {
    while (stack.length > 1 && stack[stack.length - 1]!.kata !== kata) stack.pop()
    return stack[stack.length - 1]!
  }

  for (const step of trace.steps) {
    if (step.type === 'buang') {
      const parent = popTo(step.dari)
      const child = findChild(parent, step.ruleId, step.readingIndex, step.ke)
      if (!child) continue // defensive: soundness guarantees this exists
      child.onPath = true
      child.abandoned = step.abandoned
      stack.push(child)
    } else if (step.type === 'cek-kamus') {
      const node = popTo(step.kata)
      node.onPath = true
      if (!step.found && node.abandonReason === null) {
        node.abandonReason = { kind: 'kamus' }
      }
    } else if (step.type === 'kombinasi-terlarang') {
      const node = stack[stack.length - 1]!
      node.abandonReason = { kind: 'kombinasi-terlarang', keterangan: step.keterangan }
    }
    // 'berhenti' carries no tree position of its own — it reports why the
    // search at the current top-of-stack ended, which is already captured.
  }

  const resultNodeId = trace.found ? stack[stack.length - 1]!.id : root.id

  return {
    root,
    resultNodeId,
    nodeCount: tree.nodeCount,
    capped: tree.capped,
    maxNodes: tree.maxNodes,
  }
}

/** Every node, depth-first — for layout and for counting. */
export function flattenPohon(node: PohonNode): PohonNode[] {
  return [node, ...node.children.flatMap(flattenPohon)]
}
