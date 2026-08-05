import type { PrefixRule, Rule, RulePack } from '@/lib/rules/schema'
import { apply } from '@/lib/rules/apply'

/**
 * Prefix-type determination (penentuan jenis awalan).
 *
 * di-, ke- and se- are plain removals; te-, me-, be- and pe- need allomorph
 * analysis to know which type they are — PRD §3 step 4. This module *reports*
 * that determination; it does not encode it. The tables live in the rule pack
 * (invariant 1), and the type is whatever the matching rule declares as its
 * `jenis`. If this file ever grows a lookup table of allomorphs, the rule model
 * has been bypassed.
 */

export function isPrefixRule(rule: Rule): rule is PrefixRule {
  return rule.type === 'awalan'
}

export interface PrefixDetermination {
  readonly rule: PrefixRule
  /** Surface form as the pack names it: "meng-", "ber-", "te-". */
  readonly awalan: string
  readonly jenis: PrefixRule['jenis']
  /** True when the prefix needs allomorph analysis rather than plain removal. */
  readonly needsAllomorphAnalysis: boolean
  /** True when this rule restores an assimilated letter. */
  readonly peluruhan: boolean
}

const PLAIN: ReadonlySet<PrefixRule['jenis']> = new Set(['di', 'ke', 'se'])

/**
 * Every prefix rule that matches `word`, in precedence order — the candidates
 * for this iteration. The interpreter takes them in order; enumerate takes
 * them all.
 */
export function determinePrefix(pack: RulePack, word: string): PrefixDetermination[] {
  return pack.rules
    .filter(isPrefixRule)
    .sort((a, b) => a.precedence - b.precedence)
    .filter((rule) => apply(rule, word).length > 0)
    .map((rule) => ({
      rule,
      awalan: rule.awalan,
      jenis: rule.jenis,
      needsAllomorphAnalysis: !PLAIN.has(rule.jenis),
      peluruhan: rule.peluruhan,
    }))
}
