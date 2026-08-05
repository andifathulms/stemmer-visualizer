import { z } from 'zod'

/**
 * The rule-pack schema.
 *
 * CLAUDE.md invariant 1: no stemming rule is written in application code. A
 * rule is data — a pattern, a rewrite, a precedence, a citation — and the
 * engine is an interpreter over it. The point of that constraint is that a
 * linguist who does not code can audit the rule set, so the schema optimises
 * for readability of `data/rules/*.json` over convenience in the engine.
 */

/** Where the rule comes from. Validator-enforced; the build fails without one. */
export const citationSchema = z.object({
  /** Short source key, e.g. "nazief1996", "asian2005". */
  source: z.string().min(1),
  /** Where inside the source: a rule number, a table, a section. */
  locus: z.string().min(1),
  /** Optional verbatim quotation of the rule as the source states it. */
  quote: z.string().min(1).optional(),
})

export type Citation = z.infer<typeof citationSchema>

/**
 * Whether anybody has actually checked this rule against the paper.
 *
 * CLAUDE.md working style: "When you don't know a rule, say so. Do not fill a
 * gap in the rule set from general knowledge of Indonesian morphology and
 * present it as sourced." A citation says where the rule should be checked;
 * this field says whether it has been. They are not the same claim, so they
 * are two fields. `unverified` rules are marked as such in the UI.
 */
export const verificationSchema = z.enum(['verified', 'unverified'])

export type Verification = z.infer<typeof verificationSchema>

/** A worked example, ideally transcribed from the source. */
export const exampleSchema = z.object({
  input: z.string().min(1),
  /** The string this rule alone produces — not necessarily the final root. */
  output: z.string().min(1),
  note: z.string().optional(),
})

export type Example = z.infer<typeof exampleSchema>

/**
 * Rule ids are stable, namespaced and readable. They appear in the trace, in
 * the rule reference, and in shared URLs, so they are part of the public
 * surface: `na96.suffix.derivational.an`, `na96.prefix.me.recode.ny`.
 */
const ruleId = z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/, {
  message: 'rule id must be lowercase, dot-namespaced, e.g. na96.suffix.derivational.an',
})

const commonRuleFields = {
  id: ruleId,
  /**
   * Anchored regex source with exactly one capturing group: the part of the
   * word that survives this rule. Anchoring is enforced by the validator.
   */
  match: z.string().min(3),
  /**
   * Rewrite templates, tried in precedence order. `$1` is the surviving group.
   * More than one template means the rule admits more than one reading of the
   * same surface form — `meng-` before a vowel may or may not have eaten a
   * `k`, and both readings are real. interpret() takes the first that reaches
   * a dictionary hit; enumerate() takes all of them.
   */
  produces: z.array(z.string().min(1)).min(1),
  /** Lower runs first. Ties within a type are checked for ambiguity. */
  precedence: z.number().int().nonnegative(),
  citation: citationSchema,
  verification: verificationSchema,
  examples: z.array(exampleSchema).min(1),
  /** Indonesian grammatical description; shown in the trace and reference. */
  keterangan: z.string().min(1),
}

/** Partikel: -lah, -kah, -tah, -pun. Inflectional, removed first. */
export const particleRuleSchema = z.object({
  type: z.literal('partikel'),
  akhiran: z.string().min(1),
  ...commonRuleFields,
})

/** Kata ganti milik: -ku, -mu, -nya. Inflectional, removed after particles. */
export const possessiveRuleSchema = z.object({
  type: z.literal('milik'),
  akhiran: z.string().min(1),
  ...commonRuleFields,
})

/** Akhiran derivasional: -i, -an, -kan. */
export const suffixRuleSchema = z.object({
  type: z.literal('akhiran'),
  akhiran: z.string().min(1),
  ...commonRuleFields,
})

/**
 * Awalan derivasional. `jenis` is the prefix type in the sense the paper uses
 * it — te-, me-, be-, pe- need allomorph analysis to determine which type they
 * are, while di-, ke- and se- are plain removals.
 */
export const prefixRuleSchema = z.object({
  type: z.literal('awalan'),
  awalan: z.string().min(1),
  jenis: z.enum(['di', 'ke', 'se', 'te', 'me', 'be', 'pe']),
  /**
   * True when the rule restores a letter that assimilation destroyed
   * (peluruhan): menyapu → sapu. Recoding is where implementations most often
   * diverge, so it is flagged in the data and fixtured case by case.
   */
  peluruhan: z.boolean(),
  ...commonRuleFields,
})

export const ruleSchema = z.discriminatedUnion('type', [
  particleRuleSchema,
  possessiveRuleSchema,
  suffixRuleSchema,
  prefixRuleSchema,
])

export type ParticleRule = z.infer<typeof particleRuleSchema>
export type PossessiveRule = z.infer<typeof possessiveRuleSchema>
export type SuffixRule = z.infer<typeof suffixRuleSchema>
export type PrefixRule = z.infer<typeof prefixRuleSchema>
export type Rule = z.infer<typeof ruleSchema>
export type RuleType = Rule['type']

/**
 * A forbidden prefix-suffix combination. The algorithm consults this table
 * before removing prefixes; finding a match means stopping rather than
 * proceeding (PRD §3 step 4).
 */
export const forbiddenSchema = z.object({
  /**
   * Keyed by prefix *type*, not by surface form: the paper forbids "be- with
   * -i", which covers ber-, bel- and be- alike. Keying by surface would make
   * the table three times as long and silently miss an allomorph.
   */
  jenis: z.enum(['di', 'ke', 'se', 'te', 'me', 'be', 'pe']),
  akhiran: z.array(z.string().min(1)).min(1),
  citation: citationSchema,
  verification: verificationSchema,
  keterangan: z.string().min(1),
})

export type Forbidden = z.infer<typeof forbiddenSchema>

export const rulePackSchema = z.object({
  /** Pack id, also the variant key used in URLs: "na96", "na05". */
  id: z.string().regex(/^[a-z0-9]+$/),
  nama: z.string().min(1),
  name: z.string().min(1),
  deskripsi: z.string().min(1),
  description: z.string().min(1),
  sources: z
    .record(
      z.object({
        title: z.string().min(1),
        authors: z.string().min(1),
        year: z.number().int(),
        venue: z.string().min(1),
        url: z.string().url().optional(),
      }),
    )
    .refine((s) => Object.keys(s).length > 0, { message: 'at least one source' }),
  /** Halt after this many prefix removals — PRD §3, a featured stopping rule. */
  maxPrefixRemovals: z.number().int().positive(),
  rules: z.array(ruleSchema).min(1),
  forbidden: z.array(forbiddenSchema),
})

export type RulePack = z.infer<typeof rulePackSchema>
