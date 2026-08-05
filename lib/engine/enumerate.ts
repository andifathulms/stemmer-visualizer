import type { Dictionary } from '@/lib/dictionary'
import type { Rule, RulePack } from '@/lib/rules/schema'
import { apply } from '@/lib/rules/apply'
import { normalize, type Span } from './text'
import type { Candidate } from './trace'

/**
 * The rule interpreter, exhaustive traversal: every segmentation the
 * morphology admits, not just the one precedence reaches — PRD §5.2.
 *
 * Same rule data as `interpret.ts`, different traversal (invariant 5). The
 * relationship between the two is soundness, not equality: the root interpret
 * returns must appear here, but this deliberately finds more, and that
 * "more" is the product (invariant 6).
 *
 * Pure and deterministic, like the other traversal.
 */

export interface EnumerateOptions {
  /** How many affix removals deep to go. */
  readonly maxDepth?: number
  /**
   * Node budget. Long words with several ambiguous prefixes blow up
   * combinatorially — PRD §12. Hitting the cap is *reported* on the tree, not
   * silently applied.
   */
  readonly maxNodes?: number
}

const DEFAULT_MAX_DEPTH = 5
const DEFAULT_MAX_NODES = 500

export interface CandidateNode {
  /** Stable path id: the rule ids and readings taken to get here. */
  readonly id: string
  readonly kata: string
  readonly depth: number
  readonly dictionaryValid: boolean
  readonly sumber: string | null
  /** The rule that produced this node from its parent; null at the root. */
  readonly ruleId: string | null
  readonly rule: Rule | null
  readonly readingIndex: number | null
  readonly restored: string | null
  readonly removed: Span | null
  readonly children: readonly CandidateNode[]
  /** True when children were not expanded because a cap was reached. */
  readonly truncated: boolean
}

export interface CandidateTree {
  readonly root: CandidateNode
  /** Dictionary-valid readings, deduplicated by word, shallowest path first. */
  readonly candidates: readonly Candidate[]
  readonly nodeCount: number
  /** True when a cap stopped the traversal. Shown in the UI, never hidden. */
  readonly capped: boolean
  readonly maxDepth: number
  readonly maxNodes: number
}

export interface EnumerateInput {
  readonly word: string
  readonly pack: RulePack
  readonly dictionary: Dictionary
  readonly options?: EnumerateOptions
}

export function enumerate({ word, pack, dictionary, options }: EnumerateInput): CandidateTree {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH
  const maxNodes = options?.maxNodes ?? DEFAULT_MAX_NODES
  const kata = normalize(word)

  // Rules in a fixed order so the tree is byte-identical across runs.
  const rules = [...pack.rules].sort((a, b) =>
    a.precedence === b.precedence ? a.id.localeCompare(b.id) : a.precedence - b.precedence,
  )

  let nodeCount = 1
  let capped = false

  function expand(
    current: string,
    depth: number,
    path: readonly string[],
    seen: ReadonlySet<string>,
    origin: Pick<CandidateNode, 'ruleId' | 'rule' | 'readingIndex' | 'restored' | 'removed'>,
  ): CandidateNode {
    const valid = dictionary.has(current)
    const node = {
      id: path.length === 0 ? kata : path.join('>'),
      kata: current,
      depth,
      dictionaryValid: valid,
      sumber: valid ? (dictionary.sumber(current) ?? null) : null,
      ...origin,
    }

    if (depth >= maxDepth) {
      capped = true
      return { ...node, children: [], truncated: true }
    }

    const children: CandidateNode[] = []
    let truncated = false

    for (const rule of rules) {
      for (const application of apply(rule, current)) {
        // A rule that gives back the word it was given, or a word already on
        // this path, is a cycle rather than a segmentation.
        if (application.to === current || seen.has(application.to)) continue

        if (nodeCount >= maxNodes) {
          capped = true
          truncated = true
          break
        }
        nodeCount += 1

        children.push(
          expand(
            application.to,
            depth + 1,
            [...path, `${rule.id}#${application.readingIndex}`],
            new Set([...seen, application.to]),
            {
              ruleId: rule.id,
              rule,
              readingIndex: application.readingIndex,
              restored: application.restored,
              removed: application.removed,
            },
          ),
        )
      }
      if (truncated) break
    }

    return { ...node, children, truncated }
  }

  const root = expand(kata, 0, [], new Set([kata]), {
    ruleId: null,
    rule: null,
    readingIndex: null,
    restored: null,
    removed: null,
  })

  return {
    root,
    candidates: collectCandidates(root),
    nodeCount,
    capped,
    maxDepth,
    maxNodes,
  }
}

/**
 * Dictionary-valid readings, shallowest first, deduplicated by word — two
 * derivations of the same root are one candidate, and the shorter derivation
 * is the one worth showing.
 */
export function collectCandidates(root: CandidateNode): Candidate[] {
  const best = new Map<string, string[]>()

  function walk(node: CandidateNode, jalur: string[]): void {
    if (node.dictionaryValid) {
      const existing = best.get(node.kata)
      if (!existing || jalur.length < existing.length) best.set(node.kata, jalur)
    }
    for (const child of node.children) {
      walk(child, child.ruleId === null ? jalur : [...jalur, child.ruleId])
    }
  }

  walk(root, [])

  return [...best.entries()]
    .map(([kata, jalur]) => ({ kata, jalur }))
    .sort((a, b) => a.jalur.length - b.jalur.length || a.kata.localeCompare(b.kata, 'id'))
}

/** Every node in the tree, depth-first. For rendering and for counting. */
export function flatten(node: CandidateNode): CandidateNode[] {
  return [node, ...node.children.flatMap(flatten)]
}
