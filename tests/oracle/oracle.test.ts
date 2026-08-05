import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { dictionary, pack } from '../helpers'

/**
 * Differential comparison against recorded Sastrawi fixtures.
 *
 * The fixtures are recorded by `pnpm fixtures:record`, a development-only
 * script, and are not committed. When they are absent this suite reports the
 * comparison as not-yet-run rather than passing quietly — an empty green
 * oracle suite is a claim of agreement nobody has checked.
 */
const FIXTURES = join(__dirname, 'fixtures.json')

interface OracleFixtures {
  readonly recordedWith: string
  readonly pairs: ReadonlyArray<{ kata: string; sastrawi: string }>
}

describe('Sastrawi oracle', () => {
  if (!existsSync(FIXTURES)) {
    it.skip('not run — record fixtures with `pnpm fixtures:record` first', () => {})
    return
  }

  const fixtures = JSON.parse(readFileSync(FIXTURES, 'utf8')) as OracleFixtures
  const p = pack()
  const d = dictionary()

  it('records every divergence rather than failing on it', () => {
    const divergences = fixtures.pairs
      .map((pair) => ({
        ...pair,
        kupas: interpret({ word: pair.kata, pack: p, dictionary: d }).result,
      }))
      .filter((row) => row.kupas !== row.sastrawi)

    // Deliberately not an equality assertion. Disagreements are investigated
    // and classified in divergences.md, not auto-resolved (invariant 11).
    if (divergences.length > 0) {
      console.log(
        `${divergences.length} divergence(s) to classify:\n` +
          divergences.map((r) => `  ${r.kata}: kupas=${r.kupas} sastrawi=${r.sastrawi}`).join('\n'),
      )
    }

    expect(fixtures.pairs.length).toBeGreaterThan(0)
  })
})
