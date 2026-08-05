import type { Rule } from './schema'
import { graphemeIndexAt, length, type Span } from '@/lib/engine/text'

/**
 * Rule application. This is the whole of "the engine is an interpreter" —
 * everything else is control flow over these results.
 */

export interface Application {
  readonly rule: Rule
  /** The word this rule was applied to. */
  readonly from: string
  /** What the rule produced. */
  readonly to: string
  /** Which template of `rule.produces` produced it, by index. */
  readonly readingIndex: number
  /** Characters the rule removed, as grapheme-cluster indices into `from`. */
  readonly removed: Span
  /** Characters that survived, as grapheme-cluster indices into `from`. */
  readonly kept: Span
  /**
   * A letter restored by peluruhan, if any: menyapu → me- + (s)apu restores
   * "s". It exists in `to` but has no span in `from`, which is exactly why the
   * trace has to record it separately.
   */
  readonly restored: string | null
}

/** True when the rule strips from the front of the word. */
function stripsFromFront(rule: Rule): boolean {
  return rule.type === 'awalan'
}

const cache = new Map<string, RegExp>()

function compile(source: string): RegExp {
  let re = cache.get(source)
  if (!re) {
    re = new RegExp(source, 'u')
    cache.set(source, re)
  }
  return re
}

/**
 * Apply one rule to one word, returning every reading it admits — one per
 * template in `rule.produces`, in order. Empty when the rule does not match.
 *
 * Pure: same rule and same word give the same array, always.
 */
export function apply(rule: Rule, word: string): Application[] {
  const match = compile(rule.match).exec(word)
  if (!match) return []

  const surviving = match[1]
  if (surviving === undefined) return []

  const front = stripsFromFront(rule)
  // The surviving group is a contiguous piece of the word: a suffix of it when
  // the rule strips a prefix, a prefix of it when the rule strips a suffix.
  const codeUnitStart = front ? word.length - surviving.length : 0
  const codeUnitEnd = front ? word.length : surviving.length
  if (word.slice(codeUnitStart, codeUnitEnd) !== surviving) return []

  const keptStart = graphemeIndexAt(word, codeUnitStart)
  const keptEnd = graphemeIndexAt(word, codeUnitEnd)
  const total = length(word)

  const kept: Span = { start: keptStart, end: keptEnd }
  const removed: Span = front ? { start: 0, end: keptStart } : { start: keptEnd, end: total }

  return rule.produces.map((template, readingIndex) => {
    const to = template.replaceAll('$1', surviving)
    // Whatever the template added around the surviving group is a restoration.
    const restoredText = template.replaceAll('$1', '')
    return {
      rule,
      from: word,
      to,
      readingIndex,
      removed,
      kept,
      restored: restoredText === '' ? null : restoredText,
    }
  })
}

/** Every application of every rule in `rules`, in precedence order. */
export function applyAll(rules: readonly Rule[], word: string): Application[] {
  return [...rules]
    .sort((a, b) => a.precedence - b.precedence)
    .flatMap((rule) => apply(rule, word))
}
