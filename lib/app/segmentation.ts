import { graphemes } from '@/lib/engine/text'
import type { StemTrace } from '@/lib/engine/trace'
import { isRemoval } from '@/lib/engine/trace'

/**
 * The word laid out with morpheme boundaries, as of a given step — PRD §5.1.
 *
 * Spans in a trace are relative to each step's own input word, so drawing them
 * on the original word means tracking a window into it: prefixes eat from the
 * front, suffixes from the back, and what is left in the middle is the stem so
 * far. That is also literally how the pencil slashes get drawn on paper.
 */

export type MorphemeKind = 'awalan' | 'akhiran' | 'sisa'

export interface Morpheme {
  readonly text: string
  readonly kind: MorphemeKind
  readonly ruleId: string | null
}

export interface Segmentation {
  readonly morphemes: readonly Morpheme[]
  /** The letter peluruhan restored, if the visible step restored one. */
  readonly restored: string | null
  /** True once every accepted removal has been applied. */
  readonly complete: boolean
}

/**
 * @param upTo how many steps of the trace to have walked; pass
 *   `trace.steps.length` for the finished analysis.
 */
export function segmentAt(trace: StemTrace, upTo: number): Segmentation {
  const letters = graphemes(trace.kata)
  let start = 0
  let end = letters.length

  const front: Morpheme[] = []
  const back: Morpheme[] = []
  let restored: string | null = null

  const applied = trace.steps
    .slice(0, upTo)
    .filter(isRemoval)
    .filter((step) => !step.abandoned)

  for (const step of applied) {
    const size = step.removed.end - step.removed.start
    if (size <= 0) continue

    if (step.rule.type === 'awalan') {
      front.push({
        text: letters.slice(start, start + size).join(''),
        kind: 'awalan',
        ruleId: step.ruleId,
      })
      start += size
    } else {
      back.unshift({
        text: letters.slice(end - size, end).join(''),
        kind: 'akhiran',
        ruleId: step.ruleId,
      })
      end -= size
    }
    if (step.restored !== null) restored = step.restored
  }

  const sisa: Morpheme = {
    text: letters.slice(start, end).join(''),
    kind: 'sisa',
    ruleId: null,
  }

  const total = trace.steps.filter(isRemoval).filter((step) => !step.abandoned).length

  return {
    morphemes: [...front, sisa, ...back],
    restored,
    complete: applied.length === total,
  }
}
