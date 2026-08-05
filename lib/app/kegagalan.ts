import type { StemTrace } from '@/lib/engine/trace'

/**
 * Why a word came back unstemmed.
 *
 * When the algorithm gives up, the UI used to say only "not in the dictionary
 * — the word is returned unchanged", which reads as *the algorithm failed*.
 * Usually it did not. For `menendang` the trace is:
 *
 *     lookup menendang        miss
 *     strip  menendang → nendang   abandoned
 *     lookup nendang          miss
 *     strip  menendang → tendang   abandoned   (peluruhan restored the t)
 *     lookup tendang          miss
 *     stop
 *
 * It found `tendang`. It restored the letter that assimilation destroyed, got
 * the right answer, and threw it away — because that word is not in this
 * dictionary. That is the single most important thing this project has to say
 * (PRD §2: the dictionary is an input, not a constant), and it was being
 * reported as a dead end.
 *
 * So: the forms the algorithm actually reached and rejected *only* for being
 * absent. Adding any one of them to the dictionary changes the answer, which
 * is a claim the reader can test in one click.
 */
export interface Kegagalan {
  /** Distinct forms looked up and missed, in the order they were tried. */
  readonly dicoba: readonly string[]
  /**
   * The last form tried before giving up.
   *
   * Deliberately named for what it *is* rather than for what it usually turns
   * out to be. Lookup order follows rule precedence, not depth, so calling it
   * "the deepest" or "the likeliest root" would assert something the trace
   * does not establish. The UI presents it as the furthest the algorithm got,
   * and lets the reader decide.
   */
  readonly terakhir: string | null
}

export function jelaskanKegagalan(trace: StemTrace): Kegagalan | null {
  // Nothing to explain when it succeeded.
  if (trace.found) return null

  const seen = new Set<string>()
  const dicoba: string[] = []

  for (const step of trace.steps) {
    if (step.type !== 'cek-kamus' || step.found) continue
    // The input itself is not interesting: "your word is not a root" is what
    // the reader already knows. The stripped forms are the finding.
    if (step.kata === trace.kata) continue
    if (seen.has(step.kata)) continue
    seen.add(step.kata)
    dicoba.push(step.kata)
  }

  if (dicoba.length === 0) return null

  return { dicoba, terakhir: dicoba[dicoba.length - 1] ?? null }
}
