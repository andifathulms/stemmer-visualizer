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
 * The forbidden-combination entry for a prefix type, if the table has one.
 * Consulted before prefix removal — PRD §3 step 4.
 */
export function forbiddenFor(pack: RulePack, jenis: Forbidden['jenis']): Forbidden | undefined {
  return pack.forbidden.find((entry) => entry.jenis === jenis)
}

/**
 * Does the prefix type `jenis` clash with any suffix already removed? Returns
 * the table entry so the trace can cite it, and the offending suffix so the
 * trace can say which one it was.
 */
export function forbiddenCombination(
  pack: RulePack,
  jenis: Forbidden['jenis'],
  removedAkhiran: readonly string[],
): { entry: Forbidden; akhiran: string } | undefined {
  const entry = forbiddenFor(pack, jenis)
  if (!entry) return undefined
  const akhiran = entry.akhiran.find((a) => removedAkhiran.includes(a))
  return akhiran === undefined ? undefined : { entry, akhiran }
}
