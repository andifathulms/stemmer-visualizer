/**
 * Text handling for morpheme logic.
 *
 * CLAUDE.md invariant 10: never index strings by code unit for morpheme logic.
 * Indonesian is mostly ASCII, so a code-unit index is right nearly always —
 * which is exactly why the one loanword or diacritic that breaks it would go
 * unnoticed. Everything below works in grapheme clusters, and every span in a
 * trace is a grapheme-cluster range.
 */

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('id', { granularity: 'grapheme' })
    : null

/** Normalise to NFC and case-fold. The engine works on normalised input only. */
export function normalize(word: string): string {
  return word.normalize('NFC').toLocaleLowerCase('id')
}

/** Grapheme clusters, in order. */
export function graphemes(word: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(word), (s) => s.segment)
  return Array.from(word)
}

/** Number of grapheme clusters. */
export function length(word: string): number {
  return graphemes(word).length
}

/** Slice by grapheme-cluster index, not code unit. */
export function slice(word: string, start: number, end?: number): string {
  return graphemes(word).slice(start, end).join('')
}

/**
 * A half-open range of grapheme-cluster indices into some word. Every trace
 * step records these so that all highlighting and linking is span-based
 * (CLAUDE.md invariant 8).
 */
export interface Span {
  readonly start: number
  readonly end: number
}

export function span(start: number, end: number): Span {
  return { start, end }
}

export function isEmptySpan(s: Span): boolean {
  return s.end <= s.start
}

/** Convert a code-unit index into a grapheme-cluster index for `word`. */
export function graphemeIndexAt(word: string, codeUnitIndex: number): number {
  let units = 0
  let index = 0
  for (const cluster of graphemes(word)) {
    if (units >= codeUnitIndex) return index
    units += cluster.length
    index += 1
  }
  return index
}
