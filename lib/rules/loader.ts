import { rulePackSchema, type Forbidden, type Rule, type RulePack, type RuleType } from './schema'

/**
 * Rule-pack loading. Packs are validated at build time by
 * `pnpm rules:validate`; parsing again here is cheap and means a hand-edited
 * pack cannot reach the engine malformed.
 */
export function parseRulePack(raw: unknown): RulePack {
  return rulePackSchema.parse(raw)
}

/** Rules of one type, in precedence order. */
export function rulesOfType(pack: RulePack, type: RuleType): Rule[] {
  return pack.rules.filter((rule) => rule.type === type).sort((a, b) => a.precedence - b.precedence)
}

export function ruleById(pack: RulePack, id: string): Rule | undefined {
  return pack.rules.find((rule) => rule.id === id)
}

/**
 * The forbidden prefix-suffix combination for a given prefix, if any.
 * Consulted before prefix removal — PRD §3 step 4.
 */
export function forbiddenFor(pack: RulePack, awalan: string): Forbidden | undefined {
  return pack.forbidden.find((entry) => entry.awalan === awalan)
}

/**
 * Is removing `akhiran` from a word beginning with `awalan` a combination the
 * paper forbids? Returns the table entry so the trace can cite it.
 */
export function forbiddenCombination(
  pack: RulePack,
  awalan: string,
  akhiran: readonly string[],
): Forbidden | undefined {
  const entry = forbiddenFor(pack, awalan)
  if (!entry) return undefined
  return entry.akhiran.some((a) => akhiran.includes(a)) ? entry : undefined
}
