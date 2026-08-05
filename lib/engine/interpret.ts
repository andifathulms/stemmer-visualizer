import type { Dictionary } from '@/lib/dictionary'
import type { Citation, Forbidden, Rule, RulePack } from '@/lib/rules/schema'
import { apply, type Application } from '@/lib/rules/apply'
import { rulesOfType } from '@/lib/rules/loader'
import { checkForbidden } from './forbidden'
import { determinePrefix } from './prefixType'
import { normalize } from './text'
import type {
  ForbiddenStep,
  LookupStep,
  RemovalStep,
  StemTrace,
  StopReason,
  StopStep,
  TraceStep,
} from './trace'

/**
 * The rule interpreter, precedence traversal: run Nazief & Adriani as
 * specified and return the algorithm's answer, plus the record of how it got
 * there — PRD §5.1.
 *
 * Pure and deterministic (invariant 4): no clock, no randomness, no DOM, no
 * module-level state. The same word, variant, rule set and dictionary give a
 * byte-identical trace, which is what makes a shared URL mean anything.
 *
 * `enumerate.ts` is the other traversal over the same rule data. It explores
 * what this one prunes; see invariant 5.
 */

export interface InterpretInput {
  readonly word: string
  readonly pack: RulePack
  readonly dictionary: Dictionary
}

/** A step before the recorder stamps its index and abandoned flag on it. */
type Draft<T extends TraceStep> = Omit<T, 'index' | 'abandoned'>
type DraftStep =
  | Draft<LookupStep>
  | Draft<RemovalStep>
  | Draft<ForbiddenStep>
  | Draft<StopStep>

class Recorder {
  readonly steps: TraceStep[] = []

  private push(step: DraftStep): number {
    const index = this.steps.length
    this.steps.push({ ...step, index, abandoned: false } as TraceStep)
    return index
  }

  lookup(kata: string, dictionary: Dictionary, iterasi: number): boolean {
    const found = dictionary.has(kata)
    this.push({
      type: 'cek-kamus',
      kata,
      found,
      sumber: found ? (dictionary.sumber(kata) ?? null) : null,
      iterasi,
    })
    return found
  }

  removal(application: Application, iterasi: number): number {
    return this.push({
      type: 'buang',
      ruleId: application.rule.id,
      rule: application.rule,
      dari: application.from,
      ke: application.to,
      readingIndex: application.readingIndex,
      totalReadings: application.rule.produces.length,
      removed: application.removed,
      kept: application.kept,
      restored: application.restored,
      iterasi,
    })
  }

  forbidden(
    jenis: Forbidden['jenis'],
    akhiran: string,
    citation: Citation,
    keterangan: string,
    iterasi: number,
  ): void {
    this.push({ type: 'kombinasi-terlarang', jenis, akhiran, citation, keterangan, iterasi })
  }

  stop(reason: StopReason, kata: string, iterasi: number): void {
    this.push({ type: 'berhenti', reason, kata, iterasi })
  }

  /**
   * Undo a branch: every removal recorded from `from` onwards is marked
   * abandoned. It stays in the list — invariant 9. Lookups are left alone,
   * since a lookup that missed still genuinely happened and its answer stands.
   */
  abandonFrom(from: number): void {
    for (let i = from; i < this.steps.length; i += 1) {
      const step = this.steps[i]
      if (step && step.type === 'buang') this.steps[i] = { ...step, abandoned: true }
    }
  }
}

interface Search {
  readonly pack: RulePack
  readonly dictionary: Dictionary
  readonly recorder: Recorder
}

/** Apply one rule and take its readings in order. */
function readings(rule: Rule, word: string): Application[] {
  return apply(rule, word)
}

/**
 * Prefix stripping, up to `pack.maxPrefixRemovals` iterations.
 *
 * Two stopping conditions here are the non-obvious ones PRD §3 asks to be
 * featured, so both get their own step in the trace rather than a silent
 * return: a prefix that repeats the one just removed, and the iteration cap.
 */
function stripPrefixes(
  search: Search,
  word: string,
  iterasi: number,
  removedAkhiran: readonly string[],
  previousAwalan: string | null,
): string | null {
  const { pack, dictionary, recorder } = search

  if (iterasi > pack.maxPrefixRemovals) {
    recorder.stop('batas-iterasi-awalan', word, iterasi)
    return null
  }

  const determinations = determinePrefix(pack, word)
  if (determinations.length === 0) return null

  // The table is consulted before removing anything — PRD §3 step 4.
  const first = determinations[0]
  if (first) {
    const verdict = checkForbidden(pack, first.jenis, removedAkhiran)
    if (verdict) {
      recorder.forbidden(
        first.jenis,
        verdict.akhiran,
        verdict.entry.citation,
        verdict.entry.keterangan,
        iterasi,
      )
      recorder.stop('kombinasi-terlarang', word, iterasi)
      return null
    }
  }

  for (const determination of determinations) {
    // "The algorithm halts if a second prefix matches the first one removed."
    if (previousAwalan !== null && determination.awalan === previousAwalan) {
      recorder.stop('awalan-berulang', word, iterasi)
      return null
    }

    for (const application of readings(determination.rule, word)) {
      const branch = recorder.removal(application, iterasi)

      if (recorder.lookup(application.to, dictionary, iterasi)) return application.to

      const deeper = stripPrefixes(
        search,
        application.to,
        iterasi + 1,
        removedAkhiran,
        determination.awalan,
      )
      if (deeper !== null) return deeper

      recorder.abandonFrom(branch)
    }
  }

  return null
}

/**
 * Derivational suffix removal, then prefixes. Each suffix reading that fails
 * is restored and the next tried — that restoration is the backtracking the
 * trace is here to show.
 */
function stripDerivational(
  search: Search,
  word: string,
  removedAkhiran: readonly string[],
): string | null {
  const { pack, dictionary, recorder } = search

  for (const rule of rulesOfType(pack, 'akhiran')) {
    for (const application of readings(rule, word)) {
      const branch = recorder.removal(application, 0)

      if (recorder.lookup(application.to, dictionary, 0)) return application.to

      const withPrefixes = stripPrefixes(
        search,
        application.to,
        1,
        [...removedAkhiran, rule.akhiran],
        null,
      )
      if (withPrefixes !== null) return withPrefixes

      recorder.abandonFrom(branch)
    }
  }

  // No derivational suffix, or none of them led anywhere: try the prefixes on
  // the word as it stands.
  return stripPrefixes(search, word, 1, removedAkhiran, null)
}

/**
 * Inflectional suffixes: particles first, then possessives, checking the
 * dictionary after each — PRD §3 step 2. Removal here is greedy rather than
 * searched, which is what the algorithm specifies; where that greed costs a
 * correct answer, the word belongs in the failure gallery, not in a patch.
 */
function stripInflectional(
  search: Search,
  word: string,
): { kata: string; found: boolean; removed: string[] } {
  const { pack, dictionary, recorder } = search
  const removed: string[] = []
  let current = word

  for (const type of ['partikel', 'milik'] as const) {
    for (const rule of rulesOfType(pack, type)) {
      const application = readings(rule, current)[0]
      if (!application) continue
      recorder.removal(application, 0)
      removed.push(rule.akhiran)
      current = application.to
      if (recorder.lookup(current, dictionary, 0)) {
        return { kata: current, found: true, removed }
      }
      break
    }
  }

  return { kata: current, found: false, removed }
}

export function interpret({ word, pack, dictionary }: InterpretInput): StemTrace {
  const kata = normalize(word)
  const recorder = new Recorder()
  const search: Search = { pack, dictionary, recorder }

  const base = {
    input: word,
    kata,
    variant: pack.id,
    dictionaryId: dictionary.id,
    ambiguity: null,
  } as const

  // 1. Dictionary lookup. Found → it's a root, stop.
  if (recorder.lookup(kata, dictionary, 0)) {
    recorder.stop('ditemukan-di-kamus', kata, 0)
    return { ...base, steps: recorder.steps, result: kata, found: true }
  }

  // 2. Inflectional suffixes.
  const inflectional = stripInflectional(search, kata)
  if (inflectional.found) {
    recorder.stop('ditemukan-di-kamus', inflectional.kata, 0)
    return { ...base, steps: recorder.steps, result: inflectional.kata, found: true }
  }

  // 3-5. Derivational suffixes, then prefixes, with backtracking and recoding.
  const result = stripDerivational(search, inflectional.kata, inflectional.removed)
  if (result !== null) {
    recorder.stop('ditemukan-di-kamus', result, 0)
    return { ...base, steps: recorder.steps, result, found: true }
  }

  // 6. Give up gracefully: the original word, unchanged. Everything tried on
  // the way is abandoned, and all of it stays in the trace.
  recorder.abandonFrom(0)
  recorder.stop('tidak-ada-aturan-yang-cocok', kata, 0)
  return { ...base, steps: recorder.steps, result: kata, found: false }
}
