import type { Citation, Forbidden, Rule } from '@/lib/rules/schema'
import type { Span } from './text'

/**
 * The trace is the product — PRD §2. Everything the algorithm did, in order,
 * including what it tried and undid.
 *
 * Two invariants shape these types more than anything else:
 *
 *   - Backtracks are recorded, never erased (invariant 9). An abandoned step
 *     stays in `steps` with `abandoned: true`; the UI strikes it through. A
 *     trace that drops its dead ends is a trace of an algorithm that never
 *     searched, which is a lie about this algorithm.
 *   - Every step records spans (invariant 8), in grapheme-cluster indices into
 *     the step's own input word.
 */

export type StepKind = 'cek-kamus' | 'buang' | 'kombinasi-terlarang' | 'berhenti'

interface StepBase {
  /** Position in `StemTrace.steps`. Stable, and what a user cites. */
  readonly index: number
  /** How deep into prefix stripping this step sits; 0 for suffix work. */
  readonly iterasi: number
  /**
   * True when a later failure abandoned this step. Set by the interpreter on
   * the way back up; never removed.
   */
  readonly abandoned: boolean
}

/** A dictionary lookup and its answer. The algorithm's only question. */
export interface LookupStep extends StepBase {
  readonly type: 'cek-kamus'
  readonly kata: string
  readonly found: boolean
  /** Provenance of the entry, when it was a hit. */
  readonly sumber: string | null
}

/** An affix removal, with the rule that licensed it. */
export interface RemovalStep extends StepBase {
  readonly type: 'buang'
  readonly ruleId: string
  readonly rule: Rule
  readonly dari: string
  readonly ke: string
  /** Which reading of the rule this was, when the rule admits several. */
  readonly readingIndex: number
  readonly totalReadings: number
  readonly removed: Span
  readonly kept: Span
  /** The letter peluruhan put back, if any. It has no span in `dari`. */
  readonly restored: string | null
}

/** The forbidden prefix-suffix table said stop. */
export interface ForbiddenStep extends StepBase {
  readonly type: 'kombinasi-terlarang'
  readonly jenis: Forbidden['jenis']
  readonly akhiran: string
  readonly citation: Citation
  readonly keterangan: string
}

/**
 * Why the algorithm stopped. Two of these are the non-obvious stopping
 * conditions PRD §3 asks to be featured: a repeated prefix, and the
 * three-removal limit.
 */
export type StopReason =
  | 'ditemukan-di-kamus'
  | 'awalan-berulang'
  | 'batas-iterasi-awalan'
  | 'kombinasi-terlarang'
  | 'tidak-ada-aturan-yang-cocok'

export interface StopStep extends StepBase {
  readonly type: 'berhenti'
  readonly reason: StopReason
  readonly kata: string
}

export type TraceStep = LookupStep | RemovalStep | ForbiddenStep | StopStep

/** A dictionary-valid analysis of the input word. */
export interface Candidate {
  readonly kata: string
  /** The rule ids applied to reach it, in order. Empty means "the word itself". */
  readonly jalur: readonly string[]
}

/**
 * Why the algorithm chose the root it chose, when more than one was available.
 *
 * Invariant 7: a `chosen` without a `reason` is a bug. The type enforces it —
 * `reason` is not optional, and `reasonCode` keeps it translatable rather than
 * a hand-written sentence per site.
 */
export type ReasonCode =
  | 'kata-ada-di-kamus'
  | 'bacaan-pertama'
  | 'urutan-aturan'
  | 'satu-satunya-yang-cocok'

export interface Ambiguity {
  readonly chosen: string
  readonly reasonCode: ReasonCode
  readonly reason: string
  /** Every dictionary-valid reading, including the chosen one. */
  readonly alternatives: readonly Candidate[]
}

export interface StemTrace {
  readonly input: string
  /** NFC-normalised, case-folded. The engine works on this. */
  readonly kata: string
  /** Rule pack id — the variant. */
  readonly variant: string
  readonly dictionaryId: string
  readonly steps: readonly TraceStep[]
  /** The algorithm's answer. Equals `kata` when nothing worked. */
  readonly result: string
  /** Whether `result` is a dictionary hit, or a graceful give-up. */
  readonly found: boolean
  /**
   * Present whenever more than one dictionary-valid root exists — reported,
   * never silently resolved (invariant 7).
   */
  readonly ambiguity: Ambiguity | null
}

export function isRemoval(step: TraceStep): step is RemovalStep {
  return step.type === 'buang'
}

export function isLookup(step: TraceStep): step is LookupStep {
  return step.type === 'cek-kamus'
}

/** The removals that survived — the analysis the algorithm settled on. */
export function acceptedRemovals(trace: StemTrace): RemovalStep[] {
  return trace.steps.filter(isRemoval).filter((step) => !step.abandoned)
}

/** The removals it tried and undid. The search, visible as a search. */
export function abandonedRemovals(trace: StemTrace): RemovalStep[] {
  return trace.steps.filter(isRemoval).filter((step) => step.abandoned)
}
