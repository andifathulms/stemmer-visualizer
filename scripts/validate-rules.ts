/**
 * Build-time rule-pack validation. `pnpm build` runs this first and the build
 * fails if it fails — PRD §7, "rule-pack integrity, at build time".
 *
 * What it enforces, and why each check exists:
 *
 *  1. The pack parses against the schema.
 *  2. Rule ids are unique and namespaced under the pack id — they appear in
 *     traces and in shared URLs, so a collision breaks a permalink.
 *  3. Every `match` is anchored and has exactly one capturing group. An
 *     unanchored pattern would match mid-word and silently produce nonsense.
 *  4. Every `produces` template references the surviving group.
 *  5. Every rule carries a citation and a verification status. A rule you
 *     cannot cite is a rule you do not know well enough to ship.
 *  6. Every worked example actually reproduces under its own rule.
 *  7. No two rules of the same type and equal precedence match the same input
 *     ambiguously — if they do, the algorithm's answer depends on array order,
 *     which is not a rule, it is an accident.
 *
 * It never rewrites a pack to make a check pass.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { rulePackSchema, type Rule, type RulePack } from '../lib/rules/schema'
import { apply } from '../lib/rules/apply'

const RULES_DIR = join(process.cwd(), 'data', 'rules')

const problems: string[] = []
const notes: string[] = []

function fail(where: string, message: string): void {
  problems.push(`${where}: ${message}`)
}

function countGroups(source: string): number {
  // Capturing groups only: "(" not followed by "?".
  return (source.match(/\((?!\?)/g) ?? []).length
}

function checkRule(pack: RulePack, rule: Rule, seen: Set<string>): void {
  const where = rule.id

  if (seen.has(rule.id)) fail(where, 'duplicate rule id')
  seen.add(rule.id)

  if (!rule.id.startsWith(`${pack.id}.`)) {
    fail(where, `rule id must be namespaced under the pack id "${pack.id}."`)
  }

  if (!rule.match.startsWith('^') || !rule.match.endsWith('$')) {
    fail(where, `match must be anchored with ^ and $ — got ${rule.match}`)
  }

  const groups = countGroups(rule.match)
  if (groups !== 1) {
    fail(where, `match must have exactly one capturing group, found ${groups}`)
  }

  try {
    new RegExp(rule.match, 'u')
  } catch (error) {
    fail(where, `match is not a valid regex: ${(error as Error).message}`)
  }

  rule.produces.forEach((template, index) => {
    if (!template.includes('$1')) {
      fail(where, `produces[${index}] "${template}" does not reference the surviving group $1`)
    }
  })

  if (rule.citation.source && !pack.sources[rule.citation.source]) {
    fail(where, `citation.source "${rule.citation.source}" is not declared in pack.sources`)
  }

  if (rule.verification === 'unverified') {
    notes.push(`${rule.id} — unverified, cited to ${rule.citation.source} ${rule.citation.locus}`)
  }

  for (const example of rule.examples) {
    const readings = apply(rule, example.input)
    if (readings.length === 0) {
      fail(where, `example "${example.input}" does not match the rule's own pattern`)
      continue
    }
    if (!readings.some((reading) => reading.to === example.output)) {
      fail(
        where,
        `example "${example.input}" → "${example.output}" is not among this rule's readings: ` +
          readings.map((r) => r.to).join(', '),
      )
    }
  }
}

/**
 * Probe corpus for the ambiguity check: every example input in the pack, plus
 * every intermediate form those examples produce. Small, but it is exactly the
 * set of strings the pack itself claims to care about.
 */
function probeCorpus(pack: RulePack): string[] {
  const probes = new Set<string>()
  for (const rule of pack.rules) {
    for (const example of rule.examples) {
      probes.add(example.input)
      probes.add(example.output)
    }
  }
  return [...probes]
}

function checkPrecedenceConflicts(pack: RulePack): void {
  const probes = probeCorpus(pack)

  for (let i = 0; i < pack.rules.length; i += 1) {
    for (let j = i + 1; j < pack.rules.length; j += 1) {
      const a = pack.rules[i]
      const b = pack.rules[j]
      if (!a || !b) continue
      if (a.type !== b.type || a.precedence !== b.precedence) continue

      if (a.match === b.match) {
        fail(`${a.id} / ${b.id}`, `identical pattern at equal precedence ${a.precedence}`)
        continue
      }

      const clash = probes.find((probe) => apply(a, probe).length > 0 && apply(b, probe).length > 0)
      if (clash !== undefined) {
        fail(
          `${a.id} / ${b.id}`,
          `both match "${clash}" at equal precedence ${a.precedence}; the outcome would depend on array order`,
        )
      }
    }
  }
}

function checkForbidden(pack: RulePack): void {
  const prefixes = new Set(
    pack.rules.filter((rule) => rule.type === 'awalan').map((rule) => rule.awalan),
  )
  for (const entry of pack.forbidden) {
    if (prefixes.size > 0 && !prefixes.has(entry.awalan)) {
      fail(`forbidden[${entry.awalan}]`, 'names a prefix that no rule in this pack produces')
    }
    if (!pack.sources[entry.citation.source]) {
      fail(`forbidden[${entry.awalan}]`, `citation.source "${entry.citation.source}" undeclared`)
    }
    if (entry.verification === 'unverified') {
      notes.push(
        `forbidden ${entry.awalan} — unverified, cited to ${entry.citation.source} ${entry.citation.locus}`,
      )
    }
  }
}

function main(): void {
  if (!existsSync(RULES_DIR)) {
    console.error(`✗ ${RULES_DIR} does not exist`)
    process.exit(1)
  }

  const files = readdirSync(RULES_DIR).filter((file) => file.endsWith('.json'))

  if (files.length === 0) {
    console.log('· no rule packs yet — validator is in place, content comes next')
    return
  }

  for (const file of files) {
    const raw: unknown = JSON.parse(readFileSync(join(RULES_DIR, file), 'utf8'))
    const parsed = rulePackSchema.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fail(file, `${issue.path.join('.') || '<root>'} — ${issue.message}`)
      }
      continue
    }

    const pack = parsed.data
    const seen = new Set<string>()
    for (const rule of pack.rules) checkRule(pack, rule, seen)
    checkPrecedenceConflicts(pack)
    checkForbidden(pack)

    console.log(`· ${file}: ${pack.rules.length} rules, ${pack.forbidden.length} forbidden entries`)
  }

  if (notes.length > 0) {
    console.log(`\n${notes.length} rule(s) not yet checked against the source paper:`)
    for (const note of notes) console.log(`  ? ${note}`)
    console.log('  These are marked unverified in the UI. Do not cite them as sourced.')
  }

  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} problem(s):`)
    for (const problem of problems) console.error(`  ${problem}`)
    process.exit(1)
  }

  console.log('\n✓ rule packs valid')
}

main()
